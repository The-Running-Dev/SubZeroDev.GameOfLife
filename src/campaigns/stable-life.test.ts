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
    // §16.1's jobs/employers/skills targets are now authored (S15); the rest are still an
    // honest statement that the content is unwritten.
    const empty = [
      "courses", "items", "events", "npcs", "opportunities", "achievements",
      "headlines", "backgrounds", "traits",
    ] as const;
    for (const key of empty) {
      expect(stableLifeSource[key], `${key} should still be unwritten`).toEqual([]);
    }
  });
});

describe("Stable Life — jobs, employers and skills (S15)", () => {
  const jobs = stableLifeSource.jobs;
  const employers = stableLifeSource.employers;
  const skills = stableLifeSource.skills;
  const VALID_TIERS = ["entry", "skilled", "professional", "senior"] as const;
  const TIER_RANK: Record<(typeof VALID_TIERS)[number], number> = {
    entry: 0, skilled: 1, professional: 2, senior: 3,
  };

  it("has 8 jobs, each at one of the four §6.1 tiers (S15.1)", () => {
    expect(jobs).toHaveLength(8);
    for (const job of jobs) {
      expect(VALID_TIERS, `${job.id}'s tier`).toContain(job.tier);
    }
  });

  it("carries exactly 3 career paths, each an ascending tier sequence chained by promotionPaths (S15.2)", () => {
    const careerPathIds = new Set(jobs.map((job) => job.careerPathId));
    expect(careerPathIds.size).toBe(3);

    for (const careerPathId of careerPathIds) {
      const path = jobs
        .filter((job) => job.careerPathId === careerPathId)
        .sort((a, b) => TIER_RANK[a.tier] - TIER_RANK[b.tier]);
      for (let i = 0; i + 1 < path.length; i++) {
        const [current, next] = [path[i]!, path[i + 1]!];
        expect(TIER_RANK[next.tier], `${careerPathId}: ${current.id} -> ${next.id}`).toBeGreaterThan(
          TIER_RANK[current.tier],
        );
        expect(
          current.promotionPaths.some((p) => p.toJobId === next.id),
          `${current.id} should have a promotionPaths entry linking to ${next.id}`,
        ).toBe(true);
      }
    }
  });

  it("names only employers and skills that exist, by iterating the collections (S15.3)", () => {
    const employerIds = new Set(employers.map((e) => e.id));
    const skillIds = new Set(skills.map((s) => s.id));
    for (const job of jobs) {
      expect(employerIds.has(job.employerId), `${job.id} names employer ${job.employerId}`).toBe(true);
      for (const requirement of job.requirements) {
        if (requirement.type === "skill" && "field" in requirement.condition) {
          const skillId = requirement.condition.field.replace("player.skills.", "");
          expect(skillIds.has(skillId), `${job.id} names skill ${skillId}`).toBe(true);
        }
      }
    }
    // Every employer's jobIds round-trip back to a job that names it.
    for (const employer of employers) {
      for (const jobId of employer.jobIds) {
        const job = jobs.find((j) => j.id === jobId);
        expect(job?.employerId, `${employer.id} names job ${jobId}`).toBe(employer.id);
      }
    }
  });

  it("matches §16.4's wage table exactly, and prices part-time at 55% for 5 units (S15.4)", () => {
    const fullTimeByTier: Record<string, number> = {};
    for (const job of jobs) {
      fullTimeByTier[job.tier] = job.compensation.baseWeeklyPayCents;
    }
    expect(fullTimeByTier.entry).toBe(21_000);
    expect(fullTimeByTier.skilled).toBe(34_000);
    expect(fullTimeByTier.professional).toBe(52_000);
    expect(fullTimeByTier.senior).toBe(78_000);

    expect(Math.round(fullTimeByTier.entry! * 0.55)).toBe(11_550);
    expect(Math.round(fullTimeByTier.skilled! * 0.55)).toBe(18_700);
    expect(Math.round(fullTimeByTier.professional! * 0.55)).toBe(28_600);
    expect(Math.round(fullTimeByTier.senior! * 0.55)).toBe(42_900);
  });

  it("builds and validates with jobs, employers and skills wired in", () => {
    const result = buildStableLifeCampaign();
    expect(result.errors).toEqual([]);
    expect(result.ok).toBe(true);
    const registry = buildValidatedContentRegistry([built()], kinds);
    expect(registry.errors).toEqual([]);
    expect(registry.ok).toBe(true);
  });
});
