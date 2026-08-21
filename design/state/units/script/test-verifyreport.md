# unit/script/test-verifyreport
Kind: script
Status: active
Anchor: tools/Test-VerifyReport.ps1
Consumes:
Exposes:
Binds:
Live:
Archival:
Questions:
Work:
Evidence: tools/Test-VerifyReport.Tests.ps1

## Owns
Validates the structured `.claude/verify-report.json` artifact before its contents are trusted
as a pull request's verification report.
