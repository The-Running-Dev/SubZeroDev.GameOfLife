#Requires -Version 7.0
#Requires -Modules Pester

<#
  Regression coverage for #79: the "Run Pester tests" CI step calls the real design-state
  check (S12.5, tools/Test-DesignState.Tests.ps1) against this repository, which needs an
  authenticated gh exactly as the later "Check the design state against the tree" step
  already does - so it needs the same GH_TOKEN. Without it, an unauthenticated gh turns
  S12.5 into a could-not-evaluate (TrackerUnavailable) rather than a check of anything this
  step is meant to gate.

  The comparison only has a second step to compare against once design-state tracking is
  adopted and verify.yml has grown that "Check the design state against the tree" step. The
  2026-08-19 compatibility promise (design/90-decisions.md) does not migrate it to the installed
  targets this file is copied into, so where verify.yml is absent or carries no such step the
  test is skipped rather than failed - its absence there is the promise being kept, not a
  divergence to report.
#>

$script:CIWorkflowPath = Join-Path (Split-Path $PSScriptRoot -Parent) '.github/workflows/verify.yml'
$script:SkipCIWorkflowGhTokenTest = -not (Test-Path $script:CIWorkflowPath) -or
    -not (Select-String -LiteralPath $script:CIWorkflowPath -Pattern '- name: Check the design state against the tree' -Quiet)

Describe 'CI workflow: the Run Pester tests step is authenticated (#79)' {

    BeforeAll {
        # Recomputed rather than reused from the discovery-time variable above: Pester runs
        # discovery and run as separate passes, and a $script: variable set during discovery is
        # not in scope here. Only -Skip: may read that one, because -Skip: is evaluated during
        # discovery.
        $script:WorkflowPath = Join-Path (Split-Path $PSScriptRoot -Parent) '.github/workflows/verify.yml'
        $script:Lines = Get-Content -LiteralPath $script:WorkflowPath
    }

    It 'the "Run Pester tests" step carries a GH_TOKEN env, the same as "Check the design state against the tree"' -Skip:$script:SkipCIWorkflowGhTokenTest {
        $stepIndex = ($script:Lines | Select-String -Pattern '- name: Run Pester tests').LineNumber
        $stepIndex | Should -Not -BeNullOrEmpty

        # The step body runs from its `- name:` line to the line before the next `- name:`
        # (or end of file), so this only inspects this one step's own env block.
        $nextStepIndex = ($script:Lines | Select-String -Pattern '^\s*- name:' |
            Where-Object { $_.LineNumber -gt $stepIndex } |
            Select-Object -First 1).LineNumber
        $endIndex = if ($nextStepIndex) { $nextStepIndex - 1 } else { $script:Lines.Count }
        $stepBody = $script:Lines[($stepIndex - 1)..($endIndex - 1)] -join "`n"

        $stepBody | Should -Match 'GH_TOKEN:\s*\$\{\{\s*secrets\.GITHUB_TOKEN\s*\}\}'
    }
}

Describe 'CI workflow: the Check the spec set step does not swallow a failing exit code (S2.4)' {

    BeforeAll {
        $script:WorkflowPath = Join-Path (Split-Path $PSScriptRoot -Parent) '.github/workflows/verify.yml'
        $script:Lines = Get-Content -LiteralPath $script:WorkflowPath
    }

    It 'the "Check the spec set" step carries neither continue-on-error nor a swallowed exit code' {
        $stepIndex = ($script:Lines | Select-String -Pattern '- name: Check the spec set').LineNumber
        $stepIndex | Should -Not -BeNullOrEmpty

        $nextStepIndex = ($script:Lines | Select-String -Pattern '^\s*- name:' |
            Where-Object { $_.LineNumber -gt $stepIndex } |
            Select-Object -First 1).LineNumber
        $endIndex = if ($nextStepIndex) { $nextStepIndex - 1 } else { $script:Lines.Count }
        $stepBody = $script:Lines[($stepIndex - 1)..($endIndex - 1)] -join "`n"

        $stepBody | Should -Not -Match 'continue-on-error'
        $stepBody | Should -Not -Match '\|\|\s*true'
    }
}

Describe 'CI workflow: design-state pin ancestry is evaluable' {

    BeforeAll {
        $script:WorkflowPath = Join-Path (Split-Path $PSScriptRoot -Parent) '.github/workflows/verify.yml'
        $script:WorkflowText = Get-Content -LiteralPath $script:WorkflowPath -Raw
    }

    It 'checks out full history so preserved MirroredAt pins resolve in Pester and the design-state gate' {
        $script:WorkflowText | Should -Match '(?ms)- uses: actions/checkout@v4\s+with:\s+fetch-depth:\s*0(?:\s|$)'
    }
}

Describe 'CI workflow: kit-owned gates resolve from pinned AgentKit runtimes (#133)' {

    BeforeAll {
        $script:RepositoryRoot = Split-Path $PSScriptRoot -Parent
        $script:WorkflowPath = Join-Path $script:RepositoryRoot '.github/workflows/verify.yml'
        $script:WorkflowText = Get-Content -LiteralPath $script:WorkflowPath -Raw
    }

    It 'checks out the stable home-install runtime and invokes Test-Companion from AGENTKIT_HOME' {
        $script:WorkflowText | Should -Match '(?ms)- name: Checkout AgentKit runtime\s+uses: actions/checkout@v4\s+with:\s+repository: The-Running-Dev/SubZeroDev\.AgentKit\s+ref: [0-9a-f]{40}\s+path: \.agent-kit(?:\s|$)'
        $script:WorkflowText | Should -Match '(?ms)- name: Validate the core/companion split\s+shell: pwsh\s+env:\s+AGENTKIT_HOME: .*?/\.agent-kit\s+run: .*?\$env:AGENTKIT_HOME.*?tools/Test-Companion\.ps1'
        $script:WorkflowText | Should -Not -Match '(?m)^\s*run:\s*\./tools/Test-Companion\.ps1\s*$'
    }

    It 'materializes exactly the #130 deletion set from the recorded design-state runtime' {
        $script:WorkflowText | Should -Match '(?ms)- name: Checkout compatible design-state runtime\s+uses: actions/checkout@v4\s+with:\s+repository: The-Running-Dev/SubZeroDev\.AgentKit\s+ref: 5095a55c262bad431632e2c9a4d7418b833b3a16\s+path: \.agent-kit-design-state(?:\s|$)'
        $script:WorkflowText | Should -Match '(?ms)- name: Materialize the compatible design-state tree.*?DESIGN_STATE_KIT_ROOT: .*?/\.agent-kit-design-state.*?git diff-tree .*?--diff-filter=D .*?d6ab5330473bd0894090dd8cb514fa5944cd4810.*?Copy-Item -LiteralPath \$source -Destination \$destination'
        $script:WorkflowText | Should -Match '(?ms)- name: Run Pester tests.*?Invoke-Pester -Path tools'
        $script:WorkflowText | Should -Match '(?ms)- name: Check the design state against the tree.*?run: \./tools/Test-DesignState\.ps1'
    }

    It 'overlays the upstream S21 reader without advancing the deliberately held checker' {
        # The held checker is expressed by the workflow's own ref pins (below), materialized
        # per CI job since #130 removed the copy-based tooling this repo used to fork locally.
        # kit.json's syncedCommit is whole-kit sync bookkeeping, not something CI reads to pick
        # a ref, so it is free to advance past this pin on an unrelated /sync — see the
        # 2026-08-30 and 2026-09-21 design/90-decisions.md entries.
        $script:WorkflowText | Should -Match '(?ms)- name: Checkout Decision\.StatedIn schema runtime\s+uses: actions/checkout@v4\s+with:\s+repository: The-Running-Dev/SubZeroDev\.AgentKit\s+ref: 6b32e7d142fabbb9cfc184e19edc9b5345695b39\s+path: \.agent-kit-stated-in(?:\s|$)'
        $script:WorkflowText | Should -Match '(?ms)- name: Materialize the compatible design-state tree.*?STATED_IN_KIT_ROOT: .*?/\.agent-kit-stated-in.*?Copy-Item -LiteralPath \(Join-Path \$env:STATED_IN_KIT_ROOT ''tools/Read-DesignState\.ps1''\) -Destination ''tools/Read-DesignState\.ps1'''
    }
}
