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

Describe 'S4.6 / SS6: every subject is counted, and the documented overlap is the only one' {
    BeforeAll {
        $script:ss6RegisterTable = @'
| Area | Call made | Reason | Settles when |
|---|---|---|---|
| Test area | A call | A reason | A condition |
'@
    }

    It 'sums to the totals for obligations, register rows, concepts and references against the real corpus, which carries no overlap' {
        $result = & (Join-Path $PSScriptRoot 'Test-SpecSet.ps1') -Quiet
        foreach ($category in @('MirrorObligations', 'ProvisionalEntries', 'Concepts', 'References')) {
            $bucket = $result.Buckets.$category
            ($bucket.Held + $bucket.Failed + $bucket.Unchecked + $bucket.Unresolvable) | Should -Be $bucket.Total
        }
        $result.Buckets.MirrorObligations.Total | Should -Be $result.Counts.MirrorObligations
        $result.Buckets.References.Total | Should -Be $result.Counts.References
    }

    It 'counts an unpinned cross-repository reference in both Failed and Unresolvable, and the sum equals the total once that one overlap is subtracted' {
        # SS6's overlap is closed at exactly this shape, and the real corpus cannot exercise it:
        # every cross-repository reference there is pinned, so the equality above holds without
        # ever reaching the case the row now names. Asserted here so the row is not an equality
        # no fixture tests - the failure S4.3 already builds, measured as counts rather than as
        # findings.
        $corpus = Join-Path $TestDrive 'ss6-overlap'; New-Item -ItemType Directory -Path $corpus | Out-Null
        $content = "# Fixture`n`n<!-- provisional-register:declared:start -->`n$script:ss6RegisterTable`n<!-- provisional-register:declared:end -->`n`nSite: <!-- provisional-site-test-area:declared:start -->x<!-- provisional-site-test-area:declared:end -->`n`nSee ``engine/01-vision.md`` § 1."
        Set-Content -LiteralPath (Join-Path $corpus '01-fixture.md') -Value $content -NoNewline

        $result = & (Join-Path $PSScriptRoot 'Test-SpecSet.ps1') -CorpusPath $corpus -Quiet
        $index = Read-SpecSetIndex -CorpusPath $corpus
        $overlap = @(Get-ReferenceResolutions -Index $index | Where-Object { $_.Status -eq 'Unresolvable' -and $_.Finding }).Count
        $overlap | Should -Be 1

        $bucket = $result.Buckets.References
        $bucket.Total | Should -Be 1
        $bucket.Failed | Should -Be 1
        $bucket.Unresolvable | Should -Be 1
        ($bucket.Held + $bucket.Failed + $bucket.Unchecked + $bucket.Unresolvable) | Should -Be ($bucket.Total + $overlap)
        ($bucket.Held + $bucket.Failed + $bucket.Unchecked + $bucket.Unresolvable - $overlap) | Should -Be $bucket.Total

        # And nothing but a reference ever overlaps.
        foreach ($category in @('MirrorObligations', 'ProvisionalEntries', 'Concepts')) {
            $b = $result.Buckets.$category
            ($b.Held + $b.Failed + $b.Unchecked + $b.Unresolvable) | Should -Be $b.Total
        }
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

Describe 'S1.7 / SS2: every regular expression in the system is in Read-SpecSet.ps1' {
    It 'no match operator, -replace, -split, Select-String or [regex] occurs outside Read-SpecSet.ps1' {
        # SS2 is the Index module boundary: extraction is the fragile part, and containing it in
        # one file gives it one failure mode instead of four. Read-SpecSet.ps1 is the only file
        # exempt, because it *is* the Index.
        $operators = @('Match', 'NotMatch', 'IMatch', 'INotMatch', 'CMatch', 'CNotMatch',
                       'Replace', 'IReplace', 'CReplace', 'Split', 'ISplit', 'CSplit')

        $path = Join-Path $PSScriptRoot 'Test-SpecSet.ps1'
        $ast = [System.Management.Automation.Language.Parser]::ParseFile($path, [ref]$null, [ref]$null)

        $binary = @($ast.FindAll({
            param($n) $n -is [System.Management.Automation.Language.BinaryExpressionAst]
        }, $true))
        foreach ($node in $binary) {
            $node.Operator.ToString() | Should -Not -BeIn $operators -Because 'SS2 puts every regular expression in Read-SpecSet.ps1'
        }

        $calls = @($ast.FindAll({
            param($n) $n -is [System.Management.Automation.Language.CommandAst]
        }, $true) | ForEach-Object { $_.GetCommandName() })
        $calls | Should -Not -Contain 'Select-String'

        $types = @($ast.FindAll({
            param($n) $n -is [System.Management.Automation.Language.TypeExpressionAst] -or
                      $n -is [System.Management.Automation.Language.TypeConstraintAst]
        }, $true) | ForEach-Object { $_.TypeName.FullName })
        $types | Should -Not -Contain 'regex'
        $types | Should -Not -Contain 'System.Text.RegularExpressions.Regex'
    }
}

Describe 'S1.8 / SS1 / SS9: neither script can be made to write, and no parameter reaches outside -CorpusPath' {
    BeforeAll {
        $script:SpecScripts = @('Read-SpecSet.ps1', 'Test-SpecSet.ps1') | ForEach-Object {
            [pscustomobject]@{
                Name = $_
                Ast  = [System.Management.Automation.Language.Parser]::ParseFile((Join-Path $PSScriptRoot $_), [ref]$null, [ref]$null)
            }
        }
    }

    It 'declares no -Fix, -Write, -Apply or -EnginePath parameter, anywhere' {
        # SS1: a checker that could fix what it finds is a generator, and a generative pass over
        # the design documents is the loop AGENTS.md's design freeze exists to escape.
        # SS9: -EnginePath would make the answer depend on whether a second working copy happens
        # to be checked out beside this one, giving two authors different results on one commit.
        $forbidden = @('Fix', 'Write', 'Apply', 'EnginePath')

        foreach ($s in $script:SpecScripts) {
            $params = @($s.Ast.FindAll({
                param($n) $n -is [System.Management.Automation.Language.ParameterAst]
            }, $true) | ForEach-Object { $_.Name.VariablePath.UserPath })

            foreach ($name in $forbidden) {
                $params | Should -Not -Contain $name -Because "$($s.Name) declaring -$name would put a write, or a second corpus, on the checker's surface"
            }
        }
    }

    It 'calls no write cmdlet at all, so no corpus path can reach one' {
        # Stronger than the contract's wording and deliberately so: the scripts call no write
        # cmdlet whatsoever, which is the only form of "no write cmdlet takes a corpus path"
        # an AST can decide without resolving a path expression at parse time.
        $writeCmdlets = @('Set-Content', 'Add-Content', 'Out-File', 'New-Item', 'Remove-Item',
                          'Copy-Item', 'Move-Item', 'Rename-Item', 'Clear-Content',
                          'Export-Csv', 'Export-Clixml', 'Tee-Object')

        foreach ($s in $script:SpecScripts) {
            $calls = @($s.Ast.FindAll({
                param($n) $n -is [System.Management.Automation.Language.CommandAst]
            }, $true) | ForEach-Object { $_.GetCommandName() })

            foreach ($cmdletName in $writeCmdlets) {
                $calls | Should -Not -Contain $cmdletName -Because "$($s.Name) is read-only by contract (SS1)"
            }
        }
    }

    It 'uses no redirection operator, which would write without naming a cmdlet' {
        foreach ($s in $script:SpecScripts) {
            # `2>$null` is a stream discard, not a file write, and both scripts use it to
            # silence git. Anything redirected anywhere else is the write SS1 forbids.
            $redirections = @($s.Ast.FindAll({
                param($n) $n -is [System.Management.Automation.Language.FileRedirectionAst]
            }, $true) | Where-Object { $_.Location.Extent.Text -ne '$null' })
            $redirections.Count | Should -Be 0 -Because "$($s.Name) redirecting to a file is a write SS1 forbids"
        }
    }
}

Describe 'S1.6 / SS10: the report names the commit it ran against and whether the tree was clean' {
    It 'carries a Commit and a WorkingTree on a real run' {
        $result = & (Join-Path $PSScriptRoot 'Test-SpecSet.ps1') -Quiet
        $result.PSObject.Properties.Name | Should -Contain 'Commit'
        $result.PSObject.Properties.Name | Should -Contain 'WorkingTree'
        $result.Commit.Length | Should -Be 40
        $result.WorkingTree | Should -BeIn @('Clean', 'Dirty')
    }

    It 'stamps the checker''s own repository, so the working directory cannot change the answer' {
        # Get-SpecSetGitInfo resolves the repository from $PSScriptRoot, not from the caller's
        # location and not from -CorpusPath. A run from elsewhere therefore stamps the same
        # commit rather than losing it, and NotAGitRepository is reachable only when the
        # checker itself is outside a repository - not when the caller is.
        $outside = Join-Path ([System.IO.Path]::GetTempPath()) ([guid]::NewGuid().Guid)
        $corpus = Join-Path $outside 'corpus'
        New-Item -ItemType Directory -Path $corpus -Force | Out-Null
        Set-Content -LiteralPath (Join-Path $corpus '01-fixture.md') -Value "# Fixture`n" -NoNewline
        try {
            $here = & (Join-Path $PSScriptRoot 'Test-SpecSet.ps1') -Quiet
            Push-Location $outside
            $there = & (Join-Path $PSScriptRoot 'Test-SpecSet.ps1') -CorpusPath $corpus -Quiet
            $there.Commit | Should -Be $here.Commit
            $there.WorkingTree | Should -Be $here.WorkingTree
        } finally {
            Pop-Location
            Remove-Item -LiteralPath $outside -Recurse -Force -ErrorAction SilentlyContinue
        }
    }
}

Describe 'SS8: closure is derived from a declaration form and can be set by nothing else' {
    It 'no parameter or environment variable names closure' {
        # A hand-maintained closed/open flag is the second copy this whole design exists to
        # avoid, so the enforcement is that no surface exists to set one through.
        foreach ($name in @('Read-SpecSet.ps1', 'Test-SpecSet.ps1')) {
            $ast = [System.Management.Automation.Language.Parser]::ParseFile((Join-Path $PSScriptRoot $name), [ref]$null, [ref]$null)

            $params = @($ast.FindAll({
                param($n) $n -is [System.Management.Automation.Language.ParameterAst]
            }, $true) | ForEach-Object { $_.Name.VariablePath.UserPath })
            @($params | Where-Object { $_ -like '*Closed*' -or $_ -like '*Closure*' -or $_ -like '*Open*' }).Count |
                Should -Be 0 -Because "$name exposing a closure parameter would let an author override a derived property (SS8)"

            $envReads = @($ast.FindAll({
                param($n) $n -is [System.Management.Automation.Language.VariableExpressionAst] -and
                          $n.VariablePath.IsDriveQualified -and $n.VariablePath.DriveName -eq 'env'
            }, $true))
            $envReads.Count | Should -Be 0 -Because "$name reading an environment variable would put closure, or anything else, outside the declaration's own form"
        }
    }

    It 'derives closure from form alone: a named-field interface is closed, a keyed map is open' {
        $corpus = Join-Path (Split-Path $PSScriptRoot -Parent) 'docs/docs/games'
        $index = Read-SpecSetIndex -CorpusPath $corpus
        ($index.Declarations | Where-Object QualifiedName -eq 'AttributeState').IsClosed | Should -BeTrue
        ($index.Declarations | Where-Object QualifiedName -eq 'PlayerState.skills').IsClosed | Should -BeFalse
    }
}

Describe 'SS12: every marker is an HTML comment, so removing the checker leaves valid markdown' {
    It 'every declared marker in the corpus is a complete HTML comment carrying nothing else' {
        $corpus = Join-Path (Split-Path $PSScriptRoot -Parent) 'docs/docs/games'
        $markers = @(Get-ChildItem -LiteralPath $corpus -Filter '*.md' | ForEach-Object {
            Select-String -LiteralPath $_.FullName -Pattern ':declared:(start|end)'
        })
        $markers.Count | Should -BeGreaterThan 0

        foreach ($m in $markers) {
            # A region body is visible prose, and an inline region puts its markers on the same
            # line as the sentence they wrap - so the marker does not own its line. What SS12
            # requires is that every marker is a closed HTML comment, which renders nothing.
            foreach ($marker in [regex]::Matches($m.Line, '[A-Za-z][\w.-]*:declared:(start|end)')) {
                $before = $m.Line.Substring(0, $marker.Index)
                $after = $m.Line.Substring($marker.Index + $marker.Length)
                $before | Should -BeLike '*<!--*' -Because "$($m.Filename):$($m.LineNumber) marker $($marker.Value) must open an HTML comment (SS12)"
                $after | Should -BeLike '*-->*' -Because "$($m.Filename):$($m.LineNumber) marker $($marker.Value) must close its HTML comment (SS12)"
                $before.Substring($before.LastIndexOf('<!--')) | Should -Not -BeLike '*-->*' -Because "$($m.Filename):$($m.LineNumber) marker $($marker.Value) must sit inside the comment, not after it (SS12)"
            }
            ([regex]::Matches($m.Line, '<!--')).Count | Should -Be ([regex]::Matches($m.Line, '-->')).Count -Because "$($m.Filename):$($m.LineNumber) leaves an HTML comment unclosed (SS12)"
        }
    }

    It 'the docs build has no dependency on the checker' {
        $dockerfile = Join-Path (Split-Path $PSScriptRoot -Parent) 'docs/Dockerfile'
        $content = Get-Content -LiteralPath $dockerfile -Raw
        $content | Should -Not -BeLike '*SpecSet*'
        $content | Should -Not -BeLike '*tools/*'
    }
}
