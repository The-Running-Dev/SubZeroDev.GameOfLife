# decision/2026-09-02-cp2-binds-the-invoked-export-and-the-exporter-s-arguments-are-the-error-table-s-test-seam
Date: 2026-09-02
Anchor: 2026-09-02 — CP2 binds the invoked export, and the exporter's arguments are the error table's test seam
Status: accepted

## Claim
CP2 and the `--out-dir`/`--only` rule bind the invoked export — the script's command line and
`main()`, which supply the module's `entries` and `outputDir` and are the only production caller.
`exportContent`'s catalog and output-directory arguments are the seam the exporter's error table
needs: `CampaignDidNotBuild` and `ValidationRejected` require a catalog that fails, and
`WriteFailed` a filesystem that rejects a real write, which `90-decisions.md` (2026-09-01,
`WriteFailed`) chose over a stub and which cannot be aimed at the published directory without
publishing from it. The scope carries the obligation the 2026-08-31 production-source scope on CP2
and CP3 carries: a test leaving `content/` different from the committed export has failed whatever
else it asserted. `src/published-surface.test.ts` resolves writes to the binding spelled
`outputDir`, which inside `exportContent` is the argument, and now says so rather than reading as a
target resolution it does not perform.
