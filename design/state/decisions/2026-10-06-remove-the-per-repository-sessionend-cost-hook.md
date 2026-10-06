# decision/2026-10-06-remove-the-per-repository-sessionend-cost-hook
Date: 2026-10-06
Anchor: 2026-10-06 — Remove the per-repository SessionEnd cost hook
Status: accepted

## Claim
`.claude/settings.json` no longer carries a `hooks.SessionEnd` entry. The one it had ran
`tools/Measure-Session.ps1`, which this repository no longer has, so it failed at the end of every
session; the kit's setup installs one global `SessionEnd` hook that logs every project. Nothing else
in `settings.json` changes.
