/**
 * Enforces CP11, CP12 and CP13 (`design/20-contract.md`): the clean check compares only
 * `content/`, the typecheck runs before the export in every composed invocation and in CI,
 * and no content-path step exits 0 for a comparison it could not make.
 *
 * The clean check is run as the real subprocess `scripts/check-clean.mjs` gates on — a
 * black-box test proves what a reviewer trusting the gate actually gets, not what an
 * internal function happens to return.
 */

import { execFileSync } from "node:child_process";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import * as os from "node:os";
import * as path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const here = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(here, "..");
const checkCleanScript = path.join(projectRoot, "scripts", "check-clean.mjs");

function gitStatusOfContent(): string {
  return execFileSync("git", ["status", "--porcelain", "--", "content"], {
    cwd: projectRoot,
    encoding: "utf8",
  }).trim();
}

interface RunResult {
  readonly status: number;
  readonly output: string;
}

function runCheckClean(cwd: string): RunResult {
  try {
    const output = execFileSync("node", [checkCleanScript], { cwd, encoding: "utf8" });
    return { status: 0, output };
  } catch (error) {
    const e = error as { status: number | null; stdout: string; stderr: string };
    return { status: e.status ?? 1, output: `${e.stdout}${e.stderr}` };
  }
}

describe("the clean check is scoped to content/ (CP11)", () => {
  it("exits 0 for a change outside content/", async () => {
    const scratch = path.join(projectRoot, "check-clean-scratch.tmp");
    await writeFile(scratch, "outside content/\n", "utf8");
    try {
      const result = runCheckClean(projectRoot);
      expect(result.status).toBe(0);
    } finally {
      await rm(scratch);
    }
  });

  it("exits non-zero and reports ExportStale, naming the differing file, for a change under content/", async () => {
    expect(gitStatusOfContent()).toBe("");

    const manifestPath = path.join(projectRoot, "content", "manifest.json");
    const original = await readFile(manifestPath, "utf8");
    await writeFile(manifestPath, `${original}\n`, "utf8");
    try {
      const result = runCheckClean(projectRoot);
      expect(result.status).not.toBe(0);
      expect(result.output).toContain("ExportStale");
      expect(result.output).toContain("content/manifest.json");
    } finally {
      await writeFile(manifestPath, original, "utf8");
      expect(gitStatusOfContent()).toBe("");
    }
  });
});

describe("no content-path step exits 0 for a comparison it could not make (CP13)", () => {
  it("reports GitUnavailable and exits non-zero when the working directory is not a checkout", async () => {
    const notACheckout = await mkdtemp(path.join(os.tmpdir(), "check-clean-not-a-checkout-"));
    try {
      const result = runCheckClean(notACheckout);
      expect(result.status).not.toBe(0);
      expect(result.output).toContain("GitUnavailable");
    } finally {
      await rm(notACheckout, { recursive: true });
    }
  });
});

describe("the export runs before the clean check, and the typecheck before both (CP12)", () => {
  it("orders typecheck, export:content and check:clean in package.json's composed check script", async () => {
    const pkg = JSON.parse(await readFile(path.join(projectRoot, "package.json"), "utf8")) as {
      scripts: Record<string, string>;
    };
    const check = pkg.scripts.check ?? "";
    const typecheckAt = check.indexOf("typecheck");
    const exportAt = check.indexOf("export:content");
    const checkCleanAt = check.indexOf("check:clean");

    expect(typecheckAt).toBeGreaterThanOrEqual(0);
    expect(exportAt).toBeGreaterThan(typecheckAt);
    expect(checkCleanAt).toBeGreaterThan(exportAt);
  });

  it("orders the content job's typecheck step before the re-export step, sets submodules: recursive, and sets continue-on-error nowhere", async () => {
    const workflow = await readFile(
      path.join(projectRoot, ".github", "workflows", "verify.yml"),
      "utf8",
    );

    const contentJobAt = workflow.indexOf("\n  content:\n");
    expect(contentJobAt).toBeGreaterThanOrEqual(0);
    const contentJob = workflow.slice(contentJobAt);

    const typecheckStepAt = contentJob.indexOf("Typecheck the campaign sources");
    const reExportStepAt = contentJob.indexOf(
      "Re-export content and fail if the committed JSON is stale",
    );
    expect(typecheckStepAt).toBeGreaterThanOrEqual(0);
    expect(reExportStepAt).toBeGreaterThan(typecheckStepAt);

    expect(contentJob).toContain("submodules: recursive");
    expect(contentJob).not.toContain("continue-on-error");
  });
});
