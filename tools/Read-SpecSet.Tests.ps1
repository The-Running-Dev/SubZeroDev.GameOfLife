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
}
