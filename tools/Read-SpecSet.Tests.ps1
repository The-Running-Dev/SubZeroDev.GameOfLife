#Requires -Version 7.0
#Requires -Modules Pester

BeforeAll { . (Join-Path $PSScriptRoot 'Read-SpecSet.ps1') }

Describe 'Read-SpecSetIndex' {
    It 'keeps a shallow corpus as the relative-path base' {
        $root = [System.IO.Path]::GetPathRoot($PSScriptRoot)
        $shallowCorpus = Join-Path $root 'games'

        Get-SpecSetRepositoryRoot -CorpusRoot $shallowCorpus | Should -Be $shallowCorpus
    }
    It 'indexes the real corpus and derives closure from declaration form' {
        $index = Read-SpecSetIndex -CorpusPath (Join-Path (Split-Path -Parent $PSScriptRoot) 'docs/docs/games')
        $index.State | Should -Be 'Indexed'
        $index.Documents.Count | Should -Be 8
        ($index.Declarations | Where-Object QualifiedName -eq 'AttributeState').Members | Should -Contain 'wisdom'
        ($index.Declarations | Where-Object QualifiedName -eq 'GameMode').Members | Should -Be @('classic', 'open_life', 'challenge')
        ($index.Declarations | Where-Object QualifiedName -eq 'PlayerState.skills').IsClosed | Should -BeFalse
    }
    It 'extracts the NeedState and AttributeState mirror obligations from §3.1' {
        $index = Read-SpecSetIndex -CorpusPath (Join-Path (Split-Path -Parent $PSScriptRoot) 'docs/docs/games')
        $index.MirrorObligations.Count | Should -Be 2
        ($index.MirrorObligations | Where-Object QualifiedName -eq 'NeedState').BodyMembers | Should -Be @('health', 'energy', 'happiness', 'stress', 'satiety')
        ($index.MirrorObligations | Where-Object QualifiedName -eq 'AttributeState').BodyMembers | Should -Be @('intelligence', 'discipline', 'charisma', 'creativity', 'resilience', 'wisdom', 'luck')
    }
    It 'S3.6: a document with no declared regions is valid input yielding zero obligations' {
        $corpus = Join-Path $TestDrive 'no-regions'; New-Item -ItemType Directory -Path $corpus | Out-Null
        Set-Content -LiteralPath (Join-Path $corpus '01-fixture.md') -Value "# Fixture`n`nJust prose, no markers here." -NoNewline
        $index = Read-SpecSetIndex -CorpusPath $corpus
        $index.State | Should -Be 'Indexed'
        $index.MirrorObligations.Count | Should -Be 0
    }
    It 'S3.6: an unclosed region yields MalformedRegion' {
        $corpus = Join-Path $TestDrive 'unclosed'; New-Item -ItemType Directory -Path $corpus | Out-Null
        Set-Content -LiteralPath (Join-Path $corpus '01-fixture.md') -Value "# Fixture`n`nList: <!-- mirror-Foo:declared:start -->a, b." -NoNewline
        $index = Read-SpecSetIndex -CorpusPath $corpus
        $index.State | Should -Be 'NotEvaluated'; $index.Reason | Should -Be 'MalformedRegion'; $index.Line | Should -BeGreaterThan 0
    }
    It 'S3.6: a mismatched end marker yields MalformedRegion' {
        $corpus = Join-Path $TestDrive 'mismatched'; New-Item -ItemType Directory -Path $corpus | Out-Null
        Set-Content -LiteralPath (Join-Path $corpus '01-fixture.md') -Value "# Fixture`n`nList: a, b.<!-- mirror-Foo:declared:end -->" -NoNewline
        $index = Read-SpecSetIndex -CorpusPath $corpus
        $index.State | Should -Be 'NotEvaluated'; $index.Reason | Should -Be 'MalformedRegion'
    }
    It 'S3.6: a nested region yields MalformedRegion' {
        $corpus = Join-Path $TestDrive 'nested'; New-Item -ItemType Directory -Path $corpus | Out-Null
        Set-Content -LiteralPath (Join-Path $corpus '01-fixture.md') -Value "# Fixture`n`n<!-- mirror-Foo:declared:start -->a<!-- mirror-Bar:declared:start -->b<!-- mirror-Bar:declared:end --><!-- mirror-Foo:declared:end -->" -NoNewline
        $index = Read-SpecSetIndex -CorpusPath $corpus
        $index.State | Should -Be 'NotEvaluated'; $index.Reason | Should -Be 'MalformedRegion'
    }
    It 'S3.6: two regions sharing an id in the same document yield DuplicateRegionId' {
        $corpus = Join-Path $TestDrive 'duplicate'; New-Item -ItemType Directory -Path $corpus | Out-Null
        Set-Content -LiteralPath (Join-Path $corpus '01-fixture.md') -Value "# Fixture`n`nOne: <!-- mirror-Foo:declared:start -->a<!-- mirror-Foo:declared:end -->`nTwo: <!-- mirror-Foo:declared:start -->b<!-- mirror-Foo:declared:end -->" -NoNewline
        $index = Read-SpecSetIndex -CorpusPath $corpus
        $index.State | Should -Be 'NotEvaluated'; $index.Reason | Should -Be 'DuplicateRegionId'
    }
    It 'S3.4: a mirror region naming an open declaration is still indexed as an obligation' {
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
        $index.State | Should -Be 'Indexed'
        ($index.MirrorObligations | Where-Object QualifiedName -eq 'PlayerState.skills') | Should -Not -BeNullOrEmpty
        ($index.Declarations | Where-Object QualifiedName -eq 'PlayerState.skills').IsClosed | Should -BeFalse
    }
    It 'fails closed on an unsupported declaration' {
        $corpus = Join-Path $TestDrive 'games'; New-Item -ItemType Directory -Path $corpus | Out-Null
        Set-Content -LiteralPath (Join-Path $corpus '01-fixture.md') -Value "# Fixture`n``````typescript`nclass Unsupported {}`n``````" -NoNewline
        $index = Read-SpecSetIndex -CorpusPath $corpus
        $index.State | Should -Be 'NotEvaluated'; $index.Reason | Should -Be 'UnknownDeclarationForm'; $index.Line | Should -BeGreaterThan 0
    }
    It 'reports a missing corpus rather than treating it as empty' {
        $index = Read-SpecSetIndex -CorpusPath (Join-Path $TestDrive 'missing')
        $index.State | Should -Be 'NotEvaluated'; $index.Reason | Should -Be 'CorpusNotFound'
    }
    It 'S5.1/S5.3: parses the register table into four-column entries and the sites into keyed entries' {
        $corpus = Join-Path $TestDrive 'provisional'; New-Item -ItemType Directory -Path $corpus | Out-Null
        $table = @'
| Area | Call made | Reason | Settles when |
|---|---|---|---|
| §5.6 `demandBand` | Thresholds at 35 and 65 | Arbitrary | Once real data exists |
'@
        $content = "# Fixture`n`n<!-- provisional-register:declared:start -->`n$table`n<!-- provisional-register:declared:end -->`n`nSite: <!-- provisional-site-5-6-demandband:declared:start -->35 and 65<!-- provisional-site-5-6-demandband:declared:end -->"
        Set-Content -LiteralPath (Join-Path $corpus '01-fixture.md') -Value $content -NoNewline

        $index = Read-SpecSetIndex -CorpusPath $corpus
        $index.State | Should -Be 'Indexed'
        $index.ProvisionalEntries.Count | Should -Be 1
        $index.ProvisionalEntries[0].Area | Should -Be '§5.6 `demandBand`'
        $index.ProvisionalEntries[0].Reason | Should -Be 'Arbitrary'
        $index.ProvisionalEntries[0].SettlesWhen | Should -Be 'Once real data exists'
        $index.ProvisionalSites.Count | Should -Be 1
        $index.ProvisionalSites[0].Key | Should -Be '5-6-demandband'
        (Get-ProvisionalKey -Area $index.ProvisionalEntries[0].Area) | Should -Be '5-6-demandband'
    }
    It 'S5.3: a second provisional-register region across the corpus yields DuplicateRegionId' {
        $corpus = Join-Path $TestDrive 'duplicate-provisional-register'; New-Item -ItemType Directory -Path $corpus | Out-Null
        $table = @'
| Area | Call made | Reason | Settles when |
|---|---|---|---|
| Test area | A call | A reason | A condition |
'@
        Set-Content -LiteralPath (Join-Path $corpus '01-fixture.md') -Value "# One`n`n<!-- provisional-register:declared:start -->`n$table`n<!-- provisional-register:declared:end -->" -NoNewline
        Set-Content -LiteralPath (Join-Path $corpus '02-fixture.md') -Value "# Two`n`n<!-- provisional-register:declared:start -->`n$table`n<!-- provisional-register:declared:end -->" -NoNewline

        $index = Read-SpecSetIndex -CorpusPath $corpus
        $index.State | Should -Be 'NotEvaluated'
        $index.Reason | Should -Be 'DuplicateRegionId'
    }
}
