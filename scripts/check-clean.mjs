/**
 * Fails when the committed `content/` export does not match what the sources produce.
 *
 * Run immediately after `export:content`. If the export changed a tracked file, the
 * committed JSON was stale — someone edited a campaign source and did not re-export. That
 * is the one failure mode a published-content repository cannot detect by reading itself,
 * because both the source and the output look internally consistent.
 *
 * Scoped to `content/` on purpose: an unrelated dirty working tree is the author's own
 * business and is not this gate's to fail on (CP11).
 *
 * Reports the contract's own reasons (`design/20-contract.md` § *Content path errors*):
 * `ExportStale` when the export differs from what is committed, `GitUnavailable` when git
 * cannot be invoked or this is not a checkout. Never exits 0 for a comparison it could not
 * make (CP13).
 */

import { execFileSync } from "node:child_process";

let status;
try {
  status = execFileSync("git", ["status", "--porcelain", "--", "content"], {
    encoding: "utf8",
  });
} catch (error) {
  console.error("GitUnavailable: git is absent, or this working directory is not a checkout.");
  console.error(error.message);
  process.exit(1);
}

if (status.trim() !== "") {
  const differing = status
    .split("\n")
    .filter((line) => line.trim() !== "")
    .map((line) => line.replace(/^..\s+/, "  "));

  console.error("ExportStale: content/ is out of date with src/campaigns/. Re-run `npm run export:content` and commit the result.\n");
  console.error(differing.join("\n"));
  process.exit(1);
}

console.log("content/ matches the sources.");
