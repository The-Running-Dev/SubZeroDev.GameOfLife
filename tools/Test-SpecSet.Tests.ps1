#Requires -Version 7.0
#Requires -Modules Pester

BeforeAll { . (Join-Path $PSScriptRoot 'Test-SpecSet.ps1') }

Describe 'Test-SpecSet runner' {
    It 'maps every contracted state and throws on an unknown one' {
        Get-SpecSetExitCode Valid | Should -Be 0
        Get-SpecSetExitCode Invalid | Should -Be 1
        Get-SpecSetExitCode NotEvaluated | Should -Be 2
        { Get-SpecSetExitCode Other } | Should -Throw
    }
    It 'fails closed when the provisional register is absent and keeps the result available when quiet' {
        $result = & (Join-Path $PSScriptRoot 'Test-SpecSet.ps1') -Quiet
        $result.State | Should -Be 'NotEvaluated'
        $result.Reason | Should -Be 'RegisterAbsent'
        $result.Unchecked.Reason | Should -Contain 'RegisterAbsent'
        $result.Counts.Documents | Should -Be 8
    }
}

Describe 'S3.1/S3.5: the mirror check holds against the real corpus as it stands' {
    It 'raises no mirror findings anywhere in the real corpus, including §3.5 skills' {
        $index = Read-SpecSetIndex -CorpusPath (Join-Path (Split-Path -Parent $PSScriptRoot) 'docs/docs/games')
        $index.State | Should -Be 'Indexed'
        $findings = Get-MirrorFindings -Index $index
        $findings.Count | Should -Be 0
    }
}

Describe 'S3.2: the mirror check catches attribute drift in both directions' {
    BeforeAll {
        $script:FixtureRoot = Join-Path $TestDrive 'games'
        Copy-Item -Recurse -Path (Join-Path (Split-Path -Parent $PSScriptRoot) 'docs/docs/games') -Destination $script:FixtureRoot
        $script:GameDesignPath = Join-Path $script:FixtureRoot '03-game-design.md'
        $script:OriginalText = Get-Content -LiteralPath $script:GameDesignPath -Raw
    }

    It 'is clean while §3.1 still mentions wisdom' {
        $index = Read-SpecSetIndex -CorpusPath $script:FixtureRoot
        (Get-MirrorFindings -Index $index).Count | Should -Be 0
    }

    It 'raises exactly one finding naming AttributeState.wisdom once wisdom is deleted from §3.1' {
        $mutated = $script:OriginalText -replace 'resilience, wisdom, luck', 'resilience, luck'
        $mutated | Should -Not -Be $script:OriginalText
        Set-Content -LiteralPath $script:GameDesignPath -Value $mutated -NoNewline

        $index = Read-SpecSetIndex -CorpusPath $script:FixtureRoot
        $findings = Get-MirrorFindings -Index $index
        $findings.Count | Should -Be 1
        $findings[0].Subject | Should -Be 'AttributeState.wisdom'
        $findings[0].Detail | Should -Match 'AttributeState\.wisdom'
        $findings[0].Detail | Should -Match '04-engine-specification\.md'
        $findings[0].Detail | Should -Match '03-game-design\.md'
    }

    It 'returns to clean once wisdom is restored' {
        Set-Content -LiteralPath $script:GameDesignPath -Value $script:OriginalText -NoNewline
        $index = Read-SpecSetIndex -CorpusPath $script:FixtureRoot
        (Get-MirrorFindings -Index $index).Count | Should -Be 0
    }
}

Describe 'S3.3: SpecFinding never records which side is stale' {
    It 'declares only CheckId, Subject, DocumentPath, Line and Detail' {
        $props = @([SpecFinding].GetProperties().Name)
        $props | Should -Not -Contain 'Culprit'
        $props | Should -Not -Contain 'Stale'
        $props | Should -Not -Contain 'Correct'
        $props | Sort-Object | Should -Be @('CheckId', 'Detail', 'DocumentPath', 'Line', 'Subject')
    }
}

Describe 'S3.4: mirror obligations that cannot hold' {
    It 'raises a finding for an obligation naming an open declaration' {
        $corpus = Join-Path $TestDrive 'open-decl'; New-Item -ItemType Directory -Path $corpus | Out-Null
        $content = @'
# Fixture

```typescript
interface ActorState {
  skills: Record<string, number>;
}
type PlayerState = ActorState;
```

Skills: <!-- mirror-PlayerState.skills:declared:start -->cooking<!-- mirror-PlayerState.skills:declared:end -->
'@
        Set-Content -LiteralPath (Join-Path $corpus '01-fixture.md') -Value $content -NoNewline
        $index = Read-SpecSetIndex -CorpusPath $corpus
        $findings = Get-MirrorFindings -Index $index
        $findings.Count | Should -Be 1
        $findings[0].Subject | Should -Be 'PlayerState.skills'
    }
    It 'raises a finding for an obligation naming a declaration that does not exist' {
        $corpus = Join-Path $TestDrive 'ghost-decl'; New-Item -ItemType Directory -Path $corpus | Out-Null
        $content = "# Fixture`n`nGhost: <!-- mirror-GhostState:declared:start -->nothing here<!-- mirror-GhostState:declared:end -->"
        Set-Content -LiteralPath (Join-Path $corpus '01-fixture.md') -Value $content -NoNewline
        $index = Read-SpecSetIndex -CorpusPath $corpus
        $findings = Get-MirrorFindings -Index $index
        $findings.Count | Should -Be 1
        $findings[0].Subject | Should -Be 'GhostState'
    }
}

Describe 'S3.7: checks read no files and form a flat call graph' {
    It 'no check function calls a file cmdlet or another check function' {
        $ast = [System.Management.Automation.Language.Parser]::ParseFile((Join-Path $PSScriptRoot 'Test-SpecSet.ps1'), [ref]$null, [ref]$null)
        $checkFns = @($ast.FindAll({
            param($n) $n -is [System.Management.Automation.Language.FunctionDefinitionAst] -and $n.Name -match '^Get-\w+Findings$'
        }, $true))
        $checkFns.Count | Should -BeGreaterThan 0

        $fileCmdlets = @('Get-Content', 'Set-Content', 'Add-Content', 'Get-ChildItem', 'Get-Item', 'Test-Path', 'Import-Csv', 'Out-File', 'Remove-Item', 'New-Item', 'Copy-Item', 'Move-Item', 'Resolve-Path')
        $checkNames = @($checkFns | ForEach-Object Name)

        foreach ($fn in $checkFns) {
            $calls = @($fn.FindAll({ param($n) $n -is [System.Management.Automation.Language.CommandAst] }, $true) | ForEach-Object { $_.GetCommandName() })
            foreach ($cmdletName in $fileCmdlets) { $calls | Should -Not -Contain $cmdletName }
            foreach ($other in $checkNames) { $calls | Should -Not -Contain $other }
        }
    }
}

Describe 'S3.8: the report states the count checked and never claims consistency' {
    It 'reports the mirror obligation count and never says the documents are consistent' {
        $result = [pscustomobject]@{
            State = 'Valid'
            Documents = @(1, 2)
            Declarations = @(1, 2, 3)
            Counts = [pscustomobject]@{ MirrorObligations = 2 }
        }
        $line = Write-SpecSetReport -Result $result
        $line | Should -Match '2 mirror obligations checked'
        $line | Should -Not -Match 'consistent'
    }
}
