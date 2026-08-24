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
    It 'S6.1: derives the concept set from GameState''s 17 fields and the declarations reachable from them' {
        $index = Read-SpecSetIndex -CorpusPath (Join-Path (Split-Path -Parent $PSScriptRoot) 'docs/docs/games')
        ($index.Declarations | Where-Object { $_.QualifiedName -eq 'GameState' -and $_.Owner -eq '' }).Members.Count | Should -Be 17
        $index.Concepts | Should -Contain 'Opportunity'
        $index.Concepts | Should -Contain 'ScheduledEvent'
        $index.Concepts | Should -Contain 'StatusEffect'
        $index.Concepts | Should -Contain 'GoalState'
        $index.Concepts | Should -Contain 'PlayerState'
        $index.Concepts | Should -Not -Contain 'ResolutionDebugInfo'
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
    It 'S4.1: extracts all 161 section references and all 36 document links from the real corpus, with SourcePath, Line, Kind and RawTarget' {
        $index = Read-SpecSetIndex -CorpusPath (Join-Path (Split-Path -Parent $PSScriptRoot) 'docs/docs/games')
        $index.State | Should -Be 'Indexed'
        $sections = @($index.References | Where-Object Kind -eq 'Section')
        $documentLinks = @($index.References | Where-Object Kind -eq 'Document')
        $crossRepo = @($index.References | Where-Object Kind -eq 'CrossRepository')
        # The brief's "107 section references" describes the corpus before S4.4's pins were
        # added. Pinning all 8 cross-repository mentions in the `<path> § <section> @ <sha>`
        # form (S4.4) gave 7 of them a section mark they did not carry before, each folded into
        # its CrossRepository reference rather than double-counted as a same-repo Section one —
        # so 106 same-repo Section references remained at that point, plus 8 CrossRepository
        # references that each carry a section mark. S7 then added 55 same-repo section
        # references across the twelve new `lifecycle-` regions it wrote, each citing the
        # sections its creation/retirement paths depend on — 161 same-repo Section references
        # remain, plus the same 8 CrossRepository references (161 + 8 = 169 total §-marks in the
        # landed corpus).
        $crossRepoWithSection = @($crossRepo | Where-Object RawTarget -Match '§')
        $sections.Count | Should -Be 161
        $crossRepoWithSection.Count | Should -Be 8
        $documentLinks.Count | Should -Be 36
        $crossRepo.Count | Should -Be 8
        foreach ($r in $index.References) {
            $r.SourcePath | Should -Not -BeNullOrEmpty
            $r.Line | Should -BeGreaterThan 0
            $r.Kind | Should -BeIn @('Section', 'Document', 'CrossRepository')
            $r.RawTarget | Should -Not -BeNullOrEmpty
        }
    }
    It 'S4.3/S4.4: the 8 engine/*.md mentions are classified CrossRepository and each carries a pinned sha' {
        $index = Read-SpecSetIndex -CorpusPath (Join-Path (Split-Path -Parent $PSScriptRoot) 'docs/docs/games')
        $crossRepo = @($index.References | Where-Object Kind -eq 'CrossRepository')
        $crossRepo.Count | Should -Be 8
        foreach ($r in $crossRepo) { $r.PinnedSha | Should -Match '^[0-9a-f]{40}$' }
    }
    It 'S4.1: a bare, qualified and link-adjacent section reference each extract with the resolved document in RawTarget' {
        $corpus = Join-Path $TestDrive 'references'; New-Item -ItemType Directory -Path $corpus | Out-Null
        $content = @'
# 01-fixture

## 1. Alpha

Bare same-document: §1. Qualified: design §1. Link-adjacent: [target](02-fixture.md) §1.
'@
        Set-Content -LiteralPath (Join-Path $corpus '01-fixture.md') -Value $content -NoNewline
        Set-Content -LiteralPath (Join-Path $corpus '02-fixture.md') -Value "# 02-fixture`n`n## 1. Beta`n" -NoNewline

        $index = Read-SpecSetIndex -CorpusPath $corpus
        $index.State | Should -Be 'Indexed'
        $sections = @($index.References | Where-Object Kind -eq 'Section')
        $sections.Count | Should -Be 3
        $sections.RawTarget | Should -Contain '01-fixture.md#1'
        $sections.RawTarget | Should -Contain '02-fixture.md#1'
    }
    It 'S4.3: an unpinned engine/*.md mention still extracts as CrossRepository with an empty PinnedSha' {
        $corpus = Join-Path $TestDrive 'unpinned-cross-repo'; New-Item -ItemType Directory -Path $corpus | Out-Null
        Set-Content -LiteralPath (Join-Path $corpus '01-fixture.md') -Value "# Fixture`n`nSee ``engine/01-vision.md``." -NoNewline
        $index = Read-SpecSetIndex -CorpusPath $corpus
        $index.State | Should -Be 'Indexed'
        $crossRepo = @($index.References | Where-Object Kind -eq 'CrossRepository')
        $crossRepo.Count | Should -Be 1
        $crossRepo[0].PinnedSha | Should -BeNullOrEmpty
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
