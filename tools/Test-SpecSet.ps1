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
function Get-MirrorFindings {
    param([Parameter(Mandatory)][object] $Index)

    $findings = [System.Collections.Generic.List[object]]::new()
    foreach ($obligation in $Index.MirrorObligations) {
        $decl = @($Index.Declarations | Where-Object { $_.QualifiedName -eq $obligation.QualifiedName })
        if ($decl.Count -eq 0) {
            $f = [SpecFinding]::new()
            $f.CheckId = 'mirror'; $f.Subject = $obligation.QualifiedName; $f.DocumentPath = $obligation.DocumentPath; $f.Line = $obligation.Line
            $f.Detail = "mirror-$($obligation.QualifiedName) in $($obligation.DocumentPath) names a declaration that does not exist."
            $findings.Add($f)
            continue
        }
        $declaration = $decl[0]
        if (-not $declaration.IsClosed) {
            $f = [SpecFinding]::new()
            $f.CheckId = 'mirror'; $f.Subject = $obligation.QualifiedName; $f.DocumentPath = $obligation.DocumentPath; $f.Line = $obligation.Line
            $f.Detail = "mirror-$($obligation.QualifiedName) in $($obligation.DocumentPath) names an open declaration, which cannot carry a mirror obligation."
            $findings.Add($f)
            continue
        }
        foreach ($member in $declaration.Members) {
            if ($member -notin $obligation.BodyMembers) {
                $f = [SpecFinding]::new()
                $f.CheckId = 'mirror'; $f.Subject = "$($obligation.QualifiedName).$member"; $f.DocumentPath = $obligation.DocumentPath; $f.Line = $obligation.Line
                $f.Detail = "$($declaration.DocumentPath) declares $($obligation.QualifiedName).$member; $($obligation.DocumentPath) does not mention it."
                $findings.Add($f)
            }
        }
        foreach ($named in $obligation.BodyMembers) {
            if ($named -notin $declaration.Members) {
                $f = [SpecFinding]::new()
                $f.CheckId = 'mirror'; $f.Subject = "$($obligation.QualifiedName).$named"; $f.DocumentPath = $obligation.DocumentPath; $f.Line = $obligation.Line
                $f.Detail = "$($obligation.DocumentPath) mentions $($obligation.QualifiedName).$named; $($declaration.DocumentPath) does not declare it."
                $findings.Add($f)
            }
        }
    }
    return ,@($findings)
}
function Get-ProvisionalFindings {
    param([Parameter(Mandatory)][object] $Index)

    $findings = [System.Collections.Generic.List[object]]::new()
    $siteKeys = @($Index.ProvisionalSites | ForEach-Object Key)
    foreach ($entry in $Index.ProvisionalEntries) {
        if ([string]::IsNullOrWhiteSpace($entry.Reason)) {
            $f = [SpecFinding]::new()
            $f.CheckId = 'provisional'; $f.Subject = $entry.Area; $f.DocumentPath = $entry.DocumentPath; $f.Line = $entry.Line
            $f.Detail = "The provisional register row '$($entry.Area)' has an empty Reason cell."
            $findings.Add($f)
        }
        if ([string]::IsNullOrWhiteSpace($entry.SettlesWhen)) {
            $f = [SpecFinding]::new()
            $f.CheckId = 'provisional'; $f.Subject = $entry.Area; $f.DocumentPath = $entry.DocumentPath; $f.Line = $entry.Line
            $f.Detail = "The provisional register row '$($entry.Area)' has an empty Settles when cell."
            $findings.Add($f)
        }
        $key = Get-ProvisionalKey -Area $entry.Area
        if ($key -notin $siteKeys) {
            $f = [SpecFinding]::new()
            $f.CheckId = 'provisional'; $f.Subject = $entry.Area; $f.DocumentPath = $entry.DocumentPath; $f.Line = $entry.Line
            $f.Detail = "The provisional register row '$($entry.Area)' has no matching provisional-site-$key region."
            $findings.Add($f)
        }
    }
    $entryKeys = @($Index.ProvisionalEntries | ForEach-Object { Get-ProvisionalKey -Area $_.Area })
    foreach ($site in $Index.ProvisionalSites) {
        if ($site.Key -notin $entryKeys) {
            $f = [SpecFinding]::new()
            $f.CheckId = 'provisional'; $f.Subject = $site.Key; $f.DocumentPath = $site.DocumentPath; $f.Line = $site.Line
            $f.Detail = "provisional-site-$($site.Key) in $($site.DocumentPath) has no matching provisional register row."
            $findings.Add($f)
        }
    }
    return ,@($findings)
}
function Get-ConceptFindings {
    param([Parameter(Mandatory)][object] $Index)

    $findings = [System.Collections.Generic.List[object]]::new()
    $lifecycleByName = @{}
    foreach ($lifecycle in $Index.Lifecycles) {
        if (-not $lifecycleByName.ContainsKey($lifecycle.ConceptName)) { $lifecycleByName[$lifecycle.ConceptName] = $lifecycle }
    }

    foreach ($concept in $Index.Concepts) {
        if (-not $lifecycleByName.ContainsKey($concept)) {
            $f = [SpecFinding]::new()
            $f.CheckId = 'concept'; $f.Subject = $concept; $f.DocumentPath = ''; $f.Line = 0
            $f.Detail = "$concept is a state-bearing concept with no lifecycle-$concept region."
            $findings.Add($f)
            continue
        }
        $lifecycle = $lifecycleByName[$concept]
        if ($lifecycle.LabelCount -lt 2) {
            $f = [SpecFinding]::new()
            $f.CheckId = 'concept'; $f.Subject = $concept; $f.DocumentPath = $lifecycle.DocumentPath; $f.Line = $lifecycle.Line
            $f.Detail = "lifecycle-$concept in $($lifecycle.DocumentPath) states only one boundary of the lifecycle; it must state both what creates $concept and what retires it."
            $findings.Add($f)
        }
    }
    foreach ($lifecycle in $Index.Lifecycles) {
        if ($lifecycle.ConceptName -notin $Index.Concepts) {
            $f = [SpecFinding]::new()
            $f.CheckId = 'concept'; $f.Subject = $lifecycle.ConceptName; $f.DocumentPath = $lifecycle.DocumentPath; $f.Line = $lifecycle.Line
            $f.Detail = "lifecycle-$($lifecycle.ConceptName) in $($lifecycle.DocumentPath) names a concept outside the derived concept set."
            $findings.Add($f)
        }
    }
    return ,@($findings)
}
function Get-ReferenceResolutions {
    param([Parameter(Mandatory)][object] $Index)

    $resolutions = [System.Collections.Generic.List[object]]::new()
    foreach ($ref in $Index.References) {
        if ($ref.Kind -eq 'CrossRepository') {
            $finding = $null
            if ([string]::IsNullOrWhiteSpace($ref.PinnedSha)) {
                $f = [SpecFinding]::new()
                $f.CheckId = 'reference'; $f.Subject = $ref.RawTarget; $f.DocumentPath = $ref.SourcePath; $f.Line = $ref.Line
                $f.Detail = "Cross-repository reference to '$($ref.RawTarget)' in $($ref.SourcePath) carries no pinned commit."
                $finding = $f
            }
            $resolutions.Add([pscustomobject]@{ Reference = $ref; Status = 'Unresolvable'; Finding = $finding })
            continue
        }
        if ($ref.Kind -eq 'Document') {
            $found = @($Index.Documents | Where-Object { [System.IO.Path]::GetFileName($_.Path) -eq $ref.RawTarget })
            if ($found.Count -eq 0) {
                $f = [SpecFinding]::new()
                $f.CheckId = 'reference'; $f.Subject = $ref.RawTarget; $f.DocumentPath = $ref.SourcePath; $f.Line = $ref.Line
                $f.Detail = "Document link to '$($ref.RawTarget)' in $($ref.SourcePath) resolves to nothing."
                $resolutions.Add([pscustomobject]@{ Reference = $ref; Status = 'Failed'; Finding = $f })
            } else {
                $resolutions.Add([pscustomobject]@{ Reference = $ref; Status = 'Held'; Finding = $null })
            }
            continue
        }
        # Kind -eq 'Section'
        $parts = $ref.RawTarget.Split('#')
        $targetName = $parts[0]; $number = $parts[1]
        $doc = @($Index.Documents | Where-Object { [System.IO.Path]::GetFileName($_.Path) -eq $targetName })
        if ($doc.Count -eq 0 -or $number -notin $doc[0].SectionNumbers) {
            $f = [SpecFinding]::new()
            $f.CheckId = 'reference'; $f.Subject = "§$number"; $f.DocumentPath = $ref.SourcePath; $f.Line = $ref.Line
            $f.Detail = "Section reference '§$number' in $($ref.SourcePath) resolves to nothing in $targetName."
            $resolutions.Add([pscustomobject]@{ Reference = $ref; Status = 'Failed'; Finding = $f })
        } else {
            $resolutions.Add([pscustomobject]@{ Reference = $ref; Status = 'Held'; Finding = $null })
        }
    }
    return ,@($resolutions)
}
function Get-ReferenceFindings {
    param([Parameter(Mandatory)][object] $Index)
    return ,@((Get-ReferenceResolutions -Index $Index) | Where-Object { $_.Finding } | ForEach-Object Finding)
}
function Get-ReferenceUnresolvable {
    param([Parameter(Mandatory)][object] $Index)

    $entries = [System.Collections.Generic.List[object]]::new()
    foreach ($resolution in @((Get-ReferenceResolutions -Index $Index) | Where-Object Status -eq 'Unresolvable')) {
        $ref = $resolution.Reference
        $entries.Add([pscustomobject]@{
            Reason = 'CrossRepositoryUnresolvable'
            Detail = "$($ref.SourcePath):$($ref.Line) references $($ref.RawTarget), which lives in SubZeroDev.GameEngine and cannot be resolved from this repository."
        })
    }
    return ,@($entries)
}
function Get-SpecSetBucketCounts {
    param([Parameter(Mandatory)][object] $Index, [AllowEmptyCollection()][object[]] $Findings = @(), [AllowEmptyCollection()][object[]] $ReferenceResolutions = @())

    $mirrorFindingSubjects = @($Findings | Where-Object CheckId -eq 'mirror' | ForEach-Object Subject)
    $mirrorFailed = @($Index.MirrorObligations | Where-Object { $obligationName = $_.QualifiedName; @($mirrorFindingSubjects | Where-Object { $_ -eq $obligationName -or $_.StartsWith("$obligationName.") }).Count -gt 0 }).Count
    $mirrorTotal = $Index.MirrorObligations.Count

    $provisionalFailedAreas = @($Findings | Where-Object CheckId -eq 'provisional' | ForEach-Object Subject | Select-Object -Unique)
    $provisionalFailed = @($Index.ProvisionalEntries | Where-Object { $_.Area -in $provisionalFailedAreas }).Count
    $provisionalTotal = $Index.ProvisionalEntries.Count

    $conceptFindingSubjects = @($Findings | Where-Object CheckId -eq 'concept' | ForEach-Object Subject)
    $conceptFailed = @($Index.Concepts | Where-Object { $_ -in $conceptFindingSubjects }).Count
    $conceptTotal = $Index.Concepts.Count

    $referenceHeld = @($ReferenceResolutions | Where-Object Status -eq 'Held').Count
    $referenceFailed = @($ReferenceResolutions | Where-Object { $_.Status -eq 'Failed' -or ($_.Status -eq 'Unresolvable' -and $_.Finding) }).Count
    $referenceUnresolvable = @($ReferenceResolutions | Where-Object Status -eq 'Unresolvable').Count
    $referenceTotal = $ReferenceResolutions.Count

    [pscustomobject]@{
        MirrorObligations = [pscustomobject]@{ Held = $mirrorTotal - $mirrorFailed; Failed = $mirrorFailed; Unchecked = 0; Unresolvable = 0; Total = $mirrorTotal }
        ProvisionalEntries = [pscustomobject]@{ Held = $provisionalTotal - $provisionalFailed; Failed = $provisionalFailed; Unchecked = 0; Unresolvable = 0; Total = $provisionalTotal }
        Concepts = [pscustomobject]@{ Held = $conceptTotal - $conceptFailed; Failed = $conceptFailed; Unchecked = 0; Unresolvable = 0; Total = $conceptTotal }
        References = [pscustomobject]@{ Held = $referenceHeld; Failed = $referenceFailed; Unchecked = 0; Unresolvable = $referenceUnresolvable; Total = $referenceTotal }
    }
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

    $findings = @((Get-MirrorFindings -Index $Index) + (Get-ProvisionalFindings -Index $Index) + (Get-ConceptFindings -Index $Index) + (Get-ReferenceFindings -Index $Index))
    $unresolvable = Get-ReferenceUnresolvable -Index $Index
    $resolutions = Get-ReferenceResolutions -Index $Index
    $buckets = Get-SpecSetBucketCounts -Index $Index -Findings $findings -ReferenceResolutions $resolutions

    [pscustomobject]@{
        Findings = $findings
        Unchecked = $unchecked
        Unresolvable = $unresolvable
        Buckets = $buckets
        Counts = [pscustomobject]@{ Unchecked = $unchecked.Count; Unresolvable = $unresolvable.Count }
    }
}
function Write-SpecSetReport { param([Parameter(Mandatory)][object] $Result) "Spec-set: $($Result.State); $($Result.Documents.Count) documents; $($Result.Declarations.Count) declarations; $($Result.Counts.MirrorObligations) mirror obligations checked; $($Result.Counts.Unresolvable) references unresolvable (cross-repository, not checked)." }
function Get-SpecSetGitInfo {
    $root = Split-Path -Parent $PSScriptRoot
    $sha = (& git -C $root rev-parse HEAD 2>$null); if ($LASTEXITCODE -ne 0) { return [pscustomobject]@{ Commit = $null; WorkingTree = 'NotAGitRepository' } }
    & git -C $root diff --quiet; $clean = ($LASTEXITCODE -eq 0); & git -C $root diff --cached --quiet; $clean = $clean -and ($LASTEXITCODE -eq 0)
    [pscustomobject]@{ Commit = $sha; WorkingTree = if ($clean) { 'Clean' } else { 'Dirty' } }
}

if (-not $CorpusPath) { $CorpusPath = Join-Path (Split-Path -Parent $PSScriptRoot) 'docs/docs/games' }
$index = Read-SpecSetIndex -CorpusPath $CorpusPath
$git = Get-SpecSetGitInfo
$emptyBuckets = [pscustomobject]@{ Held = 0; Failed = 0; Unchecked = 0; Unresolvable = 0; Total = 0 }
$check = if ($index.State -eq 'Indexed') { Invoke-SpecSetCheck -Index $index } else { [pscustomobject]@{ Findings = @(); Unchecked = @(); Unresolvable = @(); Buckets = [pscustomobject]@{ MirrorObligations = $emptyBuckets; ProvisionalEntries = $emptyBuckets; Concepts = $emptyBuckets; References = $emptyBuckets }; Counts = [pscustomobject]@{ Unresolvable = 0 } } }
$state = if ($index.State -ne 'Indexed' -or $check.Unchecked.Count -gt 0) { 'NotEvaluated' } elseif ($check.Findings.Count -gt 0) { 'Invalid' } else { 'Valid' }
$reason = if ($index.State -ne 'Indexed') { $index.Reason } elseif ($check.Unchecked.Count -gt 0) { $check.Unchecked[0].Reason } else { $null }
$detail = if ($index.State -ne 'Indexed') { $index.Detail } elseif ($check.Unchecked.Count -gt 0) { $check.Unchecked[0].Detail } else { '' }
$result = [pscustomobject]@{ State = $state; Reason = $reason; Detail = $detail; Line = $index.Line; Documents = $index.Documents; Declarations = $index.Declarations; Findings = $check.Findings; Unchecked = $check.Unchecked; Unresolvable = $check.Unresolvable; Buckets = $check.Buckets; Counts = [pscustomobject]@{ Documents = $index.Documents.Count; Declarations = $index.Declarations.Count; Unchecked = $check.Unchecked.Count; MirrorObligations = $index.MirrorObligations.Count; References = $index.References.Count; Unresolvable = $check.Counts.Unresolvable }; Commit = $git.Commit; WorkingTree = $git.WorkingTree }
if (-not $Quiet) { Write-SpecSetReport -Result $result }
$result
if ($MyInvocation.InvocationName -ne '.') { exit (Get-SpecSetExitCode -State $result.State) }
