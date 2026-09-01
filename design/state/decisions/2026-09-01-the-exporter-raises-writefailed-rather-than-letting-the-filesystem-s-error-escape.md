# decision/2026-09-01-the-exporter-raises-writefailed-rather-than-letting-the-filesystem-s-error-escape
Date: 2026-09-01
Anchor: 2026-09-01 — The exporter raises `WriteFailed` rather than letting the filesystem's error escape
Status: accepted

## Claim
Every row of `design/20-contract.md` § *Content path errors*' exporter table either has a
producer or says in the contract itself where its failure originates. `WriteFailed` had
neither, so the one variant that does not carry CP4's byte-identical guarantee — and the only
partial-failure window `design/10-design.md` names in either system — was a reason no caller
could branch on. `scripts/export-content.ts` now wraps the write phase and rethrows as
`ExportError("WriteFailed", …)` with the filesystem's own error as `cause`, because the path
and the errno are the diagnosis and summarising them away is the loss the author then has to
reconstruct. Annotating the row as filesystem-originated was rejected: its `Caller does` cell
prescribes an action, and a prescribed action needs a reason to key on.
