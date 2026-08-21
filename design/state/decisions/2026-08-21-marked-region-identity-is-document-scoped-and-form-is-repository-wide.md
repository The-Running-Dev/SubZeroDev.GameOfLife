# decision/2026-08-21-marked-region-identity-is-document-scoped-and-form-is-repository-wide
Date: 2026-08-21
Anchor: 2026-08-21 — Marked-region identity is document-scoped and form is repository-wide
Status: accepted

## Claim
A region is identified by `(document, id)` and occurs at most once in that document. The
same id may recur in other documents in the same form. An id may not be projected anywhere and
declared anywhere else; form is consistent repository-wide. `provisional-register` remains a
separate, explicit corpus-wide singleton. This supersedes the corpus-wide namespace clause in
the 2026-08-20 marker-vocabulary decision; the rest of that decision stands.
