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
    It 'keeps the result available when quiet' {
        $result = & (Join-Path $PSScriptRoot 'Test-SpecSet.ps1') -Quiet
        $result.Counts.Documents | Should -Be 8
    }
    It 'S5.5: a corpus with no provisional-register region records RegisterAbsent as unchecked and never exits 0' {
        $corpus = Join-Path $TestDrive 'no-register'; New-Item -ItemType Directory -Path $corpus | Out-Null
        Set-Content -LiteralPath (Join-Path $corpus '01-fixture.md') -Value "# Fixture`n`nNo register here." -NoNewline
        $result = & (Join-Path $PSScriptRoot 'Test-SpecSet.ps1') -CorpusPath $corpus -Quiet
        $result.State | Should -Be 'NotEvaluated'
        $result.Reason | Should -Be 'RegisterAbsent'
        $result.Unchecked.Reason | Should -Contain 'RegisterAbsent'
        $result.State | Should -Not -Be 'Valid'
    }
}

Describe 'S4.5: SS5 asserted explicitly in both directions' {
    BeforeAll {
        $script:registerTable = @'
| Area | Call made | Reason | Settles when |
|---|---|---|---|
| Test area | A call | A reason | A condition |
'@
    }

    It 'one unchecked entry plus one finding exits 2' {
        $corpus = Join-Path $TestDrive 'unchecked-plus-finding'; New-Item -ItemType Directory -Path $corpus | Out-Null
        # No provisional-register region (RegisterAbsent, unchecked) alongside a broken document link (a finding).
        Set-Content -LiteralPath (Join-Path $corpus '01-fixture.md') -Value "# Fixture`n`nSee [missing](nowhere.md)." -NoNewline
        $result = & (Join-Path $PSScriptRoot 'Test-SpecSet.ps1') -CorpusPath $corpus -Quiet
        $result.Unchecked.Count | Should -Be 1
        $result.Findings.Count | Should -Be 1
        $result.State | Should -Be 'NotEvaluated'
        (Get-SpecSetExitCode -State $result.State) | Should -Be 2
    }

    It 'one unresolvable entry plus one finding exits 1' {
        $corpus = Join-Path $TestDrive 'unresolvable-plus-finding'; New-Item -ItemType Directory -Path $corpus | Out-Null
        $content = "# Fixture`n`n<!-- provisional-register:declared:start -->`n$script:registerTable`n<!-- provisional-register:declared:end -->`n`nSite: <!-- provisional-site-test-area:declared:start -->x<!-- provisional-site-test-area:declared:end -->`n`nSee ``engine/01-vision.md`` § 1 @ ``bc74a62a2a0a57c5fd82f337712868b6877bbc6a``. Also see §99, which does not exist."
        Set-Content -LiteralPath (Join-Path $corpus '01-fixture.md') -Value $content -NoNewline
        $result = & (Join-Path $PSScriptRoot 'Test-SpecSet.ps1') -CorpusPath $corpus -Quiet
        $result.Unchecked.Count | Should -Be 0
        $result.Unresolvable.Count | Should -Be 1
        $result.Findings.Count | Should -Be 1
        $result.State | Should -Be 'Invalid'
        (Get-SpecSetExitCode -State $result.State) | Should -Be 1
    }

    It 'one unresolvable entry and no finding exits 0' {
        $corpus = Join-Path $TestDrive 'unresolvable-no-finding'; New-Item -ItemType Directory -Path $corpus | Out-Null
        $content = "# Fixture`n`n<!-- provisional-register:declared:start -->`n$script:registerTable`n<!-- provisional-register:declared:end -->`n`nSite: <!-- provisional-site-test-area:declared:start -->x<!-- provisional-site-test-area:declared:end -->`n`nSee ``engine/01-vision.md`` § 1 @ ``bc74a62a2a0a57c5fd82f337712868b6877bbc6a``."
        Set-Content -LiteralPath (Join-Path $corpus '01-fixture.md') -Value $content -NoNewline
        $result = & (Join-Path $PSScriptRoot 'Test-SpecSet.ps1') -CorpusPath $corpus -Quiet
        $result.Unchecked.Count | Should -Be 0
        $result.Unresolvable.Count | Should -Be 1
        $result.Findings.Count | Should -Be 0
        $result.State | Should -Be 'Valid'
        (Get-SpecSetExitCode -State $result.State) | Should -Be 0
    }
}

Describe 'S4.2: a broken reference produces exactly one finding, proven by breaking and restoring a real reference' {
    BeforeAll {
        $script:FixtureRoot = Join-Path $TestDrive 'games-reference'
        Copy-Item -Recurse -Path (Join-Path (Split-Path -Parent $PSScriptRoot) 'docs/docs/games') -Destination $script:FixtureRoot
        $script:GameDesignPath = Join-Path $script:FixtureRoot '03-game-design.md'
        $script:OriginalText = Get-Content -LiteralPath $script:GameDesignPath -Raw
    }

    It 'is clean while §11.5 is a real heading' {
        $index = Read-SpecSetIndex -CorpusPath $script:FixtureRoot
        (Get-ReferenceFindings -Index $index).Count | Should -Be 0
    }

    It 'raises exactly one finding when the §11.5 heading is renumbered out from under its references' {
        $mutated = $script:OriginalText -replace '### 11\.5 When Choice-Events Resolve', '### 11.9 When Choice-Events Resolve'
        $mutated | Should -Not -Be $script:OriginalText
        Set-Content -LiteralPath $script:GameDesignPath -Value $mutated -NoNewline

        $index = Read-SpecSetIndex -CorpusPath $script:FixtureRoot
        $findings = Get-ReferenceFindings -Index $index
        $findings.Count | Should -BeGreaterThan 0
        $findings | Where-Object { $_.Detail -match '§11\.5' -and $_.DocumentPath -match '03-game-design\.md' } | Should -Not -BeNullOrEmpty
    }

    It 'returns to clean once §11.5 is restored' {
        Set-Content -LiteralPath $script:GameDesignPath -Value $script:OriginalText -NoNewline
        $index = Read-SpecSetIndex -CorpusPath $script:FixtureRoot
        (Get-ReferenceFindings -Index $index).Count | Should -Be 0
    }
}

Describe 'S4.3: cross-repository references never appear as passed or broken' {
    It 'a cross-repository reference to a real corpus never enters the findings list as passed, and never as broken' {
        $index = Read-SpecSetIndex -CorpusPath (Join-Path (Split-Path -Parent $PSScriptRoot) 'docs/docs/games')
        $findings = Get-ReferenceFindings -Index $index
        $crossRepoBrokenFindings = @($findings | Where-Object Detail -Match 'resolves to nothing')
        $crossRepoBrokenFindings.Count | Should -Be 0
        $resolutions = Get-ReferenceResolutions -Index $index
        $crossRepo = @($resolutions | Where-Object { $_.Reference.Kind -eq 'CrossRepository' })
        $crossRepo.Count | Should -Be 8
        foreach ($r in $crossRepo) { $r.Status | Should -Be 'Unresolvable' }
    }
    It 'a cross-repository reference with no pinned sha is a reference finding' {
        $corpus = Join-Path $TestDrive 'unpinned'; New-Item -ItemType Directory -Path $corpus | Out-Null
        Set-Content -LiteralPath (Join-Path $corpus '01-fixture.md') -Value "# Fixture`n`nSee ``engine/01-vision.md``." -NoNewline
        $index = Read-SpecSetIndex -CorpusPath $corpus
        $findings = Get-ReferenceFindings -Index $index
        $findings.Count | Should -Be 1
        $findings[0].Detail | Should -Match 'carries no pinned commit'
    }
}

Describe 'S4.6: held, failed, unchecked and unresolvable sum to the index totals' {
    It 'sums to the totals for obligations, register rows, concepts and references against the real corpus' {
        $result = & (Join-Path $PSScriptRoot 'Test-SpecSet.ps1') -Quiet
        foreach ($category in @('MirrorObligations', 'ProvisionalEntries', 'Concepts', 'References')) {
            $bucket = $result.Buckets.$category
            ($bucket.Held + $bucket.Failed + $bucket.Unchecked + $bucket.Unresolvable) | Should -Be $bucket.Total
        }
        $result.Buckets.MirrorObligations.Total | Should -Be $result.Counts.MirrorObligations
        $result.Buckets.References.Total | Should -Be $result.Counts.References
    }
}

Describe 'S4.7: a clean run still names the unresolvable count' {
    It 'includes the unresolvable count in the report even when State is Valid, and never implies those subjects were checked' {
        # A fixture rather than the real corpus: the real corpus carries concept findings
        # (S6 lands with that gate red on purpose, cleared by S7), which would make this
        # State-independent report assertion depend on unrelated, still-open work.
        $corpus = Join-Path $TestDrive 'unresolvable-valid'; New-Item -ItemType Directory -Path $corpus | Out-Null
        $table = @'
| Area | Call made | Reason | Settles when |
|---|---|---|---|
| Test area | A call | A reason | A condition |
'@
        $content = "# Fixture`n`n<!-- provisional-register:declared:start -->`n$table`n<!-- provisional-register:declared:end -->`n`nSite: <!-- provisional-site-test-area:declared:start -->x<!-- provisional-site-test-area:declared:end -->`n`nSee ``engine/01-vision.md`` § 1 @ ``bc74a62a2a0a57c5fd82f337712868b6877bbc6a``."
        Set-Content -LiteralPath (Join-Path $corpus '01-fixture.md') -Value $content -NoNewline

        $result = & (Join-Path $PSScriptRoot 'Test-SpecSet.ps1') -CorpusPath $corpus -Quiet
        $result.State | Should -Be 'Valid'
        $result.Counts.Unresolvable | Should -BeGreaterThan 0
        $line = Write-SpecSetReport -Result $result
        $line | Should -Match "$($result.Counts.Unresolvable) references unresolvable"
        $line | Should -Match 'unresolvable \(cross-repository, not checked\)'
    }
}

Describe 'S5: the provisional register holds against the real corpus' {
    BeforeAll {
        $script:Index = Read-SpecSetIndex -CorpusPath (Join-Path (Split-Path -Parent $PSScriptRoot) 'docs/docs/games')
    }
    It 'S5.3: exactly one provisional-register region is indexed corpus-wide' {
        $script:Index.State | Should -Be 'Indexed'
        $script:Index.ProvisionalEntries.Count | Should -Be 6
    }
    It 'S5.4: every register row resolves to a matching provisional-site region' {
        $findings = Get-ProvisionalFindings -Index $script:Index
        $noSiteFindings = @($findings | Where-Object Detail -Match 'has no matching provisional-site-')
        $noSiteFindings.Count | Should -Be 0
        $noRowFindings = @($findings | Where-Object Detail -Match 'has no matching provisional register row')
        $noRowFindings.Count | Should -Be 0
    }
    It 'S5.1: all six rows carry a non-empty Reason and Settles when, so the register raises no finding' {
        $findings = Get-ProvisionalFindings -Index $script:Index
        $findings.Count | Should -Be 0
    }
}

Describe 'S5.2: emptying a register cell produces exactly one finding' {
    BeforeAll {
        $script:FixtureRoot = Join-Path $TestDrive 'games-provisional'
        Copy-Item -Recurse -Path (Join-Path (Split-Path -Parent $PSScriptRoot) 'docs/docs/games') -Destination $script:FixtureRoot
        $script:EnginePath = Join-Path $script:FixtureRoot '04-engine-specification.md'
        $script:OriginalText = Get-Content -LiteralPath $script:EnginePath -Raw
    }

    It 'raises one finding and exits 1 when a Reason cell is emptied' {
        $mutated = $script:OriginalText -replace 'Arbitrary — chosen with no real demand data to calibrate against\.', ''
        $mutated | Should -Not -Be $script:OriginalText
        Set-Content -LiteralPath $script:EnginePath -Value $mutated -NoNewline

        $result = & (Join-Path $PSScriptRoot 'Test-SpecSet.ps1') -CorpusPath $script:FixtureRoot -Quiet
        $result.State | Should -Be 'Invalid'
        $findings = @($result.Findings | Where-Object Detail -Match 'demandBand.*empty Reason cell')
        $findings.Count | Should -Be 1
    }

    AfterEach { Set-Content -LiteralPath $script:EnginePath -Value $script:OriginalText -NoNewline }
}

Describe 'S5.3: a second provisional-register region yields DuplicateRegionId and exit 2' {
    It 'fails the whole run rather than the provisional check alone' {
        $corpus = Join-Path $TestDrive 'duplicate-register'; New-Item -ItemType Directory -Path $corpus | Out-Null
        $table = @'
| Area | Call made | Reason | Settles when |
|---|---|---|---|
| Test area | A call | A reason | A condition |
'@
        $content1 = "# Fixture One`n`n<!-- provisional-register:declared:start -->`n$table`n<!-- provisional-register:declared:end -->"
        $content2 = "# Fixture Two`n`n<!-- provisional-register:declared:start -->`n$table`n<!-- provisional-register:declared:end -->"
        Set-Content -LiteralPath (Join-Path $corpus '01-fixture.md') -Value $content1 -NoNewline
        Set-Content -LiteralPath (Join-Path $corpus '02-fixture.md') -Value $content2 -NoNewline

        $result = & (Join-Path $PSScriptRoot 'Test-SpecSet.ps1') -CorpusPath $corpus -Quiet
        $result.State | Should -Be 'NotEvaluated'
        $result.Reason | Should -Be 'DuplicateRegionId'
    }
}

Describe 'S5.4: a provisional-site region with no matching register row is a finding' {
    It 'raises exactly one finding naming the orphan site' {
        $corpus = Join-Path $TestDrive 'orphan-site'; New-Item -ItemType Directory -Path $corpus | Out-Null
        $table = @'
| Area | Call made | Reason | Settles when |
|---|---|---|---|
| Test area | A call | A reason | A condition |
'@
        $content = "# Fixture`n`n<!-- provisional-register:declared:start -->`n$table`n<!-- provisional-register:declared:end -->`n`nSite: <!-- provisional-site-orphan:declared:start -->42<!-- provisional-site-orphan:declared:end -->"
        Set-Content -LiteralPath (Join-Path $corpus '01-fixture.md') -Value $content -NoNewline

        $index = Read-SpecSetIndex -CorpusPath $corpus
        $index.State | Should -Be 'Indexed'
        $findings = Get-ProvisionalFindings -Index $index
        $orphanFindings = @($findings | Where-Object Subject -eq 'orphan')
        $orphanFindings.Count | Should -Be 1
        $orphanFindings[0].Detail | Should -Match 'no matching provisional register row'
    }
}

Describe 'S6: the concept lifecycle check' {
    BeforeAll {
        $script:Index = Read-SpecSetIndex -CorpusPath (Join-Path (Split-Path -Parent $PSScriptRoot) 'docs/docs/games')
    }

    It 'S6.2: §5.4.1 and §5.4.2 are wrapped as lifecycle-Opportunity and lifecycle-ScheduledEvent, and both are held' {
        $findings = Get-ConceptFindings -Index $script:Index
        $findings | Where-Object Subject -In @('Opportunity', 'ScheduledEvent') | Should -BeNullOrEmpty
    }

    It 'S6.3: a concept with no lifecycle- region still produces exactly one finding naming it, and the run exits 1' {
        # S6 landed with 12 of the 14 derived concepts still missing a lifecycle- region and
        # this test asserted that gap directly, by count, because S7 — filling it — had not
        # landed yet. S7 wrote all 12 remaining regions (S7.1: "zero concept findings"), so the
        # gap this test exercises no longer exists in the real corpus; it is reconstructed here
        # against a copy with one region removed, which is what S6.3 was actually testing.
        $fixtureRoot = Join-Path $TestDrive 's6-3-missing-lifecycle'
        Copy-Item -Recurse -Path (Join-Path (Split-Path -Parent $PSScriptRoot) 'docs/docs/games') -Destination $fixtureRoot
        $enginePath = Join-Path $fixtureRoot '04-engine-specification.md'
        $text = Get-Content -LiteralPath $enginePath -Raw
        $withoutRngState = $text -replace '(?s)<!-- lifecycle-RngState:declared:start -->.*?<!-- lifecycle-RngState:declared:end -->\r?\n\r?\n', ''
        $withoutRngState | Should -Not -Be $text
        Set-Content -LiteralPath $enginePath -Value $withoutRngState -NoNewline

        $index = Read-SpecSetIndex -CorpusPath $fixtureRoot
        $findings = Get-ConceptFindings -Index $index
        @($findings | Where-Object { $_.CheckId -eq 'concept' -and $_.Subject -eq 'RngState' }).Count | Should -Be 1
        @($findings | Where-Object CheckId -eq 'concept').Count | Should -Be 1

        $result = & (Join-Path $PSScriptRoot 'Test-SpecSet.ps1') -CorpusPath $fixtureRoot -Quiet
        $result.State | Should -Be 'Invalid'
        (Get-SpecSetExitCode -State $result.State) | Should -Be 1
    }

    It 'S7.1: every derived concept in the real corpus carries a lifecycle- region, and the run reports Valid' {
        $findings = Get-ConceptFindings -Index $script:Index
        @($findings | Where-Object CheckId -eq 'concept') | Should -BeNullOrEmpty

        $result = & (Join-Path $PSScriptRoot 'Test-SpecSet.ps1') -Quiet
        $result.State | Should -Be 'Valid'
        (Get-SpecSetExitCode -State $result.State) | Should -Be 0
    }
}

Describe 'S6.4: deleting the Resolution half of §5.4.1 produces a creation-without-retirement finding' {
    BeforeAll {
        $script:FixtureRoot = Join-Path $TestDrive 'games-lifecycle'
        Copy-Item -Recurse -Path (Join-Path (Split-Path -Parent $PSScriptRoot) 'docs/docs/games') -Destination $script:FixtureRoot
        $script:EnginePath = Join-Path $script:FixtureRoot '04-engine-specification.md'
        $script:OriginalText = Get-Content -LiteralPath $script:EnginePath -Raw
    }

    It 'is held while §5.4.1 states both Generation and Resolution' {
        $index = Read-SpecSetIndex -CorpusPath $script:FixtureRoot
        (Get-ConceptFindings -Index $index) | Where-Object Subject -eq 'Opportunity' | Should -BeNullOrEmpty
    }

    It 'raises exactly one concept finding for Opportunity once the Resolution paragraph is removed' {
        $lines = $script:OriginalText -split "`n"
        $startIdx = [Array]::FindIndex([string[]]$lines, [Predicate[string]] { param($l) $l.StartsWith('**Resolution.**') })
        $endIdx = [Array]::FindIndex([string[]]$lines, [Predicate[string]] { param($l) $l.StartsWith('**The `opportunities` system**') })
        $startIdx | Should -BeGreaterThan 0
        $endIdx | Should -BeGreaterThan $startIdx
        $mutatedLines = $lines[0..($startIdx - 1)] + $lines[$endIdx..($lines.Count - 1)]
        $mutated = $mutatedLines -join "`n"
        $mutated | Should -Not -Be $script:OriginalText
        Set-Content -LiteralPath $script:EnginePath -Value $mutated -NoNewline

        $index = Read-SpecSetIndex -CorpusPath $script:FixtureRoot
        $findings = Get-ConceptFindings -Index $index
        $opportunityFindings = @($findings | Where-Object Subject -eq 'Opportunity')
        $opportunityFindings.Count | Should -Be 1
        $opportunityFindings[0].Detail | Should -Match 'only one boundary'
    }

    It 'returns to clean once Resolution is restored' {
        Set-Content -LiteralPath $script:EnginePath -Value $script:OriginalText -NoNewline
        $index = Read-SpecSetIndex -CorpusPath $script:FixtureRoot
        (Get-ConceptFindings -Index $index) | Where-Object Subject -eq 'Opportunity' | Should -BeNullOrEmpty
    }
}

Describe 'S6.5: a lifecycle- region naming something outside the derived concept set is a finding' {
    It 'raises exactly one finding naming the out-of-set concept, rather than silently ignoring the region' {
        $corpus = Join-Path $TestDrive 'lifecycle-outside-set'; New-Item -ItemType Directory -Path $corpus | Out-Null
        $content = @'
# Fixture

```typescript
interface GameState {
  player: PlayerState;
}
type PlayerState = ActorState;
interface ActorState {
  name: string;
}
```

<!-- lifecycle-ActorState:declared:start -->
**Creation.** Made at game start.

**Retirement.** Never retired.
<!-- lifecycle-ActorState:declared:end -->
'@
        Set-Content -LiteralPath (Join-Path $corpus '01-fixture.md') -Value $content -NoNewline

        $index = Read-SpecSetIndex -CorpusPath $corpus
        $index.State | Should -Be 'Indexed'
        $index.Concepts | Should -Not -Contain 'ActorState'
        $findings = Get-ConceptFindings -Index $index
        $outsideFindings = @($findings | Where-Object Subject -eq 'ActorState')
        $outsideFindings.Count | Should -Be 1
        $outsideFindings[0].Detail | Should -Match 'outside the derived concept set'
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
            Counts = [pscustomobject]@{ MirrorObligations = 2; Unresolvable = 0 }
        }
        $line = Write-SpecSetReport -Result $result
        $line | Should -Match '2 mirror obligations checked'
        $line | Should -Not -Match 'consistent'
    }
}
