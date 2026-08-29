# unit/command/track
Kind: command
Status: active
Anchor: .claude/commands/track.md
Consumes: contract/test-designdrift, contract/update-workmirror
Exposes:
Binds: I28
Live: decision/2026-08-29-the-work-mirror-projection-is-regenerated-by-hand-the-coupling-that-breaks-it-is-filed-upstream
Archival:
Questions:
Work:
Evidence:

## Owns
Syncs `design/` into GitHub issues, milestones, and `WorkRef` mirrors — idempotent, safe to
re-run, and the sole writer of a `WorkRef` (I28).
