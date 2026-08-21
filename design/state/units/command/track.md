# unit/command/track
Kind: command
Status: active
Anchor: .claude/commands/track.md
Consumes: contract/test-designdrift, contract/update-workmirror
Exposes:
Binds: I28
Live:
Archival:
Questions:
Work:
Evidence:

## Owns
Syncs `design/` into GitHub issues, milestones, and `WorkRef` mirrors — idempotent, safe to
re-run, and the sole writer of a `WorkRef` (I28).
