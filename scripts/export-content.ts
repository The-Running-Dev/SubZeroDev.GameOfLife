/**
 * Publishes the canonical portable JSON for Life in the Fast Lane from the TypeScript
 * sources in `src/campaigns/`.
 *
 * The ordered `entries` list below is the publication catalog — a campaign that is not in
 * it is not published, whatever exists in `src/`. Every campaign builds and validates
 * before any file is written, so an authoring failure cannot leave a half-written
 * `content/` behind for the next consumer to fetch.
 *
 * Output is deterministic: `toPortable` sorts the string table, the manifest is written in
 * catalog order, and every file ends with exactly one newline. `scripts/check-clean.mjs`
 * depends on that — it fails the build when a committed export no longer matches what the
 * sources produce.
 */

import { mkdir, readdir, rm, writeFile } from "node:fs/promises";
import * as path from "node:path";
import { fileURLToPath } from "node:url";

import {
  digestManifestResolution,
  digestPortableCampaign,
  toPortable,
  type PortableCatalog,
} from "@the-running-dev/game-engine/authoring";
import {
  buildValidatedContentRegistry,
  simulationKind,
  type BuiltCampaign,
  type CommandResult,
  type KindRegistry,
  type PortableManifest,
  type PortableManifestEntry,
} from "@the-running-dev/game-engine";

import {
  buildStableLifeCampaign,
  stableLifeCatalog,
} from "../src/campaigns/stable-life.js";

interface Entry {
  readonly file: string;
  readonly build: () => CommandResult<BuiltCampaign>;
  readonly catalog: PortableCatalog;
}

/** The publication catalog, in the order a host should present it. */
const entries: readonly Entry[] = [
  {
    file: "stable-life.json",
    build: buildStableLifeCampaign,
    catalog: stableLifeCatalog,
  },
];

const kinds = { simulation: simulationKind } as unknown as KindRegistry;

const here = path.dirname(fileURLToPath(import.meta.url));
const outputDir = path.join(here, "..", "content");

/** Two spaces and a trailing newline — the shape a JSON file has when a human has to read
 *  the diff, which is the only reason these are committed rather than built on demand. */
function serialize(value: unknown): string {
  return `${JSON.stringify(value, null, 2)}\n`;
}

async function main(): Promise<void> {
  // Build and validate everything before writing anything.
  const built = entries.map((entry) => {
    const result = entry.build();
    if (!result.ok || !result.value) {
      throw new Error(
        `${entry.file}: campaign did not build — ${JSON.stringify(result.errors, null, 2)}`,
      );
    }
    return { entry, campaign: result.value };
  });

  const registry = buildValidatedContentRegistry(
    built.map(({ campaign }) => campaign),
    kinds,
  );
  if (!registry.ok) {
    throw new Error(`validation failed — ${JSON.stringify(registry.errors, null, 2)}`);
  }

  const manifestEntries: PortableManifestEntry[] = [];
  const files = new Map<string, string>();

  for (const { entry, campaign } of built) {
    const portable = toPortable(campaign, entry.catalog);
    files.set(entry.file, serialize(portable));
    manifestEntries.push({
      file: entry.file,
      id: portable.campaign.id,
      version: portable.campaign.version,
      digest: digestPortableCampaign(portable),
    });
  }

  const manifest: PortableManifest = {
    formatVersion: 2,
    campaigns: manifestEntries,
    resolution: digestManifestResolution(
      manifestEntries.map(({ id, version }) => ({ id, version })),
    ),
  };
  files.set("manifest.json", serialize(manifest));

  // Remove any previously published file the catalog no longer names, so a renamed or
  // retired campaign cannot linger in `content/` as a stale document a host still fetches.
  await mkdir(outputDir, { recursive: true });
  for (const existing of await readdir(outputDir)) {
    if (existing.endsWith(".json") && !files.has(existing)) {
      await rm(path.join(outputDir, existing));
    }
  }

  for (const [file, body] of files) {
    await writeFile(path.join(outputDir, file), body, "utf8");
  }

  console.log(`Exported ${manifestEntries.length} campaign(s) to content/`);
}

await main();
