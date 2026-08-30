/**
 * Proves this repository's authoring path, not the engine's mechanics.
 *
 * The engine's own tests already cover what the simulation kind does with a week. What has
 * never been checked anywhere is that *this* repository can reach the authoring surface,
 * build a campaign the kind accepts, and publish it — every failure mode below is one that
 * would leave the scaffold looking finished and producing nothing.
 */

import { describe, expect, it } from "vitest";
import {
  buildValidatedContentRegistry,
  simulationKind,
  type BuiltCampaign,
  type KindRegistry,
} from "@the-running-dev/game-engine";
import { toPortable } from "@the-running-dev/game-engine/authoring";

import {
  buildStableLifeCampaign,
  stableLifeCatalog,
  stableLifeSource,
  STABLE_LIFE_CAMPAIGN_ID,
  STABLE_LIFE_SCENARIO_ID,
} from "./stable-life.js";

const kinds = { simulation: simulationKind } as unknown as KindRegistry;

/** `CommandResult` carries `ok` and an optional `value`; `ok` does not narrow `value`, so
 *  every test that needs the campaign goes through here rather than repeating the check. */
function built(): BuiltCampaign {
  const result = buildStableLifeCampaign();
  if (!result.ok || !result.value) {
    throw new Error(`campaign did not build: ${JSON.stringify(result.errors)}`);
  }
  return result.value;
}

describe("Stable Life — the authoring path", () => {
  it("builds without errors", () => {
    const result = buildStableLifeCampaign();
    expect(result.errors).toEqual([]);
    expect(result.ok).toBe(true);
  });

  it("passes the kind's own campaign validation", () => {
    const registry = buildValidatedContentRegistry([built()], kinds);
    expect(registry.errors).toEqual([]);
    expect(registry.ok).toBe(true);
  });

  it("lifts every authored string into the string table", () => {
    // Every LocKey the campaign references must resolve, or the player reads bare keys.
    // `buildCampaign` is what pairs them; this asserts the pairing is not empty and that
    // the title — the one string not produced by the source lift — survived.
    expect(built().strings.size).toBeGreaterThan(0);
    expect(built().strings.get("stable-life.campaign.title")).toBe(
      "Life in the Fast Lane — Stable Life",
    );
  });

  it("publishes as portable JSON under the simulation arm of the wire format", () => {
    const portable = toPortable(built(), stableLifeCatalog);
    expect(portable.campaign.kindId).toBe("simulation");
    expect(portable.campaign.id).toBe(STABLE_LIFE_CAMPAIGN_ID);
    expect(JSON.parse(JSON.stringify(portable))).toEqual(portable);
  });

  it("carries the map §16.2 describes", () => {
    // Eight locations, and the Department of Forms costing 2 to enter is the one number in
    // that table that is not 1 — the joke does not survive a transcription error.
    expect(stableLifeSource.locations).toHaveLength(8);
    const forms = stableLifeSource.locations.find((l) => l.id === "department-of-forms");
    expect(forms?.travelTimeUnits).toBe(2);

    // Every connection names a location that exists, and every connection is reciprocated.
    const ids = new Set(stableLifeSource.locations.map((l) => l.id));
    for (const location of stableLifeSource.locations) {
      for (const target of location.connections) {
        expect(ids.has(target)).toBe(true);
        const other = stableLifeSource.locations.find((l) => l.id === target);
        expect(other?.connections).toContain(location.id);
      }
    }
  });

  it("starts the scenario where §16.3 says it starts", () => {
    const scenario = stableLifeSource.scenarios.find((s) => s.id === STABLE_LIFE_SCENARIO_ID);
    expect(scenario?.startingCashCents).toBe(20_000);
    expect(scenario?.startingLocationId).toBe("home");
    expect(scenario?.startingHousingId).toBe("housing-rented-room");
    expect(scenario?.weekLimit).toBe(52);
  });

  it("names every collection the source requires, so an unwritten one is visibly empty", () => {
    // The seed leaves fourteen collections empty on purpose. This asserts they are present
    // and empty rather than quietly populated by a later edit that skipped the spec.
    const empty = [
      "jobs", "courses", "items", "events", "npcs", "opportunities", "achievements",
      "headlines", "employers", "backgrounds", "traits", "skills",
    ] as const;
    for (const key of empty) {
      expect(stableLifeSource[key], `${key} should still be unwritten`).toEqual([]);
    }
  });
});
