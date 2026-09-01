/**
 * Enforces CP4, CP6 and CP15 (`design/20-contract.md`): a failed build or a rejected
 * validation leaves `content/` byte-identical, the export removes a file the publication
 * catalog no longer names, and the directory it produces holds exactly the catalog's files
 * plus `manifest.json` — nothing else.
 *
 * Also covers the third row of § *Content path errors*' exporter table, `WriteFailed`: the
 * only variant that does not carry CP4's byte-identical guarantee, and the only one whose
 * cause is the filesystem rather than the engine. A taxonomy entry no code path produces is
 * a reason a caller can never branch on, which is why it is asserted here by reason rather
 * than left to be inferred from an errno.
 *
 * This suite runs `exportContent` against the real `content/` directory with the real
 * `entries`, the same directory `scripts/check-clean.mjs` gates. Byte-identical is proven
 * the way `scripts/check-clean.mjs` proves it — by `git status`, never by reading a file
 * under `content/` (CP3) — and re-exporting the real catalog is deterministic (CP5), so
 * every test that reaches the write phase leaves `content/` matching what is committed.
 */

import { mkdtemp, readdir, rm, writeFile } from "node:fs/promises";
import { execFileSync } from "node:child_process";
import * as os from "node:os";
import * as path from "node:path";
import type { BuiltCampaign } from "@the-running-dev/game-engine";
import { describe, expect, it } from "vitest";

import { entries, exportContent, ExportError, outputDir } from "../scripts/export-content.js";

function gitStatusOfContent(): string {
  return execFileSync("git", ["status", "--porcelain", "--", "content"], {
    encoding: "utf8",
  }).trim();
}

describe("the published directory is exactly the catalog, and nothing lingers", () => {
  it("removes a stray file the catalog does not name (CP6), leaving the tree clean and exactly the catalog's files plus manifest.json (CP15)", async () => {
    const orphan = path.join(outputDir, "orphan.json");
    await writeFile(orphan, "{}\n", "utf8");

    await exportContent(entries, outputDir);

    const files = await readdir(outputDir);
    expect(files).not.toContain("orphan.json");
    expect(gitStatusOfContent()).toBe("");

    const expected = new Set([...entries.map((e) => e.file), "manifest.json"]);
    expect(new Set(files)).toEqual(expected);
  });
});

describe("a failure before the write phase (CP4)", () => {
  it("leaves content/ byte-identical when a campaign does not build, and reports CampaignDidNotBuild", async () => {
    // A real, clean export first, so the git-status assertion below proves the failing
    // call changed nothing rather than merely inheriting whatever state came before it.
    await exportContent(entries, outputDir);
    expect(gitStatusOfContent()).toBe("");

    const failingEntry = {
      file: "does-not-build.json",
      build: () => ({
        ok: false,
        errors: [{ code: "test.reason", messageKey: "test.message" }],
        warnings: [],
      }),
      catalog: entries[0]!.catalog,
    };

    const failure = await exportContent([failingEntry], outputDir).catch((e: unknown) => e);

    expect(failure).toBeInstanceOf(ExportError);
    expect((failure as ExportError).reason).toBe("CampaignDidNotBuild");
    expect((failure as ExportError).message).toContain("does-not-build.json");
    expect((failure as ExportError).message).toContain("test.reason");
    expect(gitStatusOfContent()).toBe("");
  });

  it("leaves content/ byte-identical when the built set fails validation, and reports ValidationRejected", async () => {
    await exportContent(entries, outputDir);
    expect(gitStatusOfContent()).toBe("");

    // "world-graph" is a real KindId this engine defines, but this repository's own
    // KindRegistry registers only "simulation" (`export-content.ts`), so the registry's
    // Tier 1 `unknown_kind` check rejects it — the real rejection path, not a stub.
    const unvalidatable = {
      file: "unvalidatable.json",
      build: () => ({
        ok: true,
        value: {
          campaign: {
            id: "not-a-real-campaign",
            kindId: "world-graph",
            version: "0.0.0",
            titleKey: "test.title",
            content: {},
          },
          strings: new Map(),
        } satisfies BuiltCampaign,
        errors: [],
        warnings: [],
      }),
      catalog: entries[0]!.catalog,
    };

    const failure = await exportContent([unvalidatable], outputDir).catch((e: unknown) => e);

    expect(failure).toBeInstanceOf(ExportError);
    expect((failure as ExportError).reason).toBe("ValidationRejected");
    expect(gitStatusOfContent()).toBe("");
  });
});

describe("a failure during the write phase (WriteFailed)", () => {
  it("reports WriteFailed with the filesystem's own error as the cause, and touches content/ not at all", async () => {
    const scratch = await mkdtemp(path.join(os.tmpdir(), "export-write-failed-"));
    try {
      // A regular file where a directory has to be, so mkdir/writeFile is rejected by the
      // filesystem on every host rather than by a stub standing in for one.
      const blocker = path.join(scratch, "not-a-directory");
      await writeFile(blocker, "", "utf8");

      const failure = await exportContent(entries, path.join(blocker, "content")).catch(
        (e: unknown) => e,
      );

      expect(failure).toBeInstanceOf(ExportError);
      expect((failure as ExportError).reason).toBe("WriteFailed");
      expect((failure as ExportError).cause).toBeInstanceOf(Error);
      // The real published directory was never the target, so it cannot have moved.
      expect(gitStatusOfContent()).toBe("");
    } finally {
      await rm(scratch, { recursive: true });
    }
  });
});
