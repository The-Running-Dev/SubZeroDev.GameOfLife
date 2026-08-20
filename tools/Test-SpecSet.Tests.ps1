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
