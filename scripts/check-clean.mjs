/**
 * Fails when the committed `content/` export does not match what the sources produce.
 *
 * Run immediately after `export:content`. If the export changed a tracked file, the
 * committed JSON was stale — someone edited a campaign source and did not re-export. That
 * is the one failure mode a published-content repository cannot detect by reading itself,
 * because both the source and the output look internally consistent.
 *
 * Scoped to `content/` on purpose: an unrelated dirty working tree is the author's own
 * business and is not this gate's to fail on.
 */

import { execFileSync } from "node:child_process";

const status = execFileSync("git", ["status", "--porcelain", "--", "content"], {
  encoding: "utf8",
});

if (status.trim() !== "") {
  console.error("content/ is out of date with src/campaigns/. Re-run `npm run export:content` and commit the result.\n");
  console.error(status);
  process.exit(1);
}

console.log("content/ matches the sources.");
