# decision/2026-09-02-s23-4-s-open-guard-is-bounded-on-the-section-separator
Date: 2026-09-02
Anchor: 2026-09-02 — S23.4's `## Open` guard is bounded on the section separator
Status: accepted

## Claim
S23.4's assertion that `design/90-decisions.md`'s S16.5 item is still in `## Open` slices that
section to the `---` closing it, never to a following `## ` heading. `## Open` is the last such
heading in the file, so that bound returned -1 and the assertion searched the whole log, passing
with the item anywhere in it — the one transition it exists to catch is the item moving down among
the dated entries, which is what `AGENTS.md`'s staging-area rule makes the checkable fact. A guard
over a document section is bounded on a delimiter that exists, and is proven by moving the subject
out and watching it fail.
