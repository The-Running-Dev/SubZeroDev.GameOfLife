#Requires -Version 7.0

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

class SpecDocument {
    [string] $Path
    [Nullable[int]] $Ordinal
    [string] $Title
}

class SpecDeclaration {
    [string] $QualifiedName
    [string] $Owner
    [string] $Form
    [bool] $IsClosed
    [string] $DocumentPath
    [int] $Line
    [string[]] $Members = @()
}

class SpecReference {
    [string] $SourcePath
    [int] $Line
    [string] $Kind
    [string] $RawTarget
    [string] $Resolution
    [string] $PinnedSha
}

class SpecFinding {
    [string] $CheckId
    [string] $Subject
    [string] $DocumentPath
    [int] $Line
    [string] $Detail
}

class MirrorObligation {
    [string] $QualifiedName
    [string] $DocumentPath
    [int] $Line
    [string[]] $BodyMembers = @()
}

function New-SpecSetIndexFailure {
    param([string] $Reason, [string] $Path, [int] $Line = 0)
    [pscustomobject]@{
        State = 'NotEvaluated'; Reason = $Reason; Detail = $Path; Line = $Line
        Documents = @(); Declarations = @(); References = @()
        MirrorObligations = @(); ProvisionalEntries = @(); ProvisionalSites = @(); Lifecycles = @()
    }
}

function Get-SpecDocumentOrdinal {
    param([string] $Name)
    $m = [regex]::Match($Name, '^(\d+)-')
    if ($m.Success) { return [int]$m.Groups[1].Value }
    return $null
}

function Get-SpecSetRepositoryRoot {
    param([Parameter(Mandatory)][string] $CorpusRoot)

    $candidate = $CorpusRoot
    for ($i = 0; $i -lt 3; $i++) {
        $parent = Split-Path -Parent $candidate
        if ([string]::IsNullOrWhiteSpace($parent) -or $parent -eq $candidate) {
            return $CorpusRoot
        }
        $candidate = $parent
    }
    $candidate
}

function Get-FenceDeclarations {
    param([string[]] $Lines, [string] $DocumentPath, [int] $StartLine)

    $rows = [System.Collections.Generic.List[object]]::new()
    $i = 0
    while ($i -lt $Lines.Count) {
        $line = $Lines[$i]
        $lineNumber = $StartLine + $i
        if ([string]::IsNullOrWhiteSpace($line) -or $line.TrimStart().StartsWith('//') -or $line.TrimStart().StartsWith('/*') -or $line.TrimStart().StartsWith('*')) { $i++; continue }

        $interface = [regex]::Match($line, '^\s*interface\s+([A-Za-z_]\w*)(?:<[^>]+>)?(?:\s+extends\s+[^{]+)?\s*\{\s*$')
        $emptyInterface = [regex]::Match($line, '^\s*interface\s+([A-Za-z_]\w*)(?:<[^>]+>)?(?:\s+extends\s+[^{]+)?\s*\{\s*}\s*$')
        if ($emptyInterface.Success) {
            $d = [SpecDeclaration]::new(); $d.QualifiedName = $emptyInterface.Groups[1].Value; $d.Owner = ''; $d.Form = 'Interface'; $d.IsClosed = $true; $d.DocumentPath = $DocumentPath; $d.Line = $lineNumber; $rows.Add($d); $i++; continue
        }
        if ($interface.Success) {
            $d = [SpecDeclaration]::new(); $d.QualifiedName = $interface.Groups[1].Value; $d.Owner = ''; $d.Form = 'Interface'; $d.IsClosed = $true; $d.DocumentPath = $DocumentPath; $d.Line = $lineNumber
            $i++
            while ($i -lt $Lines.Count -and $Lines[$i].Trim() -ne '}') {
                if ([string]::IsNullOrWhiteSpace($Lines[$i]) -or $Lines[$i].TrimStart().StartsWith('//') -or $Lines[$i].TrimStart().StartsWith('/*') -or $Lines[$i].TrimStart().StartsWith('*')) { $i++; continue }
                if ($Lines[$i] -match '^\s*\|\s*"') { $i++; continue }
                $member = [regex]::Match($Lines[$i], '^\s*(?:readonly\s+)?([A-Za-z_]\w*)(?:<[^>]+>)?\??\s*(?:\([^)]*\)|:)')
                if (-not $member.Success) { return [pscustomobject]@{ Failure = 'UnknownDeclarationForm'; Line = $StartLine + $i } }
                $name = $member.Groups[1].Value
                $d.Members += $name
                $field = [SpecDeclaration]::new(); $field.QualifiedName = "$($d.QualifiedName).$name"; $field.Owner = $d.QualifiedName; $field.Form = 'Field'; $field.IsClosed = $false; $field.DocumentPath = $DocumentPath; $field.Line = $StartLine + $i
                $rows.Add($field)
                $i++
            }
            if ($i -ge $Lines.Count) { return [pscustomobject]@{ Failure = 'UnknownDeclarationForm'; Line = $lineNumber } }
            $rows.Add($d); $i++; continue
        }

        $type = [regex]::Match($line, '^\s*type\s+([A-Za-z_]\w*)(?:<[^>]+>)?\s*=\s*(.*)$')
        if ($type.Success) {
            $d = [SpecDeclaration]::new(); $d.QualifiedName = $type.Groups[1].Value; $d.Owner = ''; $d.Form = 'TypeAlias'; $d.DocumentPath = $DocumentPath; $d.Line = $lineNumber
            $body = $type.Groups[2].Value
            $parts = [System.Collections.Generic.List[string]]::new(); $parts.Add($body)
            while ($i -lt ($Lines.Count - 1) -and -not ($parts[$parts.Count - 1].TrimEnd().EndsWith(';'))) { $i++; $parts.Add($Lines[$i]) }
            $joined = $parts -join "`n"
            $literalNames = @([regex]::Matches($joined, '"([A-Za-z_][A-Za-z0-9_]*)"') | ForEach-Object { $_.Groups[1].Value })
            $d.IsClosed = ($literalNames.Count -gt 0 -and $joined -notmatch '\bRecord\s*<')
            if ($d.IsClosed) { $d.Members = @($literalNames | Select-Object -Unique) }
            $rows.Add($d); $i++; continue
        }

        if ($line -match '^\s*(?:const|function)\s+[A-Za-z_]\w*' -or $line -match '^\s*(?:return|if|else|throw|expect|[}\{]|[A-Za-z_]\w*\()' -or $line -match '^\s*\|\s*\{' -or $line -match '^\s*"[^"]+"' -or $line -match '^\s*[A-Za-z_]\w*\??\s*:' -or $line -match '^\s*\)\s*:' -or $line -match '^\s*\]' -or $line -match '^\s*\};?\s*$') { $i++; continue }
        return [pscustomobject]@{ Failure = 'UnknownDeclarationForm'; Line = $lineNumber }
    }
    [pscustomobject]@{ Declarations = @($rows); Failure = $null; Line = 0 }
}

function Get-SpecSetLineNumber {
    param([string] $Text, [int] $Index)
    1 + ([regex]::Matches($Text.Substring(0, $Index), "`n")).Count
}

function Get-DeclaredRegions {
    param([string] $Text, [string] $DocumentPath)

    $pattern = '<!--\s*(?<sid>[A-Za-z][\w.-]*):declared:start\s*-->|<!--\s*(?<eid>[A-Za-z][\w.-]*):declared:end\s*-->'
    $regions = [System.Collections.Generic.List[object]]::new()
    $seenIds = [System.Collections.Generic.HashSet[string]]::new()
    $openId = $null; $openLine = 0; $openBodyStart = 0

    foreach ($m in [regex]::Matches($Text, $pattern)) {
        $line = Get-SpecSetLineNumber -Text $Text -Index $m.Index
        if ($m.Groups['sid'].Success) {
            if ($openId) { return [pscustomobject]@{ Failure = 'MalformedRegion'; Line = $line } }
            $openId = $m.Groups['sid'].Value; $openLine = $line; $openBodyStart = $m.Index + $m.Length
            continue
        }
        $eid = $m.Groups['eid'].Value
        if (-not $openId -or $eid -ne $openId) { return [pscustomobject]@{ Failure = 'MalformedRegion'; Line = $line } }
        if (-not $seenIds.Add($openId)) { return [pscustomobject]@{ Failure = 'DuplicateRegionId'; Line = $openLine } }
        $body = $Text.Substring($openBodyStart, $m.Index - $openBodyStart).Trim()
        $regions.Add([pscustomobject]@{ Id = $openId; Line = $openLine; Body = $body; DocumentPath = $DocumentPath })
        $openId = $null
    }
    if ($openId) { return [pscustomobject]@{ Failure = 'MalformedRegion'; Line = $openLine } }
    [pscustomobject]@{ Regions = @($regions); Failure = $null }
}

function Get-MirrorObligationFromRegion {
    param([Parameter(Mandatory)][object] $Region)

    if ($Region.Id -notlike 'mirror-*') { return $null }
    $afterColon = if ($Region.Body -match ':') { $Region.Body.Substring($Region.Body.IndexOf(':') + 1) } else { $Region.Body }
    $members = @([regex]::Matches($afterColon, '[A-Za-z_][A-Za-z0-9_]*') | ForEach-Object { $_.Value } | Select-Object -Unique)
    $obligation = [MirrorObligation]::new()
    $obligation.QualifiedName = $Region.Id.Substring('mirror-'.Length)
    $obligation.DocumentPath = $Region.DocumentPath
    $obligation.Line = $Region.Line
    $obligation.BodyMembers = $members
    $obligation
}

function Read-SpecSetIndex {
    [CmdletBinding()]
    param([Parameter(Mandatory)][string] $CorpusPath)

    if (-not (Test-Path -LiteralPath $CorpusPath -PathType Container)) { return New-SpecSetIndexFailure -Reason 'CorpusNotFound' -Path $CorpusPath }
    $root = (Resolve-Path -LiteralPath $CorpusPath).Path
    $repoRoot = Get-SpecSetRepositoryRoot -CorpusRoot $root
    $documents = [System.Collections.Generic.List[object]]::new(); $declarations = [System.Collections.Generic.List[object]]::new()
    $mirrorObligations = [System.Collections.Generic.List[object]]::new()
    foreach ($file in @(Get-ChildItem -LiteralPath $root -File -Filter '*.md' | Sort-Object Name)) {
        try { $text = [System.IO.File]::ReadAllText($file.FullName, [System.Text.UTF8Encoding]::new($false)) } catch { return New-SpecSetIndexFailure -Reason 'UnreadableDocument' -Path $file.FullName }
        $relative = [System.IO.Path]::GetRelativePath($repoRoot, $file.FullName).Replace('\', '/')
        $doc = [SpecDocument]::new(); $doc.Path = $relative; $doc.Ordinal = Get-SpecDocumentOrdinal -Name $file.Name
        $h1 = [regex]::Match($text, '(?m)^#\s+(.+?)\s*$'); $doc.Title = if ($h1.Success) { $h1.Groups[1].Value } else { '' }; $documents.Add($doc)
        $regionResult = Get-DeclaredRegions -Text $text -DocumentPath $relative
        if ($regionResult.Failure) { return New-SpecSetIndexFailure -Reason $regionResult.Failure -Path $relative -Line $regionResult.Line }
        foreach ($region in $regionResult.Regions) {
            $obligation = Get-MirrorObligationFromRegion -Region $region
            if ($obligation) { $mirrorObligations.Add($obligation) }
        }
        $lines = $text -replace "`r`n", "`n" -split "`n"; $inFence = $false; $fence = @(); $start = 0
        for ($i = 0; $i -lt $lines.Count; $i++) {
            if (-not $inFence -and $lines[$i] -eq '```typescript') { $inFence = $true; $fence = @(); $start = $i + 2; continue }
            if ($inFence -and $lines[$i] -eq '```') {
                $parsed = Get-FenceDeclarations -Lines $fence -DocumentPath $relative -StartLine $start
                if ($parsed.Failure) { return New-SpecSetIndexFailure -Reason $parsed.Failure -Path $relative -Line $parsed.Line }
                foreach ($d in $parsed.Declarations) { $declarations.Add($d) }; $inFence = $false; continue
            }
            if ($inFence) { $fence += $lines[$i] }
        }
        if ($inFence) { return New-SpecSetIndexFailure -Reason 'UnknownDeclarationForm' -Path $relative -Line $start }
        # A one-line literal union may share a fence with a preceding declaration. Preserve it
        # as its own declaration even when the surrounding example is otherwise structural.
        foreach ($match in [regex]::Matches($text, '(?m)^type\s+([A-Za-z_]\w*)\s*=\s*((?:"[^"]+"\s*(?:\|\s*)?)+);\s*$')) {
            $name = $match.Groups[1].Value
            if (-not @($declarations | Where-Object { $_.QualifiedName -eq $name })) {
                $d = [SpecDeclaration]::new(); $d.QualifiedName = $name; $d.Owner = ''; $d.Form = 'TypeAlias'; $d.IsClosed = $true; $d.DocumentPath = $relative; $d.Line = 1 + ($text.Substring(0, $match.Index) -split "`n").Count
                $d.Members = @([regex]::Matches($match.Groups[2].Value, '"([A-Za-z_][A-Za-z0-9_]*)"') | ForEach-Object { $_.Groups[1].Value })
                $declarations.Add($d)
            }
        }
    }
    # Alias fields are addressable through their alias as well as their structural source. This
    # keeps the index's qualified names aligned with the names consumers use in the prose.
    $playerAlias = @($declarations | Where-Object { $_.QualifiedName -eq 'PlayerState' } | Select-Object -First 1)
    if ($playerAlias.Count -eq 1) {
        foreach ($field in @($declarations | Where-Object { $_.Owner -eq 'ActorState' })) {
            $aliasField = [SpecDeclaration]::new(); $aliasField.QualifiedName = "PlayerState.$($field.QualifiedName.Split('.')[-1])"; $aliasField.Owner = 'PlayerState'; $aliasField.Form = 'Field'; $aliasField.IsClosed = $false; $aliasField.DocumentPath = $field.DocumentPath; $aliasField.Line = $field.Line
            $declarations.Add($aliasField)
        }
    }
    [pscustomobject]@{ State = 'Indexed'; Reason = $null; Detail = ''; Line = 0; Documents = @($documents); Declarations = @($declarations); References = @(); MirrorObligations = @($mirrorObligations); ProvisionalEntries = @(); ProvisionalSites = @(); Lifecycles = @() }
}
