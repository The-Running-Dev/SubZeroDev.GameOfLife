#Requires -Version 7.0
#Requires -Modules Pester

<#
  Regression coverage for verify.yml. The workflow calls the shared GitHub-ActionTemplates
  workflows; what those run (the parse check, Pester failing the job on a failed test, the
  swallowed-exit-code guards) is the library's to test and is not re-asserted here. This file
  pins what this repository chooses: the triggers, the library calls and their inputs, and that
  the spec-set check stays a gate. The design-state, companion and kit-runtime steps were
  retired with the copy-based AgentKit machinery (design/90-decisions.md, 2026-10-07).
#>

Describe 'CI workflow: verify.yml calls the shared library workflows' {

    BeforeAll {
        $workflowPath = Join-Path (Split-Path $PSScriptRoot -Parent) '.github/workflows/verify.yml'
        $script:Workflow = Get-Content -LiteralPath $workflowPath -Raw

        function Get-Job([string] $Name) {
            $match = [regex]::Match($script:Workflow, "(?ms)^  $([regex]::Escape($Name)):\n(?<body>.*?)(?=^  \S|\z)")
            $match.Success | Should -BeTrue -Because "verify.yml has a '$Name' job"
            $match.Groups['body'].Value
        }
    }

    It 'runs once per change: push to main only, plus pull_request' {
        $script:Workflow | Should -Match '(?ms)^on:\n  push:\n    branches: \[main\]\n  pull_request:\n'
    }

    It 'sets no permissions at the top and grants each job contents: read' {
        $script:Workflow | Should -Match '(?m)^permissions: \{\}$'
        foreach ($job in 'powershell', 'content') {
            Get-Job $job | Should -Match '(?ms)permissions:\n      contents: read\n'
        }
    }

    It 'the powershell job calls pwsh-ci.yml@v0, tests tools, and runs the spec-set check after the tests' {
        $body = Get-Job 'powershell'
        $body | Should -Match 'uses: The-Running-Dev/GitHub-ActionTemplates/\.github/workflows/pwsh-ci\.yml@v0'
        $body | Should -Match '(?m)^      tests: tools$'
        $body | Should -Match '(?m)^      post-build: tools/Test-SpecSet\.ps1$'
    }

    It 'the content job calls node-ci.yml@v0 on Node 24 with the engine submodule checked out recursively' {
        $body = Get-Job 'content'
        $body | Should -Match 'uses: The-Running-Dev/GitHub-ActionTemplates/\.github/workflows/node-ci\.yml@v0'
        $body | Should -Match "(?m)^      node-versions: '\[""24""\]'$"
        $body | Should -Match '(?m)^      submodules: recursive$'
        $body | Should -Match '(?m)^      setup: setup$'
    }

    It 'the content job runs typecheck before export:content before check:clean (CP12)' {
        $body = Get-Job 'content'
        $body | Should -Match '(?m)^      scripts: typecheck test export:content check:clean$'
    }

    It 'no job sets continue-on-error or swallows an exit code' {
        $script:Workflow | Should -Not -Match 'continue-on-error'
        $script:Workflow | Should -Not -Match '\|\|\s*true'
    }

    It 'the committed gates file lists the spec-set check' {
        $gatesPath = Join-Path (Split-Path $PSScriptRoot -Parent) '.github/gates.json'
        $gates = (Get-Content -LiteralPath $gatesPath -Raw | ConvertFrom-Json).gates
        @($gates | Where-Object { $_.command -like '*Test-SpecSet.ps1*' }) | Should -Not -BeNullOrEmpty
    }
}
