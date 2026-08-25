#Requires -Version 7.0
#Requires -Modules Pester

<#
  Mocks the seams above gh and git - Get-OpenIssueList, Get-ProjectItemPositions,
  Get-CurrentWorkMirrorSha - rather than the native commands themselves, the same reason
  Test-DesignDrift.Tests.ps1 gives: both read a native exit code as part of their answer and a
  Mock cannot set $LASTEXITCODE.

  Every state set is written into $TestDrive; none of these tests read this repository's own
  design/state/work/, so they do not start failing when a real WorkRef is mirrored.
#>

BeforeAll {
    $script:ScriptPath = Join-Path $PSScriptRoot 'Update-WorkMirror.ps1'
    $script:PreDotSourceErrorActionPreference = $ErrorActionPreference
    . $script:ScriptPath

    function New-Issue {
        param([int] $Number, [string] $Title, [string] $State = 'OPEN', [string] $Body = '', $Milestone = $null)
        [pscustomobject]@{ number = $Number; title = $Title; state = $State; body = $Body; milestone = $Milestone }
    }

    function New-RepoRoot {
        $dir = Join-Path $TestDrive ([Guid]::NewGuid().ToString())
        New-Item -ItemType Directory -Path $dir -Force | Out-Null
        $dir
    }
}

AfterAll {
    $ErrorActionPreference = $script:PreDotSourceErrorActionPreference
    Set-StrictMode -Off
}

Describe 'Update-WorkMirror' {

    BeforeEach {
        # Default: no project resolvable, so a test that never mentions Get-CurrentRepoOwnerName
        # exercises the milestone/issue-number tiers rather than making a real `gh repo view`
        # call. Tests that need the project tier override this in their own body.
        Mock Get-CurrentRepoOwnerName { $null }
    }

    Context 'the freeze gate (S14.5)' {
        It 'does not run and says so when design/FROZEN.md exists' {
            $repo = New-RepoRoot
            New-Item -ItemType Directory -Path (Join-Path $repo 'design') -Force | Out-Null
            Set-Content -LiteralPath (Join-Path $repo 'design/FROZEN.md') -Value "# design/ is frozen`n`nFrozen because: testing`nLifts when: never`n"
            Mock Get-OpenIssueList { throw 'must not be called while frozen' }

            $r = Invoke-WorkMirrorUpdate -RepoPath $repo

            $r.State | Should -Be 'Frozen'
            $r.Written.Count | Should -Be 0
            Test-Path -LiteralPath (Join-Path $repo 'design/state/work') | Should -BeFalse
        }
    }

    Context 'gh unavailable (S14.4)' {
        It 'reports could-not-evaluate and writes no mirror' {
            $repo = New-RepoRoot
            Mock Get-OpenIssueList { [pscustomobject]@{ Issues = @(); Failure = (New-WorkMirrorFailure -Reason 'GhUnavailable' -Detail 'gh exited 1') } }

            $r = Invoke-WorkMirrorUpdate -RepoPath $repo

            $r.State | Should -Be 'NotEvaluated'
            $r.CouldNotEvaluate.Count | Should -Be 1
            $r.CouldNotEvaluate[0].Reason | Should -Be 'GhUnavailable'
            $r.Written.Count | Should -Be 0
            Test-Path -LiteralPath (Join-Path $repo 'design/state/work') | Should -BeFalse
        }

        It 'never writes an empty mirror on failure, even if design/state/work already holds records' {
            $repo = New-RepoRoot
            $workDir = Join-Path $repo 'design/state/work'
            New-Item -ItemType Directory -Path $workDir -Force | Out-Null
            Set-Content -LiteralPath (Join-Path $workDir '9.md') -Value "# work/9`nIssue: 9`nTitle: existing`nState: OPEN`nRank: 9`nMirroredAt: deadbee`nCriteria:`n"
            Mock Get-OpenIssueList { [pscustomobject]@{ Issues = @(); Failure = (New-WorkMirrorFailure -Reason 'GhUnavailable' -Detail 'no auth') } }

            Invoke-WorkMirrorUpdate -RepoPath $repo | Out-Null

            (Get-Content -LiteralPath (Join-Path $workDir '9.md') -Raw) | Should -Match 'MirroredAt: deadbee'
        }
    }

    Context 'writing records (S14.1, S14.2)' {
        It 'writes a WorkRef record per open issue and nothing else' {
            $repo = New-RepoRoot
            Mock Get-OpenIssueList { [pscustomobject]@{
                Issues  = @((New-Issue -Number 57 -Title 'S14 — Work state' -Body "### Done when`n- [ ] **S14.1** first`n- [x] **S14.2** second"))
                Failure = $null
            } }
            Mock Get-ProjectItemPositions { $null }
            Mock Get-CurrentWorkMirrorSha { 'abc1234' }

            $r = Invoke-WorkMirrorUpdate -RepoPath $repo

            $r.State | Should -Be 'Clean'
            $r.Written.Count | Should -Be 1
            $file = Join-Path $repo 'design/state/work/57.md'
            Test-Path -LiteralPath $file | Should -BeTrue
            $text = Get-Content -LiteralPath $file -Raw
            $text | Should -Match '# work/57'
            $text | Should -Match 'Issue: 57'
            $text | Should -Match 'Title: S14 — Work state'
            $text | Should -Match 'State: OPEN'
            $text | Should -Match 'MirroredAt: abc1234'
            $text | Should -Match 'Criteria: S14\.1, S14\.2'
        }

        It 'stamps MirroredAt even when a write changes no other field' {
            $repo = New-RepoRoot
            Mock Get-OpenIssueList { [pscustomobject]@{
                Issues  = @((New-Issue -Number 57 -Title 'S14 — Work state' -Body "- [ ] **S14.1** first"))
                Failure = $null
            } }
            Mock Get-ProjectItemPositions { $null }
            Mock Get-CurrentWorkMirrorSha { 'sha0001' }
            Invoke-WorkMirrorUpdate -RepoPath $repo | Out-Null

            Mock Get-CurrentWorkMirrorSha { 'sha0002' }
            Invoke-WorkMirrorUpdate -RepoPath $repo | Out-Null

            $text = Get-Content -LiteralPath (Join-Path $repo 'design/state/work/57.md') -Raw
            $text | Should -Match 'MirroredAt: sha0002'
        }

        It 'writes never carry an Issue, Milestone or git side effect - fields are the closed WorkRef vocabulary only' {
            $repo = New-RepoRoot
            Mock Get-OpenIssueList { [pscustomobject]@{
                Issues  = @((New-Issue -Number 3 -Title 'A story with no ids' -Body "- [ ] plain bullet, no bolded id"))
                Failure = $null
            } }
            Mock Get-ProjectItemPositions { $null }
            Mock Get-CurrentWorkMirrorSha { 'zzz9999' }

            Invoke-WorkMirrorUpdate -RepoPath $repo | Out-Null

            $text = Get-Content -LiteralPath (Join-Path $repo 'design/state/work/3.md') -Raw
            $text | Should -Match 'Criteria:\s*$'
        }
    }

    Context 'Rank degradation (S14.3)' {
        It 'uses the project position when the issue is in the project' {
            $repo = New-RepoRoot
            Mock Get-OpenIssueList { [pscustomobject]@{
                Issues  = @((New-Issue -Number 12 -Title 'In the project'))
                Failure = $null
            } }
            Mock Get-CurrentRepoOwnerName { [pscustomobject]@{ Owner = 'boyank'; Name = 'AgentKit' } }
            Mock Get-ProjectItemPositions { @{ 12 = 3 } }
            Mock Get-CurrentWorkMirrorSha { 'sha' }

            Invoke-WorkMirrorUpdate -RepoPath $repo | Out-Null

            (Get-Content -LiteralPath (Join-Path $repo 'design/state/work/12.md') -Raw) | Should -Match 'Rank: 3'
        }

        It 'falls back to the milestone number when no project has the issue' {
            $repo = New-RepoRoot
            Mock Get-OpenIssueList { [pscustomobject]@{
                Issues  = @((New-Issue -Number 12 -Title 'Milestoned' -Milestone ([pscustomobject]@{ number = 5; title = 'M1' })))
                Failure = $null
            } }
            Mock Get-ProjectItemPositions { $null }
            Mock Get-CurrentWorkMirrorSha { 'sha' }

            Invoke-WorkMirrorUpdate -RepoPath $repo | Out-Null

            (Get-Content -LiteralPath (Join-Path $repo 'design/state/work/12.md') -Raw) | Should -Match 'Rank: milestone/5'
        }

        It 'falls back to the issue number when neither a project nor a milestone places it, and raises no finding' {
            $repo = New-RepoRoot
            Mock Get-OpenIssueList { [pscustomobject]@{
                Issues  = @((New-Issue -Number 12 -Title 'Neither'))
                Failure = $null
            } }
            Mock Get-ProjectItemPositions { $null }
            Mock Get-CurrentWorkMirrorSha { 'sha' }

            $r = Invoke-WorkMirrorUpdate -RepoPath $repo

            (Get-Content -LiteralPath (Join-Path $repo 'design/state/work/12.md') -Raw) | Should -Match 'Rank: 12'
            $r.State | Should -Be 'Clean'
        }

        It 'never emits a WorkRef with an absent Rank' {
            $repo = New-RepoRoot
            Mock Get-OpenIssueList { [pscustomobject]@{
                Issues  = @((New-Issue -Number 1 -Title 'a'), (New-Issue -Number 2 -Title 'b' -Milestone ([pscustomobject]@{ number = 9 })))
                Failure = $null
            } }
            Mock Get-ProjectItemPositions { @{ 1 = 1 } }
            Mock Get-CurrentWorkMirrorSha { 'sha' }

            Invoke-WorkMirrorUpdate -RepoPath $repo | Out-Null

            foreach ($n in 1, 2) {
                (Get-Content -LiteralPath (Join-Path $repo "design/state/work/$n.md") -Raw) | Should -Match 'Rank: \S+'
            }
        }
    }

    Context 'refreshing a WorkRef after its issue closes (#29)' {
        It 'rewrites an existing record to State: CLOSED once its issue drops out of the open list' {
            $repo = New-RepoRoot
            $workDir = Join-Path $repo 'design/state/work'
            New-Item -ItemType Directory -Path $workDir -Force | Out-Null
            Set-Content -LiteralPath (Join-Path $workDir '10.md') -Value "# work/10`nIssue: 10`nTitle: S3 - old title`nState: OPEN`nRank: 10`nMirroredAt: oldsha`nCriteria: S3.1`n"
            Mock Get-OpenIssueList { [pscustomobject]@{ Issues = @(); Failure = $null } }
            Mock Get-ProjectItemPositions { $null }
            Mock Get-CurrentWorkMirrorSha { 'newsha' }
            Mock Get-IssuesByNumber { @((New-Issue -Number 10 -Title 'S3 - old title' -State 'CLOSED' -Body "- [x] **S3.1** done")) }

            $r = Invoke-WorkMirrorUpdate -RepoPath $repo

            $r.State | Should -Be 'Clean'
            $text = Get-Content -LiteralPath (Join-Path $workDir '10.md') -Raw
            $text | Should -Match 'State: CLOSED'
            $text | Should -Match 'MirroredAt: newsha'
        }

        It 'only re-fetches issue numbers that already have an on-disk WorkRef, not the whole tracker' {
            $repo = New-RepoRoot
            $workDir = Join-Path $repo 'design/state/work'
            New-Item -ItemType Directory -Path $workDir -Force | Out-Null
            Set-Content -LiteralPath (Join-Path $workDir '10.md') -Value "# work/10`nIssue: 10`nTitle: t`nState: OPEN`nRank: 10`nMirroredAt: oldsha`nCriteria:`n"
            Mock Get-OpenIssueList { [pscustomobject]@{ Issues = @(); Failure = $null } }
            Mock Get-ProjectItemPositions { $null }
            Mock Get-CurrentWorkMirrorSha { 'newsha' }
            Mock Get-IssuesByNumber { @() }

            Invoke-WorkMirrorUpdate -RepoPath $repo | Out-Null

            Should -Invoke Get-IssuesByNumber -Times 1 -ParameterFilter { @($Numbers) -join ',' -eq '10' }
        }

        It 'leaves an existing record untouched when the closed-issue re-fetch itself cannot resolve it' {
            $repo = New-RepoRoot
            $workDir = Join-Path $repo 'design/state/work'
            New-Item -ItemType Directory -Path $workDir -Force | Out-Null
            $original = "# work/10`nIssue: 10`nTitle: t`nState: OPEN`nRank: 10`nMirroredAt: oldsha`nCriteria:`n"
            Set-Content -LiteralPath (Join-Path $workDir '10.md') -Value $original -NoNewline
            Mock Get-OpenIssueList { [pscustomobject]@{ Issues = @(); Failure = $null } }
            Mock Get-ProjectItemPositions { $null }
            Mock Get-CurrentWorkMirrorSha { 'newsha' }
            Mock Get-IssuesByNumber { @() }

            Invoke-WorkMirrorUpdate -RepoPath $repo | Out-Null

            (Get-Content -LiteralPath (Join-Path $workDir '10.md') -Raw) | Should -Be $original
        }

        It 'does not re-fetch an open issue that already came back from Get-OpenIssueList' {
            $repo = New-RepoRoot
            $workDir = Join-Path $repo 'design/state/work'
            New-Item -ItemType Directory -Path $workDir -Force | Out-Null
            Set-Content -LiteralPath (Join-Path $workDir '9.md') -Value "# work/9`nIssue: 9`nTitle: t`nState: OPEN`nRank: 9`nMirroredAt: oldsha`nCriteria:`n"
            Mock Get-OpenIssueList { [pscustomobject]@{ Issues = @((New-Issue -Number 9 -Title 't')); Failure = $null } }
            Mock Get-ProjectItemPositions { $null }
            Mock Get-CurrentWorkMirrorSha { 'newsha' }
            Mock Get-IssuesByNumber { throw 'must not be called for a still-open issue' }

            Invoke-WorkMirrorUpdate -RepoPath $repo | Out-Null

            (Get-Content -LiteralPath (Join-Path $workDir '9.md') -Raw) | Should -Match 'MirroredAt: newsha'
        }
    }

    Context 'invocation shape (S14.6)' {
        It 'is the only script under tools/ that invokes gh issue create, gh label, gh milestone, or git commit' {
            $text = Get-Content -LiteralPath $script:ScriptPath -Raw
            $text | Should -Not -Match 'gh\s+issue\s+create'
            $text | Should -Not -Match 'gh\s+label'
            $text | Should -Not -Match 'gh\s+milestone'
            $text | Should -Not -Match 'git\s+commit'
            $text | Should -Not -Match 'git\s+push'
        }
    }

    Context 'Invoke-Gh decodes the child process output as UTF-8 regardless of the console default (#48)' {
        <#
          gh itself needs auth this environment cannot guarantee, so this points Invoke-Gh's
          -Command at git instead - a process this repository can always run, and one whose
          "show a blob containing an em dash" output exercises the exact same
          ProcessStartInfo/StandardOutputEncoding path Invoke-Gh uses for gh. The `&` call
          operator Invoke-Gh replaced decoded a captured child's stdout using
          [Console]::OutputEncoding, which on Windows defaults to the OEM code page rather
          than the UTF-8 the child actually writes - this is the regression test for that:
          it fails under the pre-fix `&`-based implementation and passes under Invoke-Gh.
        #>
        BeforeAll {
            $script:EncodingRepo = Join-Path $TestDrive 'encoding-repo'
            New-Item -ItemType Directory -Path $script:EncodingRepo -Force | Out-Null
            & git -C $script:EncodingRepo init --quiet 2>$null
            & git -C $script:EncodingRepo config user.email 'test@example.com' 2>$null
            & git -C $script:EncodingRepo config user.name 'Test' 2>$null
            Set-Content -LiteralPath (Join-Path $script:EncodingRepo 'file.md') -Value "line one em dash `u{2014} end" -NoNewline -Encoding utf8NoBOM
            & git -C $script:EncodingRepo add file.md 2>$null
            & git -C $script:EncodingRepo commit -m 'em dash' --quiet 2>$null
        }

        It 'decodes a non-ASCII child process output correctly even when Console.OutputEncoding is a non-UTF8 code page' {
            $original = [Console]::OutputEncoding
            try {
                [Console]::OutputEncoding = [System.Text.Encoding]::GetEncoding(437)
                $result = Invoke-Gh -Command 'git' -Arguments @('-C', $script:EncodingRepo, 'show', 'HEAD:file.md')
            } finally {
                [Console]::OutputEncoding = $original
            }

            $result.ExitCode | Should -Be 0
            $result.StdOut | Should -Be "line one em dash `u{2014} end"
        }
    }
}
