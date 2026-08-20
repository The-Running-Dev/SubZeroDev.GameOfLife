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
function Invoke-SpecSetCheck {
    param([Parameter(Mandatory)][object] $Index)

    $unchecked = @()
    if ($Index.ProvisionalEntries.Count -eq 0) {
        $unchecked += [pscustomobject]@{
            Reason = 'RegisterAbsent'
            Detail = 'No provisional-register region exists, so provisional-number checks could not run.'
        }
    }

    [pscustomobject]@{
        Findings = @()
        Unchecked = $unchecked
        Counts = [pscustomobject]@{ Unchecked = $unchecked.Count }
    }
}
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
$check = if ($index.State -eq 'Indexed') { Invoke-SpecSetCheck -Index $index } else { [pscustomobject]@{ Findings = @(); Unchecked = @(); Counts = [pscustomobject]@{} } }
$state = if ($index.State -ne 'Indexed' -or $check.Unchecked.Count -gt 0) { 'NotEvaluated' } elseif ($check.Findings.Count -gt 0) { 'Invalid' } else { 'Valid' }
$reason = if ($index.State -ne 'Indexed') { $index.Reason } elseif ($check.Unchecked.Count -gt 0) { $check.Unchecked[0].Reason } else { $null }
$detail = if ($index.State -ne 'Indexed') { $index.Detail } elseif ($check.Unchecked.Count -gt 0) { $check.Unchecked[0].Detail } else { '' }
$result = [pscustomobject]@{ State = $state; Reason = $reason; Detail = $detail; Line = $index.Line; Documents = $index.Documents; Declarations = $index.Declarations; Findings = $check.Findings; Unchecked = $check.Unchecked; Counts = [pscustomobject]@{ Documents = $index.Documents.Count; Declarations = $index.Declarations.Count; Unchecked = $check.Unchecked.Count }; Commit = $git.Commit; WorkingTree = $git.WorkingTree }
if (-not $Quiet) { Write-SpecSetReport -Result $result }
$result
if ($MyInvocation.InvocationName -ne '.') { exit (Get-SpecSetExitCode -State $result.State) }
