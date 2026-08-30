# unit/command/clean
Kind: command
Status: active
Anchor: .claude/commands/clean.md
Consumes:
Exposes:
Binds:
Live:
Archival:
Questions:
Work:
Evidence:

## Owns
Switches back to the default branch, deletes local branches already merged into it (including squash-merged ones, confirmed against `gh` and force-deleted on tip-comparison evidence with no separate ask), and prunes stale remote-tracking refs.
