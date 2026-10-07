#Requires -Version 7.0
#Requires -Modules Pester

<#
  Regression coverage for the verify.yml workflow's own steps. The design-state, companion and
  kit-runtime steps were retired with the copy-based AgentKit machinery (design/90-decisions.md,
  2026-10-07); only what this repository's own gates need is asserted here.
#>

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
