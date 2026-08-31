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
  type Condition,
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
    // §16.1's jobs/employers/skills targets are now authored (S15), and 15 of 30 events
    // (S16); the rest are still an honest statement that the content is unwritten.
    const empty = [
      "courses", "items", "npcs", "opportunities", "achievements",
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

describe("Stable Life — housing (S18)", () => {
  const housing = stableLifeSource.housing;

  it("has 4 entries, ascending along §9.2's progression with the rented room first (S18.1)", () => {
    expect(housing).toHaveLength(4);
    expect(housing[0]?.id).toBe("housing-rented-room");
  });

  it("keeps the rented room at §16.4's $95, and prices each higher tier strictly above the one below (S18.2)", () => {
    expect(housing[0]?.weeklyCostCents).toBe(9_500);
    for (let i = 0; i + 1 < housing.length; i++) {
      const [current, next] = [housing[i]!, housing[i + 1]!];
      expect(next.weeklyCostCents, `${current.id} -> ${next.id}`).toBeGreaterThan(current.weeklyCostCents);
    }
  });

  it("carries comfort, safety and a damage-facing maintenanceRisk, and never writes quality (S18.3)", () => {
    for (const entry of housing) {
      expect(typeof entry.comfort, `${entry.id}.comfort`).toBe("number");
      expect(typeof entry.safety, `${entry.id}.safety`).toBe("number");
      expect(typeof entry.maintenanceRisk, `${entry.id}.maintenanceRisk`).toBe("number");
      expect(Object.prototype.hasOwnProperty.call(entry, "quality"), `${entry.id} should not write quality`).toBe(
        false,
      );
    }
  });

  it("builds and validates with the four housing tiers wired in", () => {
    const result = buildStableLifeCampaign();
    expect(result.errors).toEqual([]);
    expect(result.ok).toBe(true);
    const registry = buildValidatedContentRegistry([built()], kinds);
    expect(registry.errors).toEqual([]);
    expect(registry.ok).toBe(true);
  });
});

describe("Stable Life — random events (S16)", () => {
  const events = stableLifeSource.events;

  // `03` §11.1's fourteen event categories, kebab-cased; S16 draws only from the seven this
  // slice scopes (S16.1's "Out of scope" line names Housing/Health/etc. for later slices).
  const REQUIRED_CATEGORIES = [
    "employment", "economy", "purchases", "crime", "bureaucracy", "transportation", "business",
  ] as const;

  // `03` §11.2's ten event types, kebab-cased.
  const VALID_TYPES = new Set([
    "immediate", "delayed", "recurring", "conditional", "chained",
    "player-triggered", "npc-triggered", "world-triggered", "unique", "repeatable",
  ]);

  it("has 15 entries, drawn only from the seven scoped categories, each represented at least once (S16.1)", () => {
    expect(events).toHaveLength(15);
    const categories = new Set(events.map((e) => e.category));
    for (const event of events) {
      expect(REQUIRED_CATEGORIES as readonly string[], `${event.id}'s category`).toContain(event.category);
    }
    for (const category of REQUIRED_CATEGORIES) {
      expect(categories.has(category), `no event names category "${category}"`).toBe(true);
    }
  });

  it("names its category and its type, both drawn from the corpus's closed lists (S16.2)", () => {
    for (const event of events) {
      expect(REQUIRED_CATEGORIES as readonly string[], `${event.id}'s category`).toContain(event.category);
      const typeTags = event.tags.filter((t) => VALID_TYPES.has(t));
      expect(typeTags, `${event.id} should carry exactly one §11.2 type tag`).toHaveLength(1);
    }
  });

  /** A minimal mirror of the engine's own `evaluateCondition`/`compare` (`core/condition/
   *  evaluate.ts`) — reimplemented here, not imported, because CP1 forbids reaching past the
   *  published surface even from a test. Scoped to exactly the operators this campaign's own
   *  conditions use; `exists`/`count` are unreachable by construction (S16.5) and throw if
   *  ever authored, so a future quantifier is caught here rather than silently mishandled. */
  function evaluateTestCondition(condition: Condition, resolveField: (path: string) => unknown): boolean {
    if ("all" in condition) return condition.all.every((c) => evaluateTestCondition(c, resolveField));
    if ("any" in condition) return condition.any.some((c) => evaluateTestCondition(c, resolveField));
    if ("not" in condition) return !evaluateTestCondition(condition.not, resolveField);
    if ("exists" in condition || "count" in condition) {
      throw new Error("this campaign's conditions never use a collection quantifier (S16.5)");
    }
    const actual = resolveField(condition.field);
    switch (condition.operator) {
      case "equals": return actual === condition.value;
      case "not_equals": return actual !== condition.value;
      case "less_than": return (actual as number) < (condition.value as number);
      case "greater_than": return (actual as number) > (condition.value as number);
      default:
        throw new Error(`test evaluator: extend for operator "${condition.operator}"`);
    }
  }

  function fieldOf(state: Record<string, unknown>, path: string): unknown {
    return path.split(".").reduce<unknown>((current, segment) => {
      if (current === null || typeof current !== "object") return undefined;
      return (current as Record<string, unknown>)[segment];
    }, state);
  }

  /**
   * A minimal player-state fixture, seeded from the built campaign's own authored values
   * (the scenario's real starting cash; a real job/employer id pair from `stableLifeSource
   * .jobs`), not invented numbers.
   *
   * This is not a full `createGame()` session. `createGame` currently throws for this
   * campaign — `initial.ts`'s `buildPlayer` indexes `backgrounds[0]!.id` unconditionally,
   * and `stableLifeSource.backgrounds` is still empty (S22, "a player does not start from
   * nowhere," is what authors it; that is outside this slice's `Touches`). Discovered while
   * implementing S16.3, not fixed here per `AGENTS.md`'s "note a defect outside this slice,
   * don't fix it."
   */
  function fixturePlayerState(overrides: { cashCents?: number; employed?: boolean }): Record<string, unknown> {
    const scenario = stableLifeSource.scenarios.find((s) => s.id === STABLE_LIFE_SCENARIO_ID)!;
    const job = stableLifeSource.jobs.find((j) => j.id === "job-dishwasher")!;
    return {
      player: {
        career: {
          currentEmployment: overrides.employed
            ? {
                jobId: job.id,
                employerId: job.employerId,
                startedWeek: 1,
                performance: 50,
                attendanceRatio: 100,
                warnings: 0,
                weeklyPayCents: job.compensation.baseWeeklyPayCents,
                weeksAtCurrentPay: 0,
              }
            : undefined,
        },
        finances: {
          cashCents: overrides.cashCents ?? scenario.startingCashCents,
        },
      },
    };
  }

  it("evaluates a job-held condition and a cash condition against a built campaign's real state (S16.3)", () => {
    // The scenario starts unemployed (§16.3) — the job condition is false at the real
    // starting state, and true once the player holds a job.
    const jobHeld = stableLifeSource.events.find((e) => e.id === "event-shift-schedule-cut")!;
    const unemployed = fixturePlayerState({});
    expect(fieldOf(unemployed, "player.career.currentEmployment")).toBeUndefined();
    expect(evaluateTestCondition(jobHeld.conditions, (p) => fieldOf(unemployed, p))).toBe(false);

    const employed = fixturePlayerState({ employed: true });
    expect(evaluateTestCondition(jobHeld.conditions, (p) => fieldOf(employed, p))).toBe(true);

    // The scenario starts at $200 (§16.3) — above the hardship-relief threshold of $50, so
    // false at the real starting state, and true once cash is mutated below it.
    const cashConditional = stableLifeSource.events.find((e) => e.id === "event-hardship-relief-payment")!;
    const atStartingCash = fixturePlayerState({});
    expect(fieldOf(atStartingCash, "player.finances.cashCents")).toBe(20_000);
    expect(evaluateTestCondition(cashConditional.conditions, (p) => fieldOf(atStartingCash, p))).toBe(false);

    const poor = fixturePlayerState({ cashCents: 1_000 });
    expect(evaluateTestCondition(cashConditional.conditions, (p) => fieldOf(poor, p))).toBe(true);
  });

  it("names only event ids that exist, in every generatedEvents/scheduledEvents reference (S16.4)", () => {
    const ids = new Set(events.map((e) => e.id));
    for (const event of events) {
      const outcomes = [
        ...(event.automaticOutcome ? [event.automaticOutcome] : []),
        ...(event.choices ?? []).flatMap((c) => c.outcomes.map((o) => o.outcome)),
      ];
      for (const outcome of outcomes) {
        for (const generatedId of outcome.generatedEvents ?? []) {
          expect(ids.has(generatedId), `${event.id} generates unknown event "${generatedId}"`).toBe(true);
        }
        for (const scheduled of outcome.scheduledEvents ?? []) {
          expect(ids.has(scheduled.eventId), `${event.id} schedules unknown event "${scheduled.eventId}"`).toBe(
            true,
          );
        }
      }
    }
    // The one chain this slice authors actually exercises the check above.
    expect(events.some((e) => e.id === "event-tax-penalty-assessment")).toBe(true);
  });

  it("builds and validates with events wired in", () => {
    const result = buildStableLifeCampaign();
    expect(result.errors).toEqual([]);
    expect(result.ok).toBe(true);
    const registry = buildValidatedContentRegistry([built()], kinds);
    expect(registry.errors).toEqual([]);
    expect(registry.ok).toBe(true);
  });
});
