#Requires -Version 7.0
[CmdletBinding()]
param([string] $CorpusPath, [switch] $Quiet)
Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'
. (Join-Path $PSScriptRoot 'Read-SpecSet.ps1')

function Get-SpecSetExitCode {
    param([string] $State)
    switch ($State) { 'Valid' { return 0 } 'Invalid' { return 1 } 'NotEvaluated' { return 2 } default { throw "Unknown spec-set state '$State'." } }
}
function Invoke-SpecSetCheck { param([Parameter(Mandatory)][object] $Index) [pscustomobject]@{ Findings = @(); Unchecked = @(); Counts = [pscustomobject]@{} } }
function Write-SpecSetReport { param([Parameter(Mandatory)][object] $Result) "Spec-set: $($Result.State); $($Result.Documents.Count) documents; $($Result.Declarations.Count) declarations." }
function Get-SpecSetGitInfo {
    $root = Split-Path -Parent $PSScriptRoot
    $sha = (& git -C $root rev-parse HEAD 2>$null); if ($LASTEXITCODE -ne 0) { return [pscustomobject]@{ Commit = $null; WorkingTree = 'NotAGitRepository' } }
    & git -C $root diff --quiet; $clean = ($LASTEXITCODE -eq 0); & git -C $root diff --cached --quiet; $clean = $clean -and ($LASTEXITCODE -eq 0)
    [pscustomobject]@{ Commit = $sha; WorkingTree = if ($clean) { 'Clean' } else { 'Dirty' } }
}

if (-not $CorpusPath) { $CorpusPath = Join-Path (Split-Path -Parent $PSScriptRoot) 'docs/docs/games' }
$index = Read-SpecSetIndex -CorpusPath $CorpusPath
$git = Get-SpecSetGitInfo
$result = [pscustomobject]@{ State = if ($index.State -eq 'Indexed') { 'Valid' } else { 'NotEvaluated' }; Reason = $index.Reason; Detail = $index.Detail; Line = $index.Line; Documents = $index.Documents; Declarations = $index.Declarations; Findings = @(); Unchecked = @(); Counts = [pscustomobject]@{ Documents = $index.Documents.Count; Declarations = $index.Declarations.Count }; Commit = $git.Commit; WorkingTree = $git.WorkingTree }
if (-not $Quiet) { Write-SpecSetReport -Result $result }
$result
if ($MyInvocation.InvocationName -ne '.') { exit (Get-SpecSetExitCode -State $result.State) }
