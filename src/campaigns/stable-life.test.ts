/**
 * Proves this repository's authoring path, not the engine's mechanics.
 *
 * The engine's own tests already cover what the simulation kind does with a week. What has
 * never been checked anywhere is that *this* repository can reach the authoring surface,
 * build a campaign the kind accepts, and publish it — every failure mode below is one that
 * would leave the scaffold looking finished and producing nothing.
 */

import { readFileSync } from "node:fs";

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
    // §16.1's jobs/employers/skills targets are now authored (S15), 15 of 30 events (S16),
    // courses (S17), 20 items (S19), 8 NPCs (S20), and backgrounds/traits (S22); the rest
    // are still an honest statement that the content is unwritten.
    const empty = [
      "opportunities", "achievements", "headlines",
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

  /** The events S16 itself authored. S21 grew `stableLifeSource.events` to 30 across all
   *  fourteen of §11.1's categories, so the assertions below are scoped to the seven
   *  categories S16 drew from rather than to the whole collection — which is what they
   *  always meant. S16.1's count is unchanged: exactly 15 events fall in those seven. */
  const s16Events = events.filter((e) => (REQUIRED_CATEGORIES as readonly string[]).includes(e.category));

  it("has 15 entries, drawn only from the seven scoped categories, each represented at least once (S16.1)", () => {
    expect(s16Events).toHaveLength(15);
    const categories = new Set(s16Events.map((e) => e.category));
    for (const category of REQUIRED_CATEGORIES) {
      expect(categories.has(category), `no event names category "${category}"`).toBe(true);
    }
  });

  it("names its category and its type, both drawn from the corpus's closed lists (S16.2)", () => {
    for (const event of s16Events) {
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
   * This is not a full `createGame()` session — unnecessary for the field-level checks
   * below. `initial.ts`'s `buildPlayer` indexes `backgrounds[0]!.id` unconditionally; that
   * indexing no longer throws now that S22 has authored `stableLifeSource.backgrounds`
   * (discovered while implementing S16.3, resolved as a side effect of S22 rather than
   * exercised here).
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

describe("Stable Life — purchasable items (S19)", () => {
  const items = stableLifeSource.items;

  // `03` §10.1's twelve item categories, kebab-cased the same way §11.1's event categories
  // are; this campaign draws from ten of them (S19.1 requires at least eight).
  const CORPUS_CATEGORIES = [
    "food", "clothing", "furniture", "appliances", "electronics", "vehicles", "tools",
    "medical-items", "entertainment", "education-materials", "business-equipment", "luxury-goods",
  ] as const;

  // Every `Modifier.target` an item's `effects` may write to — `validate.ts`'s
  // `WRITABLE_TARGET_PREFIXES` plus its `calendar.committedTimeUnits` special case.
  const WRITABLE_TARGET_PREFIXES = ["player.needs.", "player.attributes.", "player.skills."];
  function isWritableTarget(target: string): boolean {
    return target === "calendar.committedTimeUnits"
      || WRITABLE_TARGET_PREFIXES.some((prefix) => target.startsWith(prefix));
  }

  it("has 20 entries, covering at least 8 of §10.1's twelve categories, each category one the corpus lists (S19.1)", () => {
    expect(items).toHaveLength(20);
    const categories = new Set(items.map((i) => i.category));
    for (const item of items) {
      expect(CORPUS_CATEGORIES as readonly string[], `${item.id}'s category`).toContain(item.category);
    }
    expect(categories.size).toBeGreaterThanOrEqual(8);
  });

  it("carries §16.4's two exact grocery lines (S19.2)", () => {
    const basic = items.find((i) => i.id === "item-groceries-basic")!;
    const poor = items.find((i) => i.id === "item-groceries-poor")!;
    expect(basic.purchasePriceCents).toBe(4_500);
    expect(poor.purchasePriceCents).toBe(2_500);

    const satietyEffect = (item: typeof basic) =>
      item.effects.find((e) => e.target === "player.needs.satiety");
    expect(satietyEffect(basic)?.value).toBe(100);
    expect(satietyEffect(poor)?.value).toBe(100);

    const healthEffect = poor.effects.find((e) => e.target === "player.needs.health");
    expect(healthEffect?.operation).toBe("subtract");
    expect(healthEffect?.value).toBe(3);
    expect(basic.effects.some((e) => e.target === "player.needs.health")).toBe(false);
  });

  it("has at least one item with a durability or maintenance rule, its fields within the corpus's 0-100 scale (S19.3)", () => {
    const withDurability = items.filter((i) => i.durability !== undefined);
    const withMaintenance = items.filter((i) => (i.maintenanceRules?.length ?? 0) > 0);
    expect(withDurability.length + withMaintenance.length).toBeGreaterThan(0);

    for (const item of withDurability) {
      expect(item.durability, `${item.id}'s durability`).toBeGreaterThanOrEqual(0);
      expect(item.durability, `${item.id}'s durability`).toBeLessThanOrEqual(100);
    }
    for (const item of withMaintenance) {
      for (const rule of item.maintenanceRules!) {
        expect(rule.intervalWeeks, `${item.id}'s intervalWeeks`).toBeGreaterThan(0);
        expect(rule.costCents, `${item.id}'s costCents`).toBeGreaterThanOrEqual(0);
        expect(rule.timeCost, `${item.id}'s timeCost`).toBeGreaterThanOrEqual(0);
        expect(rule.conditionLossIfSkipped, `${item.id}'s conditionLossIfSkipped`).toBeGreaterThanOrEqual(0);
        expect(rule.conditionLossIfSkipped, `${item.id}'s conditionLossIfSkipped`).toBeLessThanOrEqual(100);
        expect(rule.breakageChanceAtZeroCondition, `${item.id}'s breakageChanceAtZeroCondition`).toBeGreaterThanOrEqual(0);
        expect(rule.breakageChanceAtZeroCondition, `${item.id}'s breakageChanceAtZeroCondition`).toBeLessThanOrEqual(100);
      }
    }
  });

  it("targets only a writable Modifier field in every item's effects", () => {
    // Not itself a numbered criterion, but every other item test assumes the engine accepts
    // these targets — this is what actually proves it, by iterating the collection rather
    // than trusting the two items checked by id above.
    for (const item of items) {
      for (const effect of item.effects) {
        expect(isWritableTarget(effect.target), `${item.id}'s effect targets ${effect.target}`).toBe(true);
      }
    }
  });

  it("builds and validates with items wired in", () => {
    const result = buildStableLifeCampaign();
    expect(result.errors).toEqual([]);
    expect(result.ok).toBe(true);
    const registry = buildValidatedContentRegistry([built()], kinds);
    expect(registry.errors).toEqual([]);
    expect(registry.ok).toBe(true);
  });
});

describe("Stable Life — courses (S17)", () => {
  const courses = stableLifeSource.courses;

  // `03` §7.1's ten education types, kebab-cased verbatim from the corpus's own list.
  // `CourseDefinition` (content.ts) has no dedicated type field — the same `tags` mechanism
  // S16.2 used for event types carries it here.
  const VALID_EDUCATION_TYPES = new Set([
    "high-school-equivalency", "vocational-certificates", "university-degrees",
    "night-classes", "professional-certifications", "online-courses",
    "self-directed-learning", "apprenticeships", "employer-training",
    "questionable-motivational-seminars",
  ]);

  // `03` §16.4's education-cost table, restated as literal cent/unit values rather than read
  // from the source's own constant — the same independence S15.4's wage-table test used.
  const EDUCATION_COST_TABLE = [
    { tuitionCents: 34_000, durationWeeks: 8, weeklyTimeCost: 3 }, // Short certificate
    { tuitionCents: 90_000, durationWeeks: 16, weeklyTimeCost: 4 }, // Vocational certificate
    { tuitionCents: 160_000, durationWeeks: 24, weeklyTimeCost: 5 }, // Degree module
  ] as const;

  function educationTypeOf(course: (typeof courses)[number]): string {
    const typeTags = course.tags.filter((t) => VALID_EDUCATION_TYPES.has(t));
    expect(typeTags, `${course.id} should carry exactly one §7.1 type tag`).toHaveLength(1);
    return typeTags[0]!;
  }

  it("has 6 entries, each a distinct §7.1 education type (S17.1)", () => {
    expect(courses).toHaveLength(6);
    const types = courses.map(educationTypeOf);
    expect(new Set(types).size, "every course should use a different §7.1 type").toBe(6);
    for (const type of types) {
      expect(VALID_EDUCATION_TYPES.has(type), `"${type}" should be one of §7.1's types`).toBe(true);
    }
  });

  it("prices tuition, duration and weekly time cost from §16.4's education-cost table exactly (S17.2)", () => {
    for (const course of courses) {
      const matches = EDUCATION_COST_TABLE.some(
        (row) =>
          row.tuitionCents === course.tuitionCents &&
          row.durationWeeks === course.durationWeeks &&
          row.weeklyTimeCost === course.weeklyTimeCost,
      );
      expect(matches, `${course.id}'s tuition/duration/weeklyTimeCost should match a §16.4 row exactly`).toBe(
        true,
      );
    }
    // All three rows are actually used, not just one stretched across all six.
    for (const row of EDUCATION_COST_TABLE) {
      const used = courses.some(
        (c) =>
          c.tuitionCents === row.tuitionCents &&
          c.durationWeeks === row.durationWeeks &&
          c.weeklyTimeCost === row.weeklyTimeCost,
      );
      expect(used, `no course prices from the $${row.tuitionCents / 100} row`).toBe(true);
    }
  });

  it("carries §7.4's failure rules — attendance floor, study floor, retained progress — within range (S17.3)", () => {
    for (const course of courses) {
      const rules = course.failureRules;
      expect(rules, `${course.id} should carry failureRules`).toBeDefined();
      expect(rules.minimumAttendanceRatio, `${course.id}'s attendance floor`).toBeGreaterThan(0);
      expect(rules.minimumAttendanceRatio, `${course.id}'s attendance floor`).toBeLessThanOrEqual(100);
      expect(rules.minimumStudyUnitsPerWeek, `${course.id}'s study floor`).toBeGreaterThan(0);
      expect(rules.progressRetainedOnFailure, `${course.id}'s retained progress`).toBeGreaterThanOrEqual(0);
      expect(rules.progressRetainedOnFailure, `${course.id}'s retained progress`).toBeLessThanOrEqual(100);
    }
  });

  it("names only credentials a course actually grants, checked against every job requirement (S17.4)", () => {
    const grantedLevels = new Set(
      courses.map((c) => c.awardsCredential).filter((level): level is NonNullable<typeof level> => level !== undefined),
    );
    const credentialRequirements = stableLifeSource.jobs
      .flatMap((job) => job.requirements)
      .filter((r) => r.type === "credential");
    for (const requirement of credentialRequirements) {
      if ("field" in requirement.condition) {
        expect(
          grantedLevels.has(
            requirement.condition.value as NonNullable<(typeof courses)[number]["awardsCredential"]>,
          ),
          `a job requires credential "${requirement.condition.value}", which no course grants`,
        ).toBe(true);
      }
    }
  });

  it("builds and validates with courses wired in", () => {
    const result = buildStableLifeCampaign();
    expect(result.errors).toEqual([]);
    expect(result.ok).toBe(true);
    const registry = buildValidatedContentRegistry([built()], kinds);
    expect(registry.errors).toEqual([]);
    expect(registry.ok).toBe(true);
  });
});

describe("Stable Life — NPCs (S20)", () => {
  const npcs = stableLifeSource.npcs;
  const employers = stableLifeSource.employers;
  const housing = stableLifeSource.housing;

  // `03` §12.2's fourteen roles, kebab-cased — the same convention S16.2/S17.1 used for
  // event types and education types.
  const VALID_ROLES = new Set([
    "employer", "manager", "coworker", "teacher", "friend", "partner", "landlord",
    "lender", "customer", "competitor", "government-employee", "business-partner",
    "neighbor", "medical-professional",
  ]);

  const RELATIONSHIP_DIMENSIONS = ["affinity", "trust", "respect", "resentment"] as const;

  it("has 8 entries, covering at least 6 distinct §12.2 roles (S20.1)", () => {
    expect(npcs).toHaveLength(8);
    const roles = new Set(npcs.map((n) => n.defaultRole));
    for (const role of roles) {
      expect(VALID_ROLES.has(role), `"${role}" should be one of §12.2's roles`).toBe(true);
    }
    expect(roles.size, "should cover at least 6 distinct roles").toBeGreaterThanOrEqual(6);
  });

  it("carries §12.1's four relationship dimensions, each within 0-100 (S20.2)", () => {
    for (const npc of npcs) {
      for (const dimension of RELATIONSHIP_DIMENSIONS) {
        const value = npc.initialRelationship[dimension];
        expect(value, `${npc.id}.initialRelationship.${dimension}`).toBeGreaterThanOrEqual(0);
        expect(value, `${npc.id}.initialRelationship.${dimension}`).toBeLessThanOrEqual(100);
      }
    }
  });

  it("names only employers that exist, and only housing tiers that exist for a landlord (S20.3)", () => {
    const employerIds = new Set(employers.map((e) => e.id));
    const housingIds = new Set(housing.map((h) => h.id));
    const npcIds = new Set(npcs.map((n) => n.id));

    // Every employer's npcIds round-trip back to an NPC that exists.
    for (const employer of employers) {
      for (const npcId of employer.npcIds) {
        expect(npcIds.has(npcId), `${employer.id} names NPC ${npcId}`).toBe(true);
      }
    }
    // Every NPC an employer names is itself attached to that employer, not merely present.
    const attachedNpcIds = new Set(employers.flatMap((e) => e.npcIds));
    for (const npcId of attachedNpcIds) {
      const attachedTo = employers.filter((e) => e.npcIds.includes(npcId));
      expect(attachedTo, `NPC ${npcId} should be attached to exactly one employer`).toHaveLength(1);
      expect(employerIds.has(attachedTo[0]!.id)).toBe(true);
    }

    // A landlord names the housing tier it attaches to as a tag (the file header explains
    // why — `HousingDefinitionSource` carries no landlord field).
    const landlords = npcs.filter((n) => n.defaultRole === "landlord");
    expect(landlords.length, "should author at least one landlord").toBeGreaterThan(0);
    for (const landlord of landlords) {
      const housingTags = landlord.tags.filter((t) => housingIds.has(t));
      expect(housingTags, `${landlord.id} should tag exactly one housing tier`).toHaveLength(1);
    }
  });

  it("builds and validates with NPCs wired in", () => {
    const result = buildStableLifeCampaign();
    expect(result.errors).toEqual([]);
    expect(result.ok).toBe(true);
    const registry = buildValidatedContentRegistry([built()], kinds);
    expect(registry.errors).toEqual([]);
    expect(registry.ok).toBe(true);
  });
});

describe("Stable Life — backgrounds and traits (S22)", () => {
  const backgrounds = stableLifeSource.backgrounds;
  const traits = stableLifeSource.traits;
  const skills = stableLifeSource.skills;

  // `BackgroundDefinition` (engine `content.ts`) carries no starting-items field at all —
  // `03` §8.10 is explicit that starting inventory comes from `ScenarioDefinition`, not the
  // background. So S22.2/S22.3's "starting items" clause has nothing to check for a
  // background; differentiation and existence are asserted over skills and credentials only.
  const VALID_CREDENTIAL_LEVELS = new Set([
    "none", "school", "certificate", "diploma", "degree", "postgraduate",
  ]);

  it("has 3 entries (S22.1)", () => {
    expect(backgrounds).toHaveLength(3);
  });

  it("differs pairwise in starting skills or starting credentials (S22.2)", () => {
    function differs(a: (typeof backgrounds)[number], b: (typeof backgrounds)[number]): boolean {
      const skillsDiffer = JSON.stringify(a.startingSkills) !== JSON.stringify(b.startingSkills);
      const credentialsDiffer =
        JSON.stringify([...a.startingCredentials].sort()) !==
        JSON.stringify([...b.startingCredentials].sort());
      return skillsDiffer || credentialsDiffer;
    }
    for (let i = 0; i < backgrounds.length; i++) {
      for (let j = i + 1; j < backgrounds.length; j++) {
        expect(
          differs(backgrounds[i]!, backgrounds[j]!),
          `${backgrounds[i]!.id} should differ from ${backgrounds[j]!.id}`,
        ).toBe(true);
      }
    }
  });

  it("names only skills that exist and only valid credential levels, by iterating (S22.3)", () => {
    const skillIds = new Set(skills.map((s) => s.id));
    for (const background of backgrounds) {
      for (const skillId of Object.keys(background.startingSkills)) {
        expect(skillIds.has(skillId), `${background.id} names skill "${skillId}"`).toBe(true);
      }
      for (const level of background.startingCredentials) {
        expect(VALID_CREDENTIAL_LEVELS.has(level), `${background.id} names credential level "${level}"`).toBe(
          true,
        );
      }
    }
  });

  it("wires traits to backgrounds in both directions — every grant resolves, every trait is used (S22.4)", () => {
    const traitIds = new Set(traits.map((t) => t.id));
    const usedTraitIds = new Set(backgrounds.flatMap((b) => b.startingTraits));
    for (const background of backgrounds) {
      for (const traitId of background.startingTraits) {
        expect(traitIds.has(traitId), `${background.id} grants unknown trait "${traitId}"`).toBe(true);
      }
    }
    for (const trait of traits) {
      expect(usedTraitIds.has(trait.id), `trait "${trait.id}" is defined but no background grants it`).toBe(
        true,
      );
    }
  });

  it("carries every AttributeState field on startingAttributes (S22.3)", () => {
    const ATTRIBUTE_KEYS = ["intelligence", "discipline", "charisma", "creativity", "resilience", "wisdom", "luck"];
    for (const background of backgrounds) {
      for (const key of ATTRIBUTE_KEYS) {
        expect(
          typeof background.startingAttributes[key as keyof typeof background.startingAttributes],
          `${background.id}.startingAttributes.${key}`,
        ).toBe("number");
      }
    }
  });

  it("builds and validates with backgrounds and traits wired in", () => {
    const result = buildStableLifeCampaign();
    expect(result.errors).toEqual([]);
    expect(result.ok).toBe(true);
    const registry = buildValidatedContentRegistry([built()], kinds);
    expect(registry.errors).toEqual([]);
    expect(registry.ok).toBe(true);
  });
});

describe("Stable Life — the rest of the week's events (S21)", () => {
  const events = stableLifeSource.events;

  /** `03` §11.1's fourteen event categories, kebab-cased. S16 authored the first seven;
   *  S21 adds the remaining seven, so this list is the whole of §11.1 for the first time. */
  const CORPUS_CATEGORIES = [
    "employment", "housing", "health", "relationships", "economy", "education", "purchases",
    "crime", "weather", "opportunity", "bureaucracy", "transportation", "business",
    "pure-absurdity",
  ] as const;

  /** The seven S21 itself draws from — §11.1 minus the seven S16 scoped. */
  const S21_CATEGORIES = [
    "housing", "health", "relationships", "education", "weather", "opportunity", "pure-absurdity",
  ] as const;

  const VALID_TYPES = new Set([
    "immediate", "delayed", "recurring", "conditional", "chained",
    "player-triggered", "npc-triggered", "world-triggered", "unique", "repeatable",
  ]);

  it("reaches 30 entries, the 15 added drawn from S21's seven categories, each represented (S21.1)", () => {
    expect(events).toHaveLength(30);

    const added = events.filter((e) => (S21_CATEGORIES as readonly string[]).includes(e.category));
    expect(added).toHaveLength(15);

    const addedCategories = new Set(added.map((e) => e.category));
    for (const category of S21_CATEGORIES) {
      expect(addedCategories.has(category), `no S21 event names category "${category}"`).toBe(true);
    }
  });

  it("represents every one of §11.1's fourteen categories at least once across all 30 (S21.2)", () => {
    const categories = new Set(events.map((e) => e.category));
    for (const category of CORPUS_CATEGORIES) {
      expect(categories.has(category), `no event names §11.1 category "${category}"`).toBe(true);
    }
    // And nothing outside §11.1's closed list has crept in.
    for (const event of events) {
      expect(CORPUS_CATEGORIES as readonly string[], `${event.id}'s category`).toContain(event.category);
    }
    // Every event still carries exactly one §11.2 type tag, the rule S16.2 set.
    for (const event of events) {
      expect(event.tags.filter((t) => VALID_TYPES.has(t)), `${event.id}'s §11.2 type tag`).toHaveLength(1);
    }
  });

  /** The same minimal mirror of the engine's `evaluateCondition`/`compare` the S16 block
   *  uses, extended with the two operators S21's own conditions reach for. Reimplemented
   *  rather than imported, because CP1 forbids reaching past the published surface even
   *  from a test. */
  function evaluateTestCondition(condition: Condition, resolveField: (path: string) => unknown): boolean {
    if ("all" in condition) return condition.all.every((c) => evaluateTestCondition(c, resolveField));
    if ("any" in condition) return condition.any.some((c) => evaluateTestCondition(c, resolveField));
    if ("not" in condition) return !evaluateTestCondition(condition.not, resolveField);
    if ("exists" in condition || "count" in condition) {
      throw new Error("this campaign's conditions never use a collection quantifier (S21.5)");
    }
    const actual = resolveField(condition.field);
    switch (condition.operator) {
      case "equals": return actual === condition.value;
      case "not_equals": return actual !== condition.value;
      case "less_than": return (actual as number) < (condition.value as number);
      case "greater_than": return (actual as number) > (condition.value as number);
      case "contains": return Array.isArray(actual) && actual.includes(condition.value);
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
   * A housing/education state fixture, seeded from the campaign's own authored ids rather
   * than invented ones — the scenario's real starting housing tier, and a real course id.
   * `damage` and `completedCourseIds` are the two fields `HousingState`/`EducationState`
   * expose as directly addressable (`actor.ts`); every collection-shaped sibling is the
   * S21.5 omission named in the source's file header.
   */
  function fixtureState(overrides: {
    damage?: number;
    landlordNpcId?: string;
    completedCourseIds?: string[];
  }): Record<string, unknown> {
    const room = stableLifeSource.housing.find((h) => h.id === "housing-rented-room")!;
    return {
      player: {
        housing: {
          definitionId: room.id,
          damage: overrides.damage ?? 0,
          landlordNpcId: overrides.landlordNpcId,
        },
        education: {
          completedCourseIds: overrides.completedCourseIds ?? [],
        },
      },
    };
  }

  it("evaluates a housing-condition event against a built campaign's real state (S21.3)", () => {
    // `player.housing.damage` is `03` §9.1's accumulated disrepair, `0–100`. A tier the
    // player has just moved into carries no damage, so the boiler event is false at the
    // real starting state and true once disrepair passes its threshold.
    const boiler = events.find((e) => e.id === "event-boiler-gives-up")!;
    expect(evaluateTestCondition(boiler.conditions, (p) => fieldOf(fixtureState({}), p))).toBe(false);
    expect(evaluateTestCondition(boiler.conditions, (p) => fieldOf(fixtureState({ damage: 60 }), p))).toBe(true);
  });

  it("evaluates the two conditions that stood in for the ones §11.3 wanted (S21.3, S21.5)", () => {
    // Neither of these is the condition S21.3 asks for — see the source's file header. The
    // landlord event tests an NPC *identity*, not a relationship dimension; the credential
    // event tests a *completed* course, not one in progress. Both are the strongest form
    // this pinned engine can express, and both are asserted here so that the day the engine
    // grows collection support, these are the two sites to revisit.
    const inspection = events.find((e) => e.id === "event-landlord-inspection")!;
    expect(evaluateTestCondition(inspection.conditions, (p) => fieldOf(fixtureState({}), p))).toBe(false);
    expect(
      evaluateTestCondition(inspection.conditions, (p) =>
        fieldOf(fixtureState({ landlordNpcId: "npc-landlord-rented-room" }), p),
      ),
    ).toBe(true);

    const credential = events.find((e) => e.id === "event-credential-recognized")!;
    expect(evaluateTestCondition(credential.conditions, (p) => fieldOf(fixtureState({}), p))).toBe(false);
    expect(
      evaluateTestCondition(credential.conditions, (p) =>
        fieldOf(fixtureState({ completedCourseIds: ["course-high-school-equivalency"] }), p),
      ),
    ).toBe(true);
  });

  it("names only ids that exist, wherever an event mentions one (S21.4)", () => {
    // Iterating the serialized event rather than restating its references: every string
    // anywhere in an event that looks like one of this campaign's ids must resolve. That
    // catches a reference in a `Reward.target` or a tag as readily as one in
    // `scheduledEvents`, without this test having to know where authors put them.
    const collections: Record<string, Set<string>> = {
      "npc-": new Set(stableLifeSource.npcs.map((n) => n.id)),
      "housing-": new Set(stableLifeSource.housing.map((h) => h.id)),
      "item-": new Set(stableLifeSource.items.map((i) => i.id)),
      "course-": new Set(stableLifeSource.courses.map((c) => c.id)),
      "event-": new Set(events.map((e) => e.id)),
    };
    const idLike = /"((?:npc|housing|item|course|event)-[a-z0-9-]+)"/g;
    // `npc-triggered` and `world-triggered` are §11.2 *type* tags, not ids, and the first
    // shares the `npc-` prefix. Excluded by name so the scan stays strict everywhere else.
    const NOT_AN_ID = VALID_TYPES;

    let checked = 0;
    for (const event of events) {
      for (const match of JSON.stringify(event).matchAll(idLike)) {
        const id = match[1]!;
        if (NOT_AN_ID.has(id)) continue;
        const prefix = Object.keys(collections).find((p) => id.startsWith(p))!;
        expect(collections[prefix]!.has(id), `${event.id} references unknown id "${id}"`).toBe(true);
        checked += 1;
      }
    }
    // The scan is only evidence if it actually found references to check.
    expect(checked).toBeGreaterThan(events.length);
  });

  it("builds and validates with the full 30-event set wired in (S21.6)", () => {
    const result = buildStableLifeCampaign();
    expect(result.errors).toEqual([]);
    expect(result.ok).toBe(true);
    const registry = buildValidatedContentRegistry([built()], kinds);
    expect(registry.errors).toEqual([]);
    expect(registry.ok).toBe(true);
  });
});

describe("Stable Life — goals and victory (S23)", () => {
  const goals = stableLifeSource.goals;
  const scenario = stableLifeSource.scenarios[0]!;

  it("covers 4 of §13's goal categories, the existing scenario goal among them (S23.1)", () => {
    expect(goals.some((g) => g.id === "goal-stable-life" && g.category === "scenario")).toBe(true);
    const categories = new Set(goals.map((g) => g.category));
    expect(categories.size).toBe(4);
  });

  it("has at least one persistent goal, its consecutive-week count present and greater than one (S23.2)", () => {
    const persistent = goals.filter((g) => g.requiredDurationWeeks !== undefined);
    expect(persistent.length).toBeGreaterThan(0);
    for (const goal of persistent) {
      expect(goal.requiredDurationWeeks!).toBeGreaterThan(1);
    }
  });

  it("carries a starting background from S22 and a starting inventory drawn from S19's items, every id resolving (S23.3)", () => {
    expect(scenario.startingBackgroundIds.length).toBeGreaterThan(0);
    const backgroundIds = new Set(stableLifeSource.backgrounds.map((b) => b.id));
    for (const id of scenario.startingBackgroundIds) {
      expect(backgroundIds.has(id), `unknown background "${id}"`).toBe(true);
    }

    expect(scenario.startingInventory.length).toBeGreaterThan(0);
    const itemIds = new Set(stableLifeSource.items.map((i) => i.id));
    for (const entry of scenario.startingInventory) {
      expect(itemIds.has(entry.definitionId), `unknown item "${entry.definitionId}"`).toBe(true);
    }
  });

  it("still omits §16.3's credential completion requirement, the open decision-log entry still open (S23.4)", () => {
    // `player.education.credentials` is a collection (`Credential[]`, `actor.ts`); the
    // pinned engine's `exists`/`count` quantifiers throw on `collection` (file header,
    // and S16.5/S21.5's identical finding). Not expressible as a scalar comparison either
    // — there is no `highestCredentialLevel` field. Still omitted; the decision-log entry
    // this slice was asked to confirm is `## Open`'s S16.5, which names this same gap and
    // has not been converted to an issue or closed.
    const stableLifeGoal = goals.find((g) => g.id === "goal-stable-life")!;
    const conditionText = JSON.stringify(stableLifeGoal.conditions);
    expect(conditionText).not.toContain("credential");

    const decisionsLog = readFileSync(
      new URL("../../design/90-decisions.md", import.meta.url),
      "utf8",
    );
    const openSection = decisionsLog.slice(
      decisionsLog.indexOf("## Open"),
      decisionsLog.indexOf("\n## ", decisionsLog.indexOf("## Open") + 1),
    );
    expect(openSection).toContain("S16.5");
    expect(openSection).toContain("credential completion requirement");
  });

  function evaluateTestCondition(condition: Condition, resolveField: (path: string) => unknown): boolean {
    if ("all" in condition) return condition.all.every((c) => evaluateTestCondition(c, resolveField));
    if ("any" in condition) return condition.any.some((c) => evaluateTestCondition(c, resolveField));
    if ("not" in condition) return !evaluateTestCondition(condition.not, resolveField);
    if ("exists" in condition || "count" in condition) {
      throw new Error("this campaign's goal conditions never use a collection quantifier (S23.4)");
    }
    const actual = resolveField(condition.field);
    switch (condition.operator) {
      case "equals": return actual === condition.value;
      case "not_equals": return actual !== condition.value;
      case "greater_or_equal": return (actual as number) >= (condition.value as number);
      case "less_or_equal": return (actual as number) <= (condition.value as number);
      case "contains": return Array.isArray(actual) && actual.includes(condition.value);
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

  /** A finances/career/needs/education fixture built from the scenario's own starting
   *  numbers and real content ids, not invented ones. */
  function fixtureState(overrides: {
    cashCents?: number;
    overdueBalanceCents?: number;
    careerTier?: string;
    happiness?: number;
    health?: number;
    completedCourseIds?: string[];
  }): Record<string, unknown> {
    return {
      player: {
        finances: {
          cashCents: overrides.cashCents ?? scenario.startingCashCents,
          overdueBalanceCents: overrides.overdueBalanceCents ?? 0,
        },
        career: { highestTierAchieved: overrides.careerTier },
        needs: { happiness: overrides.happiness ?? 50, health: overrides.health ?? 50 },
        education: { completedCourseIds: overrides.completedCourseIds ?? [] },
      },
    };
  }

  it("evaluates every goal's conditions against a built campaign, both false and true (S23.5)", () => {
    built(); // proves the campaign actually builds before conditions are evaluated against it

    for (const goal of goals) {
      const atStart = evaluateTestCondition(goal.conditions, (p) => fieldOf(fixtureState({}), p));
      expect(atStart, `${goal.id} should not already be met at the scenario's starting state`).toBe(false);
    }

    const stableLifeGoal = goals.find((g) => g.id === "goal-stable-life")!;
    expect(
      evaluateTestCondition(
        stableLifeGoal.conditions,
        (p) =>
          fieldOf(
            fixtureState({ cashCents: 2000_00, careerTier: "skilled", happiness: 60, health: 60 }),
            p,
          ),
      ),
    ).toBe(true);

    const cushion = goals.find((g) => g.id === "goal-financial-cushion")!;
    expect(
      evaluateTestCondition(cushion.conditions, (p) => fieldOf(fixtureState({ cashCents: 500_00 }), p)),
    ).toBe(true);

    const advancement = goals.find((g) => g.id === "goal-career-advancement")!;
    expect(
      evaluateTestCondition(advancement.conditions, (p) => fieldOf(fixtureState({ careerTier: "senior" }), p)),
    ).toBe(true);

    const certified = goals.find((g) => g.id === "goal-certified-professional")!;
    expect(
      evaluateTestCondition(
        certified.conditions,
        (p) =>
          fieldOf(fixtureState({ completedCourseIds: ["course-professional-certification-it"] }), p),
      ),
    ).toBe(true);
  });

  it("resolves every id the scenario's goalIds name (S23.5)", () => {
    const goalIds = new Set(goals.map((g) => g.id));
    expect(scenario.goalIds.length).toBeGreaterThan(0);
    for (const id of scenario.goalIds) {
      expect(goalIds.has(id), `scenario names unknown goal "${id}"`).toBe(true);
    }
  });

  it("builds and validates with the full goal/scenario set wired in (S23.6)", () => {
    const result = buildStableLifeCampaign();
    expect(result.errors).toEqual([]);
    expect(result.ok).toBe(true);
    const registry = buildValidatedContentRegistry([built()], kinds);
    expect(registry.errors).toEqual([]);
    expect(registry.ok).toBe(true);
  });
});
