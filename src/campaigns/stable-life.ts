/**
 * "Stable Life" — the first scenario of Life in the Fast Lane.
 *
 * **This is a seed, not the game.** It exists so the authoring path in this repository is
 * proven end to end: the spec set here builds a `SimulationCampaignSource`, the engine's
 * exported builder lifts it, Tier 1 validation accepts it, and `scripts/export-content.ts`
 * publishes portable JSON from it. Everything below is authored from
 * `docs/docs/games/03-game-design.md` and cited by section; nothing is invented here, and
 * nothing is copied from the engine's own `stable-life` regression fixture, which is
 * engine-owned and unpublished.
 *
 * What it deliberately does not yet carry: jobs, courses, items, events, NPCs,
 * opportunities, achievements, headlines, employers, backgrounds, traits and skills. Each
 * is its own authoring slice against §16.1's content targets. The collections are present
 * and empty rather than absent, because `SimulationCampaignSource` requires all seventeen
 * and an empty one is an honest statement that the content is unwritten.
 *
 * **One completion requirement from §16.3 is not expressible today.** "Education:
 * certificate or better" needs a condition over `player.education.credentials`, which is a
 * collection; `kinds/simulation/conditions.ts` implements `field` and throws on
 * `collection`, documenting the gap as "not yet" rather than "never". The goal below
 * carries the five requirements that are scalar comparisons and omits that one. This is
 * recorded as an open item rather than worked around — a goal that silently drops a stated
 * completion requirement would be worse than one that visibly does not carry it.
 */

import {
  buildCampaign,
  buildSimulationCampaign,
  type SimulationCampaignSource,
} from "@the-running-dev/game-engine/authoring";
import type {
  BuiltCampaign,
  Campaign,
  CommandResult,
} from "@the-running-dev/game-engine";

export const STABLE_LIFE_CAMPAIGN_ID = "life-in-the-fast-lane-stable-life";
export const STABLE_LIFE_CAMPAIGN_VERSION = "0.1.0";
export const STABLE_LIFE_SCENARIO_ID = "scenario-stable-life";

/** §16.4 — the provisional economic baseline, in cents. Provisional per §22.2 of the
 *  engine specification; these are here so the scenario is runnable, not because they are
 *  balanced. */
const DOLLARS = (amount: number): number => amount * 100;

/**
 * §16.2 — the eight starting locations and the map between them. Travel is priced by the
 * *destination's* `travelTimeUnits`, all connections are bidirectional, and there is no
 * pathfinding: a two-hop journey is two `travel` actions. The Department of Forms costs 2
 * to enter and sits three hops from Home, which is the joke the map itself tells.
 */
const locations: SimulationCampaignSource["locations"] = [
  {
    id: "home",
    name: { key: "stable-life.location.home.name", text: "Home" },
    description: {
      key: "stable-life.location.home.description",
      text: "A cheap rented room. The hub of the map, and the only place four other places are one hop away from.",
    },
    connections: ["market", "employment-office", "recreation-area", "workplace"],
    travelTimeUnits: 1,
    actionTypes: ["rest", "eat", "study", "socialize"],
  },
  {
    id: "workplace",
    name: { key: "stable-life.location.workplace.name", text: "Workplace" },
    description: {
      key: "stable-life.location.workplace.description",
      text: "Wherever the current job happens. Indistinguishable from the last one.",
    },
    connections: ["home", "market", "recreation-area"],
    travelTimeUnits: 1,
    actionTypes: ["work", "work_overtime", "negotiate_job_terms"],
  },
  {
    id: "market",
    name: { key: "stable-life.location.market.name", text: "Market" },
    description: {
      key: "stable-life.location.market.description",
      text: "Groceries, and the difference between the basic shop and the poor-quality one.",
    },
    connections: ["home", "workplace", "bank"],
    travelTimeUnits: 1,
    actionTypes: ["shop", "sell_item"],
  },
  {
    id: "bank",
    name: { key: "stable-life.location.bank.name", text: "Bank" },
    description: {
      key: "stable-life.location.bank.description",
      text: "Two hops from Home, which is exactly as far as money should be.",
    },
    connections: ["market", "employment-office"],
    travelTimeUnits: 1,
    actionTypes: ["deposit_savings", "borrow_money", "repay_debt", "pay_bills"],
  },
  {
    id: "employment-office",
    name: { key: "stable-life.location.employment-office.name", text: "Employment Office" },
    description: {
      key: "stable-life.location.employment-office.description",
      text: "Where work is looked for, which is not the same as where work is found.",
    },
    connections: ["home", "bank", "department-of-forms"],
    travelTimeUnits: 1,
    actionTypes: ["search_for_work", "apply_for_job"],
  },
  {
    id: "recreation-area",
    name: { key: "stable-life.location.recreation-area.name", text: "Recreation Area" },
    description: {
      key: "stable-life.location.recreation-area.description",
      text: "The only place that improves two needs at once, and the first thing a full week deletes.",
    },
    connections: ["home", "workplace", "community-college"],
    travelTimeUnits: 1,
    actionTypes: ["exercise", "socialize"],
  },
  {
    id: "community-college",
    name: { key: "stable-life.location.community-college.name", text: "Community College" },
    description: {
      key: "stable-life.location.community-college.description",
      text: "Two hops from Home. §16.2.1 notes its travel cost is the first lever to move if the certificate path proves impossible rather than merely hard.",
    },
    connections: ["recreation-area", "department-of-forms"],
    travelTimeUnits: 1,
    actionTypes: ["attend_class", "enroll_course", "withdraw_course", "study"],
  },
  {
    id: "department-of-forms",
    name: { key: "stable-life.location.department-of-forms.name", text: "Department of Forms" },
    description: {
      key: "stable-life.location.department-of-forms.description",
      text: "Enter cost 2, three hops from Home. You have to genuinely want that form.",
    },
    connections: ["employment-office", "community-college"],
    travelTimeUnits: 2,
    actionTypes: ["respond_to_event"],
  },
];

/**
 * §16.3 — the cheap rented room the player starts in. §16.4 prices it at $95 weekly rent;
 * utilities ($18) and transport ($15) are separate baseline lines that no housing field
 * carries, so they are not folded into `weeklyCostCents` here.
 */
const housing: SimulationCampaignSource["housing"] = [
  {
    id: "housing-rented-room",
    name: { key: "stable-life.housing.rented-room.name", text: "Rented Room" },
    description: {
      key: "stable-life.housing.rented-room.description",
      text: "The cheapest housing tier. It is a room, and it is rented, and the description has now told you everything it has.",
    },
    upfrontCostCents: 0,
    weeklyCostCents: DOLLARS(95),
    capacity: 1,
    comfort: 30,
    safety: 45,
    prestige: 5,
    storage: 10,
    commuteModifier: 0,
    energyRecoveryModifier: 0,
    happinessModifier: 0,
    healthModifier: 0,
    maintenanceRisk: 20,
    requirements: [],
    tags: ["starting", "cheapest"],
  },
];

/**
 * §16.3's completion requirements, minus the credential one the condition language cannot
 * express yet (see the file header). `highestTierAchieved` is a string, so "skilled or
 * better" is authored as the explicit set rather than an ordering comparison — the tier
 * union has no numeric rank the evaluator could compare against.
 */
const goals: SimulationCampaignSource["goals"] = [
  {
    id: "goal-stable-life",
    label: { key: "stable-life.goal.stable-life.label", text: "A Stable Life" },
    description: {
      key: "stable-life.goal.stable-life.description",
      text: "Two thousand dollars, skilled work, sixty happiness, sixty health, and nothing overdue. Twelve months.",
    },
    category: "scenario",
    conditions: {
      all: [
        { field: "player.finances.cashCents", operator: "greater_or_equal", value: DOLLARS(2000) },
        {
          any: [
            { field: "player.career.highestTierAchieved", operator: "equals", value: "skilled" },
            { field: "player.career.highestTierAchieved", operator: "equals", value: "professional" },
            { field: "player.career.highestTierAchieved", operator: "equals", value: "senior" },
          ],
        },
        { field: "player.needs.happiness", operator: "greater_or_equal", value: 60 },
        { field: "player.needs.health", operator: "greater_or_equal", value: 60 },
        { field: "player.finances.overdueBalanceCents", operator: "equals", value: 0 },
      ],
    },
  },
];

/** §16.3 — twelve months to establish a stable life. */
const scenarios: SimulationCampaignSource["scenarios"] = [
  {
    id: STABLE_LIFE_SCENARIO_ID,
    name: { key: "stable-life.scenario.name", text: "Stable Life" },
    description: {
      key: "stable-life.scenario.description",
      text: "Two hundred dollars, no job, basic education, a rented room, one week of food, and fifty-two weeks.",
    },
    startingBackgroundIds: [],
    startingCashCents: DOLLARS(200),
    startingHousingId: "housing-rented-room",
    startingLocationId: "home",
    startingInventory: [],
    goalIds: ["goal-stable-life"],
    weekLimit: 52,
    mode: "classic",
    goalFailurePrecedence: "goals_win",
  },
];

/** One difficulty, carrying no modifiers — the baseline the §16.4 numbers already describe.
 *  Harder and easier settings are a balance decision and are not invented here. */
const difficulties: SimulationCampaignSource["difficulties"] = [
  {
    id: "difficulty-standard",
    label: { key: "stable-life.difficulty.standard.label", text: "Standard" },
    economyModifiers: [],
    needDriftModifiers: [],
    checkDifficultyOffset: 0,
    rivalInformationAccess: "standard",
    rivalStartingAdvantages: [],
  },
];

export const stableLifeSource: SimulationCampaignSource = {
  description: {
    key: "stable-life.campaign.description",
    text: "Life in the Fast Lane — the Stable Life scenario. Fifty-two weeks to turn two hundred dollars and a rented room into something that survives a bad month.",
  },

  jobs: [],
  courses: [],
  housing,
  items: [],
  events: [],
  npcs: [],
  goals,
  scenarios,
  difficulties,
  opportunities: [],
  achievements: [],
  headlines: [],
  employers: [],
  locations,
  backgrounds: [],
  traits: [],
  skills: [],

  scenarioId: STABLE_LIFE_SCENARIO_ID,
  goalFailurePrecedence: "goals_win",

  sceneTemplate: {
    key: "stable-life.scene",
    text: "Week {week}. {location}.",
  },
  actionLabels: {
    planAdd: { key: "stable-life.action.plan-add", text: "Plan" },
    planRemove: { key: "stable-life.action.plan-remove", text: "Unplan" },
    planClear: { key: "stable-life.action.plan-clear", text: "Clear the week" },
    endWeek: { key: "stable-life.action.end-week", text: "End the week" },
  },
};

const CAMPAIGN_TITLE = {
  key: "stable-life.campaign.title",
  text: "Life in the Fast Lane — Stable Life",
};

/**
 * The catalog card that travels with the published campaign. `contentNotice` says plainly
 * that this is a seed — a player reaching it from a catalog should not be told it is the
 * game when fourteen of its seventeen content collections are empty.
 */
export const stableLifeCatalog = {
  title: "Life in the Fast Lane — Stable Life",
  description:
    "Fifty-two weeks to turn two hundred dollars and a rented room into something that survives a bad month.",
  duration: "52 weeks",
  contentNotice:
    "Seed content. The map and the scenario are authored; jobs, courses, events and possessions are not yet written.",
  featured: false,
  hidden: true,
} as const;

export function buildStableLifeCampaign(): CommandResult<BuiltCampaign> {
  const { content, authoredText } = buildSimulationCampaign(stableLifeSource);
  const campaign: Campaign = {
    id: STABLE_LIFE_CAMPAIGN_ID,
    kindId: "simulation",
    version: STABLE_LIFE_CAMPAIGN_VERSION,
    titleKey: CAMPAIGN_TITLE.key,
    content,
  };
  return buildCampaign(campaign, [CAMPAIGN_TITLE, ...authoredText]);
}
