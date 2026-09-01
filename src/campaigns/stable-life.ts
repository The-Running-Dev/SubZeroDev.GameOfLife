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
 * What it deliberately does not yet carry: opportunities, achievements and headlines
 * (jobs, employers and skills were added by S15; 15 of §16.1's 30 events were added by S16,
 * the other 15 are S21; courses were added by S17; 20 purchasable items were added by S19;
 * 8 NPCs were added by S20; backgrounds and traits were added by S22). Each remaining
 * collection is its own authoring slice against §16.1's content targets. They are present
 * and empty rather than absent, because `SimulationCampaignSource` requires all seventeen
 * and an empty one is an honest statement that the content is unwritten.
 *
 * **§12.3's NPC memories cannot be authored here at all, for a reason distinct from every
 * other CP10 gap above.** Those gaps are a restricted validator rejecting a value; this one
 * is a missing field. `NPCDefinitionSource` (`kinds/simulation/source.ts`) mirrors
 * `NPCDefinition` exactly — `id`, `defaultRole`, `initialRelationship`, `availability`,
 * `tags` plus the name/description text — and carries no memory field at all.
 * `NPCMemory[]` lives only on the runtime `NPCState`, populated by play, not on the content
 * an author writes. So no NPC below carries a starting memory, not because §12.3's shape is
 * unreachable through validation but because the authoring surface has nowhere to put one.
 * Named here per CP10 and tracked as issue #110.
 *
 * **§12.1 states no numeric range for the four relationship dimensions, and the engine's own
 * regression suite confirms it deliberately** (`resolvers.test.ts`: "§6.11 declares no range
 * for the affective dimensions", exercising a negative `affinity` on purpose so an
 * adversarial relationship is not clamped to zero on first contact). Every `initialRelationship`
 * below is still authored within `0`–`100` — this campaign's own convention, matching the
 * `0`–`100` default `03` §3.2/§3.5 states for needs and skills and consistent with §11.3's
 * "any NPC with resentment above 50" example threshold — not a bound the corpus itself states
 * for relationships. A future NPC with a genuinely adversarial starting relationship is not
 * bound by this convention; the engine accepts negative values and this file would say so at
 * that NPC's own site.
 *
 * **Landlord attachment has no dedicated field either.** `HousingDefinitionSource` carries no
 * landlord reference (`HousingState.landlordNpcId` is runtime-only, set when a player moves
 * in), so the one landlord below names the housing tier it attaches to as a `tags` entry —
 * the same mechanism S15/S16 used for a schema field that does not exist. Employer attachment
 * does have a real field, `EmployerDefinition.npcIds`, and is used instead of a tag.
 *
 * **`BackgroundDefinition` carries no starting-items field** (`content.ts`) — §8.10's own
 * player-creation lifecycle text says starting inventory comes from `ScenarioDefinition`, not
 * the background. Not a CP10 omission: the corpus itself places starting inventory outside a
 * background (§8.10, S23.3), so there is nothing here to approximate or name as missing.
 *
 * **§10.2 names four item effects this pinned engine cannot express, for the same reason as
 * the goal and event gaps above.** `validateModifiers` (`validate.ts`) restricts every
 * `Modifier.target` to `player.needs.*`, `player.attributes.*`, `player.skills.*` and
 * `calendar.committedTimeUnits` — there is no employability, prestige, job-unlock or
 * travel-time field a `Modifier` can write to. Clothing's "improves employability or
 * prestige", a computer's "unlocks remote jobs and online education", a vehicle's "reduces
 * travel time", and tools' "improve maintenance checks" are each omitted rather than
 * approximated, named at the authoring site per CP10, and reproduced here as a group because
 * the gap is one cause repeated across `items`, not four different ones. A vehicle's fuel,
 * insurance and repair expenses are omitted for a related but distinct reason: `ItemDefinition
 * .weeklyCostCents` exists on the type but only `HousingState.weeklyCostCents` is levied by
 * `endOfWeek.ts` (found authoring S18) — authoring a nonzero value there would silently charge
 * nothing, which is the CP10 approximation this omits instead.
 *
 * **Two completion/condition requirements are not expressible today, for the same reason.**
 * §16.3's "Education: certificate or better" needs a condition over
 * `player.education.credentials`, a collection; `kinds/simulation/conditions.ts` implements
 * `field` and throws on `collection` (the engine's `ConditionResolver.collection`, and
 * therefore every `exists`/`count` quantifier in `Condition`), documenting the gap as "not
 * yet" rather than "never". The goal below carries the five requirements that are scalar
 * comparisons and omits that one. §11.3 names the same quantifiers for events —
 * "owns any item tagged formal_clothing", "any NPC with resentment above 50" — and two of
 * the first 15 events below would have used one (S16.5): `event-job-interview-invitation`
 * would gate on a `count` over `player.career.pendingApplications`, and
 * `event-car-breakdown` would gate on an `exists` over `player.inventory` for an owned
 * vehicle. Both omit that condition and name the omission at the site, per CP10. Recorded
 * as an open item rather than worked around — a condition that silently drops a stated
 * requirement would be worse than one that visibly does not carry it.
 *
 * **S21 adds two more of the same kind, for a running total of four across S16 and S21.**
 * `event-landlord-inspection` and `event-neighbor-borrows-again` each want a condition over
 * `player.relationships` — an array on the actor (`actor.ts`), reached by neither addressing
 * form: the `exists`/`count` quantifiers throw on `collection`, and §7.1's natural-key path
 * — `player.relationships.<npcId>.affinity` — throws too, because `resolveField`'s generic
 * per-segment walk cannot key an array by an id.
 *
 * Three events carry the strongest thing that *is* expressible for what §11.3 asks of them.
 * `event-landlord-inspection` tests NPC *identity* (`player.housing.landlordNpcId`, a
 * scalar), not a relationship dimension, and `event-credential-recognized` tests a
 * *completed* course (`player.education.completedCourseIds`, a `string[]` that `contains`
 * resolves against), not one in progress — neither is a substitute for what was omitted.
 * `event-friend-needs-a-favor` and `event-tutor-offers-extra-session`, by contrast, *are*
 * satisfied: both now condition on their array's own `.length` — "has met at least one NPC,"
 * "has at least one enrollment record" — a real property that never throws, verified against
 * the pinned engine directly rather than inferred. `player.relationships.0.affinity` also
 * resolves and is still never used: §7.1 rejects that form because it names a specific NPC
 * by position, which silently changes identity on reordering. `.length` names no NPC at all,
 * so reordering cannot make it wrong — only ever weaker than the corpus's own per-item gate,
 * the same narrow-and-name pattern S16.5 already established for
 * `event-job-interview-invitation`. Each site names the narrowing per CP10; `design/90-
 * decisions.md`'s S21.5 entry carries the running total.
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
 * §9.1–§9.2, §16.1, §16.4 — four housing tiers, ascending along §9.2's progression from the
 * starting rented room through the cheap studio and decent apartment to the house.
 * `weeklyCostCents` rises strictly tier to tier (§18.2); comfort, safety, prestige and
 * storage rise with it, and `maintenanceRisk` — the damage-facing field §9.1 ties `damage`
 * accrual to — falls, on the premise that a better-built property needs less upkeep. None of
 * the four sets `quality`: §9.1 makes it a derived, read-only combination of comfort/safety
 * against current damage, and `HousingDefinition` (the engine's `content.ts`) carries no such
 * field to set.
 *
 * §16.4's five recurring weekly costs, by where each lands: **rent** is `weeklyCostCents`
 * below — the only one of the five `endOfWeek.ts`'s `housing()` step actually levies against
 * `cashCents`. **Utilities** and **transport** are omitted: no `HousingDefinition` field
 * carries either, and while `ItemDefinition.weeklyCostCents` exists, nothing in the engine's
 * end-of-week step reads it, so authoring transport onto an item would not charge anything
 * either. Named here per CP10 and tracked as issue #109.
 * **Groceries** and **poor-quality groceries** are out of this slice's scope — they are
 * items, and belong to S19.
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
  {
    id: "housing-cheap-studio",
    name: { key: "stable-life.housing.cheap-studio.name", text: "Cheap Studio" },
    description: {
      key: "stable-life.housing.cheap-studio.description",
      text: "One room, but it is the whole apartment, and nobody else's name is on the lease.",
    },
    upfrontCostCents: DOLLARS(100),
    weeklyCostCents: DOLLARS(150),
    capacity: 1,
    comfort: 45,
    safety: 55,
    prestige: 15,
    storage: 20,
    commuteModifier: 0,
    energyRecoveryModifier: 5,
    happinessModifier: 5,
    healthModifier: 0,
    maintenanceRisk: 15,
    requirements: [],
    tags: ["studio"],
  },
  {
    id: "housing-decent-apartment",
    name: { key: "stable-life.housing.decent-apartment.name", text: "Decent Apartment" },
    description: {
      key: "stable-life.housing.decent-apartment.description",
      text: "Enough rooms that guests no longer have to guess which pile is furniture.",
    },
    upfrontCostCents: DOLLARS(400),
    weeklyCostCents: DOLLARS(260),
    capacity: 2,
    comfort: 60,
    safety: 70,
    prestige: 30,
    storage: 35,
    commuteModifier: 0,
    energyRecoveryModifier: 10,
    happinessModifier: 10,
    healthModifier: 5,
    maintenanceRisk: 10,
    requirements: [],
    tags: ["apartment"],
  },
  {
    id: "housing-house",
    name: { key: "stable-life.housing.house.name", text: "House" },
    description: {
      key: "stable-life.housing.house.description",
      text: "Four walls, times more than one, and a lawn nobody asked for.",
    },
    upfrontCostCents: DOLLARS(800),
    weeklyCostCents: DOLLARS(420),
    capacity: 4,
    comfort: 75,
    safety: 80,
    prestige: 50,
    storage: 55,
    commuteModifier: 0,
    energyRecoveryModifier: 15,
    happinessModifier: 15,
    healthModifier: 10,
    maintenanceRisk: 8,
    requirements: [],
    tags: ["house"],
  },
];

/**
 * §16.1/§10 — the twenty purchasable items, covering 10 of §10.1's twelve categories. Every
 * `effects` entry targets `player.needs.*` or `calendar.committedTimeUnits` — the only
 * writable `Modifier` targets `validate.ts` allows — per §10.2; what §10.2 names that no such
 * target reaches is omitted per CP10 and recorded in the file header above.
 *
 * §16.4's two grocery lines are authored exactly: basic at $45 restoring satiety to full,
 * poor at $25 restoring satiety to full and costing 3 health. "Restores ... for a week" has
 * no literal `Modifier` — an item's effects apply every week it stays owned (`endOfWeek.ts`'s
 * `inventory` sync), not once — so `operation: "set"` is used for the literal number ("full"
 * = 100) rather than an `add` that would misstate a one-off top-up as a standing boost.
 */
const items: SimulationCampaignSource["items"] = [
  // --- Food (§10.1) ---------------------------------------------------------------------
  {
    id: "item-groceries-basic",
    name: { key: "stable-life.item.groceries-basic.name", text: "Basic Groceries" },
    description: {
      key: "stable-life.item.groceries-basic.description",
      text: "A week's worth of food, bought all at once so it is over with.",
    },
    category: "food",
    purchasePriceCents: DOLLARS(45),
    baseResaleValueCents: 0,
    effects: [{ target: "player.needs.satiety", operation: "set", value: 100, sourceId: "item-groceries-basic" }],
    stacking: "refresh",
    requirements: [],
    tags: ["food", "consumable"],
  },
  {
    id: "item-groceries-poor",
    name: { key: "stable-life.item.groceries-poor.name", text: "Bargain-Bin Groceries" },
    description: {
      key: "stable-life.item.groceries-poor.description",
      text: "Cheaper, and it shows. Full all the same, eventually regretted.",
    },
    category: "food",
    purchasePriceCents: DOLLARS(25),
    baseResaleValueCents: 0,
    effects: [
      { target: "player.needs.satiety", operation: "set", value: 100, sourceId: "item-groceries-poor" },
      { target: "player.needs.health", operation: "subtract", value: 3, sourceId: "item-groceries-poor" },
    ],
    stacking: "refresh",
    requirements: [],
    tags: ["food", "consumable"],
  },

  // --- Clothing (§10.1) — effects omitted, see file header --------------------------------
  {
    id: "item-work-uniform",
    name: { key: "stable-life.item.work-uniform.name", text: "Work Uniform" },
    description: {
      key: "stable-life.item.work-uniform.description",
      text: "§10.2's employability boost has nothing to write to. It still looks the part.",
    },
    category: "clothing",
    purchasePriceCents: DOLLARS(60),
    baseResaleValueCents: DOLLARS(10),
    effects: [],
    stacking: "refresh",
    requirements: [],
    tags: ["clothing"],
  },
  {
    id: "item-secondhand-coat",
    name: { key: "stable-life.item.secondhand-coat.name", text: "Secondhand Coat" },
    description: {
      key: "stable-life.item.secondhand-coat.description",
      text: "Someone else's winter, worn a second time.",
    },
    category: "clothing",
    purchasePriceCents: DOLLARS(22),
    baseResaleValueCents: DOLLARS(5),
    effects: [],
    stacking: "refresh",
    requirements: [],
    tags: ["clothing", "secondhand"],
  },

  // --- Furniture (§10.1) — §10.2's happiness/energy-recovery effect ------------------------
  {
    id: "item-secondhand-mattress",
    name: { key: "stable-life.item.secondhand-mattress.name", text: "Secondhand Mattress" },
    description: {
      key: "stable-life.item.secondhand-mattress.description",
      text: "An improvement over the floor, which was the previous mattress.",
    },
    category: "furniture",
    purchasePriceCents: DOLLARS(85),
    baseResaleValueCents: DOLLARS(15),
    effects: [{ target: "player.needs.energy", operation: "add", value: 4, sourceId: "item-secondhand-mattress" }],
    stacking: "refresh",
    requirements: [],
    tags: ["furniture"],
  },
  {
    id: "item-folding-desk",
    name: { key: "stable-life.item.folding-desk.name", text: "Folding Desk" },
    description: {
      key: "stable-life.item.folding-desk.description",
      text: "Somewhere to put things down that is not the floor.",
    },
    category: "furniture",
    purchasePriceCents: DOLLARS(45),
    baseResaleValueCents: DOLLARS(8),
    effects: [{ target: "player.needs.happiness", operation: "add", value: 2, sourceId: "item-folding-desk" }],
    stacking: "refresh",
    requirements: [],
    tags: ["furniture"],
  },
  {
    id: "item-threadbare-sofa",
    name: { key: "stable-life.item.threadbare-sofa.name", text: "Threadbare Sofa" },
    description: {
      key: "stable-life.item.threadbare-sofa.description",
      text: "Comfortable in the specific way that a chair someone gave up on is comfortable.",
    },
    category: "furniture",
    purchasePriceCents: DOLLARS(130),
    baseResaleValueCents: DOLLARS(20),
    effects: [{ target: "player.needs.happiness", operation: "add", value: 4, sourceId: "item-threadbare-sofa" }],
    stacking: "refresh",
    requirements: [],
    tags: ["furniture"],
  },

  // --- Appliances (§10.1) — §10.2's recurring-time-cost reduction --------------------------
  {
    id: "item-microwave",
    name: { key: "stable-life.item.microwave.name", text: "Microwave" },
    description: {
      key: "stable-life.item.microwave.description",
      text: "Cooking, in the sense that heating something up is cooking.",
    },
    category: "appliances",
    purchasePriceCents: DOLLARS(55),
    baseResaleValueCents: DOLLARS(10),
    effects: [{ target: "calendar.committedTimeUnits", operation: "subtract", value: 1, sourceId: "item-microwave" }],
    stacking: "refresh",
    requirements: [],
    tags: ["appliance"],
  },
  {
    id: "item-washing-machine",
    name: { key: "stable-life.item.washing-machine.name", text: "Washing Machine" },
    description: {
      key: "stable-life.item.washing-machine.description",
      text: "The laundromat, but it stays home.",
    },
    category: "appliances",
    purchasePriceCents: DOLLARS(220),
    baseResaleValueCents: DOLLARS(60),
    effects: [
      { target: "calendar.committedTimeUnits", operation: "subtract", value: 1, sourceId: "item-washing-machine" },
    ],
    stacking: "refresh",
    requirements: [],
    tags: ["appliance"],
  },

  // --- Electronics (§10.1) -----------------------------------------------------------------
  {
    id: "item-basic-computer",
    name: { key: "stable-life.item.basic-computer.name", text: "Basic Computer" },
    description: {
      key: "stable-life.item.basic-computer.description",
      text: "§10.2's remote-jobs-and-online-education unlock has nothing to write to.",
    },
    category: "electronics",
    purchasePriceCents: DOLLARS(300),
    baseResaleValueCents: DOLLARS(90),
    effects: [],
    stacking: "refresh",
    requirements: [],
    tags: ["electronics"],
  },
  {
    id: "item-prepaid-phone",
    name: { key: "stable-life.item.prepaid-phone.name", text: "Prepaid Phone" },
    description: {
      key: "stable-life.item.prepaid-phone.description",
      text: "Reachable, and one fewer thing to worry about forgetting.",
    },
    category: "electronics",
    purchasePriceCents: DOLLARS(40),
    baseResaleValueCents: DOLLARS(10),
    effects: [{ target: "player.needs.stress", operation: "subtract", value: 2, sourceId: "item-prepaid-phone" }],
    stacking: "refresh",
    requirements: [],
    tags: ["electronics"],
  },

  // --- Vehicles (§10.1) — durability and §10.3 maintenance (S19.3) -------------------------
  {
    id: "item-used-bicycle",
    name: { key: "stable-life.item.used-bicycle.name", text: "Used Bicycle" },
    description: {
      key: "stable-life.item.used-bicycle.description",
      text: "§10.2's travel-time reduction has nothing to write to. It still needs oiling.",
    },
    category: "vehicles",
    purchasePriceCents: DOLLARS(180),
    baseResaleValueCents: DOLLARS(60),
    effects: [],
    stacking: "refresh",
    durability: 100,
    maintenanceRules: [
      {
        intervalWeeks: 4,
        costCents: DOLLARS(15),
        timeCost: 1,
        conditionLossIfSkipped: 20,
        breakageChanceAtZeroCondition: 15,
      },
    ],
    requirements: [],
    tags: ["vehicle", "maintained"],
  },

  // --- Tools (§10.1) — §10.2's maintenance-check improvement has nothing to write to --------
  {
    id: "item-basic-toolkit",
    name: { key: "stable-life.item.basic-toolkit.name", text: "Basic Toolkit" },
    description: {
      key: "stable-life.item.basic-toolkit.description",
      text: "A wrench, a screwdriver, and the confidence that comes from owning them.",
    },
    category: "tools",
    purchasePriceCents: DOLLARS(50),
    baseResaleValueCents: DOLLARS(15),
    effects: [],
    stacking: "refresh",
    requirements: [],
    tags: ["tools"],
  },
  {
    id: "item-sewing-kit",
    name: { key: "stable-life.item.sewing-kit.name", text: "Sewing Kit" },
    description: {
      key: "stable-life.item.sewing-kit.description",
      text: "A needle, thread, and one button that never finds its shirt again.",
    },
    category: "tools",
    purchasePriceCents: DOLLARS(15),
    baseResaleValueCents: DOLLARS(3),
    effects: [],
    stacking: "refresh",
    requirements: [],
    tags: ["tools"],
  },

  // --- Medical items (§10.1) ----------------------------------------------------------------
  {
    id: "item-first-aid-kit",
    name: { key: "stable-life.item.first-aid-kit.name", text: "First Aid Kit" },
    description: {
      key: "stable-life.item.first-aid-kit.description",
      text: "Bandages, antiseptic, and the general sense that mistakes are now survivable.",
    },
    category: "medical-items",
    purchasePriceCents: DOLLARS(20),
    baseResaleValueCents: 0,
    effects: [{ target: "player.needs.health", operation: "add", value: 3, sourceId: "item-first-aid-kit" }],
    stacking: "refresh",
    requirements: [],
    tags: ["medical"],
  },
  {
    id: "item-otc-medicine",
    name: { key: "stable-life.item.otc-medicine.name", text: "Over-the-Counter Medicine" },
    description: {
      key: "stable-life.item.otc-medicine.description",
      text: "Takes the edge off. Reads nothing on the label about the actual cause.",
    },
    category: "medical-items",
    purchasePriceCents: DOLLARS(12),
    baseResaleValueCents: 0,
    effects: [{ target: "player.needs.health", operation: "add", value: 2, sourceId: "item-otc-medicine" }],
    stacking: "refresh",
    requirements: [],
    tags: ["medical"],
  },

  // --- Entertainment (§10.1) ----------------------------------------------------------------
  {
    id: "item-paperback-novel",
    name: { key: "stable-life.item.paperback-novel.name", text: "Paperback Novel" },
    description: {
      key: "stable-life.item.paperback-novel.description",
      text: "Somebody else's problems, bound and portable.",
    },
    category: "entertainment",
    purchasePriceCents: DOLLARS(8),
    baseResaleValueCents: DOLLARS(2),
    effects: [{ target: "player.needs.happiness", operation: "add", value: 2, sourceId: "item-paperback-novel" }],
    stacking: "refresh",
    requirements: [],
    tags: ["entertainment"],
  },
  {
    id: "item-secondhand-guitar",
    name: { key: "stable-life.item.secondhand-guitar.name", text: "Secondhand Acoustic Guitar" },
    description: {
      key: "stable-life.item.secondhand-guitar.description",
      text: "Three chords in, the neighbours already have opinions.",
    },
    category: "entertainment",
    purchasePriceCents: DOLLARS(70),
    baseResaleValueCents: DOLLARS(25),
    effects: [
      { target: "player.needs.happiness", operation: "add", value: 5, sourceId: "item-secondhand-guitar" },
      { target: "player.needs.stress", operation: "subtract", value: 2, sourceId: "item-secondhand-guitar" },
    ],
    stacking: "refresh",
    requirements: [],
    tags: ["entertainment"],
  },

  // --- Luxury goods (§10.1) — §10.2's "briefly improve happiness ... expensive clutter" -----
  {
    id: "item-impulse-espresso-machine",
    name: { key: "stable-life.item.impulse-espresso-machine.name", text: "Impulse-Bought Espresso Machine" },
    description: {
      key: "stable-life.item.impulse-espresso-machine.description",
      text: "Used twice. Beautiful. Taking up the whole counter.",
    },
    category: "luxury-goods",
    purchasePriceCents: DOLLARS(150),
    baseResaleValueCents: DOLLARS(40),
    effects: [
      {
        target: "player.needs.happiness",
        operation: "add",
        value: 6,
        sourceId: "item-impulse-espresso-machine",
      },
    ],
    stacking: "refresh",
    requirements: [],
    tags: ["luxury", "clutter"],
  },
  {
    id: "item-novelty-neon-sign",
    name: { key: "stable-life.item.novelty-neon-sign.name", text: "Novelty Neon Sign" },
    description: {
      key: "stable-life.item.novelty-neon-sign.description",
      text: "Says something in cursive. Hums all night.",
    },
    category: "luxury-goods",
    purchasePriceCents: DOLLARS(45),
    baseResaleValueCents: DOLLARS(10),
    effects: [{ target: "player.needs.happiness", operation: "add", value: 3, sourceId: "item-novelty-neon-sign" }],
    stacking: "refresh",
    requirements: [],
    tags: ["luxury", "clutter"],
  },
];

/**
 * §16.4's wage table, by tier. Cited once here rather than re-typed into each job's
 * `compensation`, so a rate change touches one place. Part-time pays 55% of the full-time
 * rate for 5 time units (§16.4); `JobDefinition` has no separate part-time variant, and
 * doubling the eight jobs S15.1 targets to author one would blow the §16.1 content count,
 * so the part-time figure stays a computed constant here rather than authored content.
 */
const WAGE_TABLE_CENTS: Record<"entry" | "skilled" | "professional" | "senior", number> = {
  entry: DOLLARS(210),
  skilled: DOLLARS(340),
  professional: DOLLARS(520),
  senior: DOLLARS(780),
};

/**
 * §3.5 — skills referenced by the job requirements below. Only the three actually named by
 * a requirement are authored; the rest of §3.5's example list is unclaimed content, not an
 * omission. Ids are bare (`cooking`, not `skill-cooking`) because `player.skills.<id>`
 * (`derived.ts`) keys directly off `SkillDefinition.id` — a prefix here would desync the id
 * from the field every requirement below reads it through.
 */
const skills: SimulationCampaignSource["skills"] = [
  {
    id: "cooking",
    name: { key: "stable-life.skill.cooking.name", text: "Cooking" },
    category: "trade",
    decayPerWeek: 0,
  },
  {
    id: "management",
    name: { key: "stable-life.skill.management.name", text: "Management" },
    category: "administrative",
    decayPerWeek: 0,
  },
  {
    id: "programming",
    name: { key: "stable-life.skill.programming.name", text: "Programming" },
    category: "technical",
    decayPerWeek: 0,
  },
];

/**
 * §16.4's education-cost table, by duration tier. Cited once here rather than re-typed into
 * each course, the same reason `WAGE_TABLE_CENTS` above exists — a rate change touches one
 * place. `CourseDefinition` (content.ts) carries no tier field of its own; these three keys
 * are local to this file and exist only to group the six courses onto the table's three rows.
 */
const EDUCATION_COST_TABLE: Record<
  "short" | "vocational" | "degree",
  { tuitionCents: number; durationWeeks: number; weeklyTimeCost: number }
> = {
  short: { tuitionCents: DOLLARS(340), durationWeeks: 8, weeklyTimeCost: 3 },
  vocational: { tuitionCents: DOLLARS(900), durationWeeks: 16, weeklyTimeCost: 4 },
  degree: { tuitionCents: DOLLARS(1600), durationWeeks: 24, weeklyTimeCost: 5 },
};

/**
 * §7.1/§16.1 — the six courses, each a distinct §7.1 education type (carried as a tag, the
 * same mechanism S16.2 used for event types — `CourseDefinition` has no dedicated type
 * field). Every one prices from `EDUCATION_COST_TABLE` exactly (§16.4, S17.2); two courses
 * share the vocational tier and two share the short tier, the same way S15's jobs shared a
 * wage-table tier across career paths. `providerId` has no matching collection in
 * `SimulationCampaignSource` — it is a free descriptive string, not a foreign key.
 *
 * Where a reward references a skill, it is one S15 already authored (`cooking`,
 * `management`, `programming`) and its value is chosen to meaningfully close the gap toward
 * that skill's job or promotion requirement — §7.3's "job eligibility" reward, made concrete.
 */
const courses: SimulationCampaignSource["courses"] = [
  // §7.1 "High-school equivalency" — short tier.
  {
    id: "course-high-school-equivalency",
    name: {
      key: "stable-life.course.high-school-equivalency.name",
      text: "High-School Equivalency",
    },
    description: {
      key: "stable-life.course.high-school-equivalency.description",
      text: "Eight weeks to a piece of paper the last one should have already provided.",
    },
    providerId: "provider-community-college",
    ...EDUCATION_COST_TABLE.short,
    difficulty: 25,
    requirements: [],
    rewards: [{ type: "attribute", target: "player.attributes.intelligence", value: 5 }],
    awardsCredential: "school",
    failureRules: {
      minimumAttendanceRatio: 70,
      minimumStudyUnitsPerWeek: 1,
      maximumMissedSessions: 3,
      tuitionGraceWeeks: 1,
      progressRetainedOnFailure: 40,
    },
    tags: ["high-school-equivalency"],
  },
  // §7.1 "Night classes" — short tier.
  {
    id: "course-night-class-supervision",
    name: {
      key: "stable-life.course.night-class-supervision.name",
      text: "Night Class: Basic Supervision",
    },
    description: {
      key: "stable-life.course.night-class-supervision.description",
      text: "Two evenings a week, a whiteboard, and the beginnings of telling other people what to do.",
    },
    providerId: "provider-community-college",
    ...EDUCATION_COST_TABLE.short,
    difficulty: 20,
    requirements: [],
    rewards: [{ type: "skill", target: "player.skills.management", value: 10 }],
    failureRules: {
      minimumAttendanceRatio: 70,
      minimumStudyUnitsPerWeek: 1,
      maximumMissedSessions: 3,
      tuitionGraceWeeks: 1,
      progressRetainedOnFailure: 40,
    },
    tags: ["night-classes"],
  },
  // §7.1 "Vocational certificates" — vocational tier. §6.2's cooking requirement for
  // job-line-cook is the same field this course's reward moves.
  {
    id: "course-vocational-certificate-culinary",
    name: {
      key: "stable-life.course.vocational-certificate-culinary.name",
      text: "Vocational Certificate: Culinary Trade",
    },
    description: {
      key: "stable-life.course.vocational-certificate-culinary.description",
      text: "Sixteen weeks of a working kitchen, minus the part where anyone pays you for it yet.",
    },
    providerId: "provider-community-college",
    ...EDUCATION_COST_TABLE.vocational,
    difficulty: 45,
    requirements: [],
    rewards: [{ type: "skill", target: "player.skills.cooking", value: 20 }],
    awardsCredential: "certificate",
    failureRules: {
      minimumAttendanceRatio: 75,
      minimumStudyUnitsPerWeek: 2,
      maximumMissedSessions: 4,
      tuitionGraceWeeks: 2,
      maximumStress: 80,
      progressRetainedOnFailure: 50,
    },
    tags: ["vocational-certificates"],
  },
  // §7.1 "Professional certifications" — vocational tier. §6.2's programming requirement
  // for job-systems-administrator is the same field this course's reward moves.
  {
    id: "course-professional-certification-it",
    name: {
      key: "stable-life.course.professional-certification-it.name",
      text: "Professional Certification: Entry IT",
    },
    description: {
      key: "stable-life.course.professional-certification-it.description",
      text: "Sixteen weeks, a proctored exam, and a certificate suitable for framing or for nothing.",
    },
    providerId: "provider-professional-institute",
    ...EDUCATION_COST_TABLE.vocational,
    difficulty: 50,
    requirements: [],
    rewards: [{ type: "skill", target: "player.skills.programming", value: 20 }],
    awardsCredential: "certificate",
    failureRules: {
      minimumAttendanceRatio: 75,
      minimumStudyUnitsPerWeek: 2,
      maximumMissedSessions: 4,
      tuitionGraceWeeks: 2,
      maximumStress: 80,
      progressRetainedOnFailure: 50,
    },
    tags: ["professional-certifications"],
  },
  // §7.1 "University degrees" — degree tier, authored as one module per §16.4's own naming
  // ("Degree module"), not a full multi-year degree.
  {
    id: "course-university-degree-module-management",
    name: {
      key: "stable-life.course.university-degree-module-management.name",
      text: "University Degree Module: Management",
    },
    description: {
      key: "stable-life.course.university-degree-module-management.description",
      text: "Twenty-four weeks, one module of a longer degree, and the most expensive line item this scenario offers.",
    },
    providerId: "provider-state-university",
    ...EDUCATION_COST_TABLE.degree,
    difficulty: 65,
    requirements: [],
    rewards: [{ type: "skill", target: "player.skills.management", value: 30 }],
    awardsCredential: "degree",
    failureRules: {
      minimumAttendanceRatio: 80,
      minimumStudyUnitsPerWeek: 3,
      maximumMissedSessions: 5,
      tuitionGraceWeeks: 3,
      maximumStress: 85,
      progressRetainedOnFailure: 55,
    },
    tags: ["university-degrees"],
  },
  // §7.1 "Questionable motivational seminars" — degree tier, priced and scheduled as the
  // corpus's own joke: the most expensive, longest-running course, and the one that grants
  // nothing a credential column can name.
  {
    id: "course-questionable-motivational-seminar",
    name: {
      key: "stable-life.course.questionable-motivational-seminar.name",
      text: "Peak Potential: A Twenty-Four-Week Journey",
    },
    description: {
      key: "stable-life.course.questionable-motivational-seminar.description",
      text: "Nobody has ever explained what week nine covers. Week nine attendees have stopped asking.",
    },
    providerId: "provider-peak-potential-seminars",
    ...EDUCATION_COST_TABLE.degree,
    difficulty: 10,
    requirements: [],
    rewards: [{ type: "attribute", target: "player.attributes.charisma", value: 5 }],
    failureRules: {
      minimumAttendanceRatio: 50,
      minimumStudyUnitsPerWeek: 1,
      maximumMissedSessions: 8,
      tuitionGraceWeeks: 0,
      progressRetainedOnFailure: 20,
    },
    tags: ["questionable-motivational-seminars"],
  },
];

/**
 * §16.1 — the eight jobs, in the three §16.1 career paths. Titles for two of the three
 * paths are §6.6's own worked examples verbatim (the third, `career-retail`, is its first
 * rung only — an eight-job budget across three paths does not stretch to all of every
 * example chain). Tiers are §6.1's four names; `professional`/`senior` postings are
 * `contested: true` per §6.4's "finite and competed for. See §14.3."
 */
const jobs: SimulationCampaignSource["jobs"] = [
  // career-food-service — §6.6's first example chain, first three rungs.
  {
    id: "job-dishwasher",
    title: { key: "stable-life.job.dishwasher.title", text: "Dishwasher" },
    description: {
      key: "stable-life.job.dishwasher.description",
      text: "Entry tier. No credential required, per §6.1 — just a sink and a willingness.",
    },
    employerId: "employer-greasy-spoon-diner",
    careerPathId: "career-food-service",
    tier: "entry",
    schedule: { weeklyTimeCost: 10, flexibility: 10 },
    compensation: { baseWeeklyPayCents: WAGE_TABLE_CENTS.entry },
    requirements: [],
    performance: { factors: [], weeklyDriftToward: 50, minimumAcceptable: 30 },
    promotionPaths: [
      {
        toJobId: "job-line-cook",
        minimumWeeksInRole: 8,
        minimumPerformance: 40,
        requirements: [],
        contested: false,
        baseChance: 85,
      },
    ],
    terminationRules: [],
    contested: false,
    tags: ["career-food-service"],
  },
  {
    id: "job-line-cook",
    title: { key: "stable-life.job.line-cook.title", text: "Line Cook" },
    description: {
      key: "stable-life.job.line-cook.description",
      text: "Skilled tier — §6.1's \"demonstrated skill\" is the Cooking skill, per §6.2's requirements list.",
    },
    employerId: "employer-greasy-spoon-diner",
    careerPathId: "career-food-service",
    tier: "skilled",
    schedule: { weeklyTimeCost: 9, flexibility: 20 },
    compensation: { baseWeeklyPayCents: WAGE_TABLE_CENTS.skilled },
    requirements: [
      {
        type: "skill",
        condition: { field: "player.skills.cooking", operator: "greater_or_equal", value: 25 },
        failureCode: "requirement_unmet",
        messageKey: "stable-life.job.line-cook.requirement.cooking",
      },
    ],
    performance: { factors: [], weeklyDriftToward: 50, minimumAcceptable: 30 },
    promotionPaths: [
      {
        toJobId: "job-shift-supervisor",
        minimumWeeksInRole: 12,
        minimumPerformance: 55,
        requirements: [
          {
            type: "skill",
            condition: { field: "player.skills.management", operator: "greater_or_equal", value: 40 },
            failureCode: "requirement_unmet",
            messageKey: "stable-life.job.shift-supervisor.requirement.management",
          },
        ],
        contested: true,
        baseChance: 50,
      },
    ],
    terminationRules: [],
    contested: false,
    tags: ["career-food-service"],
  },
  {
    id: "job-shift-supervisor",
    title: { key: "stable-life.job.shift-supervisor.title", text: "Shift Supervisor" },
    description: {
      key: "stable-life.job.shift-supervisor.description",
      text: "Professional tier. §6.4: open positions here are finite and competed for.",
    },
    employerId: "employer-greasy-spoon-diner",
    careerPathId: "career-food-service",
    tier: "professional",
    schedule: { weeklyTimeCost: 8, flexibility: 30 },
    compensation: { baseWeeklyPayCents: WAGE_TABLE_CENTS.professional },
    requirements: [
      {
        type: "skill",
        condition: { field: "player.skills.management", operator: "greater_or_equal", value: 40 },
        failureCode: "requirement_unmet",
        messageKey: "stable-life.job.shift-supervisor.requirement.management",
      },
    ],
    performance: { factors: [], weeklyDriftToward: 50, minimumAcceptable: 30 },
    promotionPaths: [],
    terminationRules: [],
    contested: true,
    positionsAvailable: 2,
    tags: ["career-food-service"],
  },

  // career-clerical — §6.6's second example chain, in full, including its own joke title.
  {
    id: "job-data-entry-clerk",
    title: { key: "stable-life.job.data-entry-clerk.title", text: "Data Entry Clerk" },
    description: {
      key: "stable-life.job.data-entry-clerk.description",
      text: "Entry tier. No credential required, per §6.1.",
    },
    employerId: "employer-civic-data-office",
    careerPathId: "career-clerical",
    tier: "entry",
    schedule: { weeklyTimeCost: 10, flexibility: 10 },
    compensation: { baseWeeklyPayCents: WAGE_TABLE_CENTS.entry },
    requirements: [],
    performance: { factors: [], weeklyDriftToward: 50, minimumAcceptable: 30 },
    promotionPaths: [
      {
        toJobId: "job-systems-administrator",
        minimumWeeksInRole: 8,
        minimumPerformance: 40,
        requirements: [],
        contested: false,
        baseChance: 85,
      },
    ],
    terminationRules: [],
    contested: false,
    tags: ["career-clerical"],
  },
  {
    id: "job-systems-administrator",
    title: { key: "stable-life.job.systems-administrator.title", text: "Systems Administrator" },
    description: {
      key: "stable-life.job.systems-administrator.description",
      text: "Skilled tier — §6.1's \"demonstrated skill\" is the Programming skill, per §6.2.",
    },
    employerId: "employer-civic-data-office",
    careerPathId: "career-clerical",
    tier: "skilled",
    schedule: { weeklyTimeCost: 9, flexibility: 25 },
    compensation: { baseWeeklyPayCents: WAGE_TABLE_CENTS.skilled },
    requirements: [
      {
        type: "skill",
        condition: { field: "player.skills.programming", operator: "greater_or_equal", value: 25 },
        failureCode: "requirement_unmet",
        messageKey: "stable-life.job.systems-administrator.requirement.programming",
      },
    ],
    performance: { factors: [], weeklyDriftToward: 50, minimumAcceptable: 30 },
    promotionPaths: [
      {
        toJobId: "job-infrastructure-engineer",
        minimumWeeksInRole: 12,
        minimumPerformance: 55,
        requirements: [
          {
            type: "skill",
            condition: { field: "player.skills.programming", operator: "greater_or_equal", value: 55 },
            failureCode: "requirement_unmet",
            messageKey: "stable-life.job.infrastructure-engineer.requirement.programming",
          },
        ],
        contested: true,
        baseChance: 55,
      },
    ],
    terminationRules: [],
    contested: false,
    tags: ["career-clerical"],
  },
  {
    id: "job-infrastructure-engineer",
    title: { key: "stable-life.job.infrastructure-engineer.title", text: "Infrastructure Engineer" },
    description: {
      key: "stable-life.job.infrastructure-engineer.description",
      text: "Professional tier. §6.4: open positions here are finite and competed for.",
    },
    employerId: "employer-civic-data-office",
    careerPathId: "career-clerical",
    tier: "professional",
    schedule: { weeklyTimeCost: 8, flexibility: 35 },
    compensation: { baseWeeklyPayCents: WAGE_TABLE_CENTS.professional },
    requirements: [
      {
        type: "skill",
        condition: { field: "player.skills.programming", operator: "greater_or_equal", value: 55 },
        failureCode: "requirement_unmet",
        messageKey: "stable-life.job.infrastructure-engineer.requirement.programming",
      },
    ],
    performance: { factors: [], weeklyDriftToward: 50, minimumAcceptable: 30 },
    promotionPaths: [
      {
        toJobId: "job-wifi-scapegoat",
        minimumWeeksInRole: 16,
        minimumPerformance: 65,
        requirements: [],
        contested: true,
        baseChance: 35,
      },
    ],
    terminationRules: [],
    contested: true,
    positionsAvailable: 2,
    tags: ["career-clerical"],
  },
  {
    id: "job-wifi-scapegoat",
    title: { key: "stable-life.job.wifi-scapegoat.title", text: "Person Blamed When Wi-Fi Stops" },
    description: {
      key: "stable-life.job.wifi-scapegoat.description",
      text: "Senior tier — §6.1: scarce, track record plus reputation. §6.6's own joke ending for this chain.",
    },
    employerId: "employer-civic-data-office",
    careerPathId: "career-clerical",
    tier: "senior",
    schedule: { weeklyTimeCost: 8, flexibility: 40 },
    compensation: { baseWeeklyPayCents: WAGE_TABLE_CENTS.senior },
    requirements: [],
    performance: { factors: [], weeklyDriftToward: 50, minimumAcceptable: 30 },
    promotionPaths: [],
    terminationRules: [],
    contested: true,
    positionsAvailable: 1,
    tags: ["career-clerical"],
  },

  // career-retail — §6.6's third example chain, first rung only (see file-level note above).
  {
    id: "job-retail-associate",
    title: { key: "stable-life.job.retail-associate.title", text: "Retail Associate" },
    description: {
      key: "stable-life.job.retail-associate.description",
      text: "Entry tier. No credential required, per §6.1.",
    },
    employerId: "employer-bright-mart-retail",
    careerPathId: "career-retail",
    tier: "entry",
    schedule: { weeklyTimeCost: 10, flexibility: 15 },
    compensation: { baseWeeklyPayCents: WAGE_TABLE_CENTS.entry },
    requirements: [],
    performance: { factors: [], weeklyDriftToward: 50, minimumAcceptable: 30 },
    promotionPaths: [],
    terminationRules: [],
    contested: false,
    tags: ["career-retail"],
  },
];

/** §6 names no field this pinned engine cannot express — `Requirement`, `PerformanceFactor`,
 *  `PromotionPath` and `TerminationRule` already cover §6.2–§6.5 in full. Nothing is omitted
 *  here under CP10; the empty `performance.factors` and `terminationRules` above are this
 *  slice's own scope choice (S16 is where weeks, and job outcomes within them, start going
 *  wrong on their own), not an engine gap. */

/**
 * §16.1/§6 — the three employers the eight jobs above name. `npcIds` now names the S20 NPCs
 * attached to each; `employer-bright-mart-retail` stays empty — not every employer needs one.
 */
const employers: SimulationCampaignSource["employers"] = [
  {
    id: "employer-greasy-spoon-diner",
    name: { key: "stable-life.employer.greasy-spoon-diner.name", text: "The Greasy Spoon Diner" },
    sector: "food-service",
    reputation: 40,
    jobIds: ["job-dishwasher", "job-line-cook", "job-shift-supervisor"],
    npcIds: ["npc-diner-manager"],
  },
  {
    id: "employer-civic-data-office",
    name: { key: "stable-life.employer.civic-data-office.name", text: "Civic Data Office" },
    sector: "clerical",
    reputation: 55,
    jobIds: ["job-data-entry-clerk", "job-systems-administrator", "job-infrastructure-engineer", "job-wifi-scapegoat"],
    npcIds: ["npc-civic-office-coworker"],
  },
  {
    id: "employer-bright-mart-retail",
    name: { key: "stable-life.employer.bright-mart-retail.name", text: "BrightMart Retail" },
    sector: "retail",
    reputation: 50,
    jobIds: ["job-retail-associate"],
    npcIds: [],
  },
];

/**
 * §12/§16.1 — the eight NPCs, covering 7 of §12.2's fourteen roles (manager, coworker,
 * landlord, teacher, friend, lender, government employee — one over S20.1's target of 6).
 * Every `initialRelationship` is authored within `0`–`100`; the file header above explains
 * why that is this campaign's own convention rather than a number `03` §12.1 states.
 * `availability` places each at one of §16.2's eight locations. Every id below is bare
 * (`npc-<descriptor>`), matching the natural-key convention every other collection uses.
 */
const npcs: SimulationCampaignSource["npcs"] = [
  // §12.2 "Managers" — attached to employer-greasy-spoon-diner via its npcIds above.
  {
    id: "npc-diner-manager",
    name: { key: "stable-life.npc.diner-manager.name", text: "Deb" },
    description: {
      key: "stable-life.npc.diner-manager.description",
      text: "Runs the floor at the Greasy Spoon. Remembers who showed up for the double shift.",
    },
    defaultRole: "manager",
    initialRelationship: { affinity: 40, trust: 35, respect: 30, resentment: 10 },
    availability: [{ locationId: "workplace" }],
    tags: [],
  },
  // §12.2 "Coworkers" — attached to employer-civic-data-office via its npcIds above.
  {
    id: "npc-civic-office-coworker",
    name: { key: "stable-life.npc.civic-office-coworker.name", text: "Marcus" },
    description: {
      key: "stable-life.npc.civic-office-coworker.description",
      text: "Two desks over at the Civic Data Office. Knows exactly how long lunch can stretch.",
    },
    defaultRole: "coworker",
    initialRelationship: { affinity: 55, trust: 50, respect: 45, resentment: 5 },
    availability: [{ locationId: "workplace" }],
    tags: [],
  },
  // §12.2 "Landlords" — attached to housing-rented-room by tag; see the file header for why
  // this is a tag rather than a field.
  {
    id: "npc-landlord-rented-room",
    name: { key: "stable-life.npc.landlord-rented-room.name", text: "Mrs. Okafor" },
    description: {
      key: "stable-life.npc.landlord-rented-room.description",
      text: "Owns the rented room and three others like it. Collects rent in person, on principle.",
    },
    defaultRole: "landlord",
    initialRelationship: { affinity: 25, trust: 30, respect: 20, resentment: 15 },
    availability: [{ locationId: "home" }],
    tags: ["housing-rented-room"],
  },
  // §12.2 "Teachers".
  {
    id: "npc-community-college-teacher",
    name: { key: "stable-life.npc.community-college-teacher.name", text: "Mr. Alavi" },
    description: {
      key: "stable-life.npc.community-college-teacher.description",
      text: "Teaches whichever course is short a room. Grades on attendance more than he admits.",
    },
    defaultRole: "teacher",
    initialRelationship: { affinity: 45, trust: 40, respect: 50, resentment: 0 },
    availability: [{ locationId: "community-college" }],
    tags: [],
  },
  // §12.2 "Friends".
  {
    id: "npc-old-friend",
    name: { key: "stable-life.npc.old-friend.name", text: "Priya" },
    description: {
      key: "stable-life.npc.old-friend.description",
      text: "Known since before any of this started. Still shows up at the recreation area on a bad week.",
    },
    defaultRole: "friend",
    initialRelationship: { affinity: 70, trust: 65, respect: 55, resentment: 0 },
    availability: [{ locationId: "recreation-area" }],
    tags: [],
  },
  // §12.2 "Lenders".
  {
    id: "npc-bank-loan-officer",
    name: { key: "stable-life.npc.bank-loan-officer.name", text: "Mr. Petrov" },
    description: {
      key: "stable-life.npc.bank-loan-officer.description",
      text: "Approves the borrowing and reviews the repaying. Reads the fine print out loud, slowly.",
    },
    defaultRole: "lender",
    initialRelationship: { affinity: 20, trust: 25, respect: 20, resentment: 5 },
    availability: [{ locationId: "bank" }],
    tags: [],
  },
  // §12.2 "Government employees".
  {
    id: "npc-forms-clerk",
    name: { key: "stable-life.npc.forms-clerk.name", text: "Ms. Dinh" },
    description: {
      key: "stable-life.npc.forms-clerk.description",
      text: "Stamps the forms at the Department of Forms. Has seen every version of this form fail before.",
    },
    defaultRole: "government-employee",
    initialRelationship: { affinity: 15, trust: 20, respect: 15, resentment: 10 },
    availability: [{ locationId: "department-of-forms" }],
    tags: [],
  },
  // §12.2 "Neighbors".
  {
    id: "npc-next-door-neighbor",
    name: { key: "stable-life.npc.next-door-neighbor.name", text: "Tomasz" },
    description: {
      key: "stable-life.npc.next-door-neighbor.description",
      text: "Lives one door down. Borrows things and, to be fair, returns most of them.",
    },
    defaultRole: "neighbor",
    initialRelationship: { affinity: 35, trust: 30, respect: 25, resentment: 5 },
    availability: [{ locationId: "home" }],
    tags: [],
  },
];

/**
 * §16.1's random events — all 30 targeted. The first 15 (S16) are drawn from seven of
 * `03` §11.1's fourteen categories: employment, economy, purchases, crime, bureaucracy,
 * transportation, business. The 15 after them (S21) are drawn from the remaining seven:
 * housing, health, relationships, education, weather, opportunity, pure absurdity. Every
 * one of the fourteen appears at least once (S16.1, S21.1, S21.2).
 *
 * §11.2 names ten event *types*, but `EventDefinition` (`content.ts`) has no dedicated type
 * field — the closest fit already in the schema is `tags`, the same mechanism S15 used to
 * carry a job's career path outside its own strict schema. Every event below carries exactly
 * one type tag, kebab-cased from §11.2 (S16.2).
 *
 * `Modifier.target` is restricted at validation time to `player.needs.*`,
 * `player.attributes.*`, `player.skills.*`, and `calendar.committedTimeUnits`
 * (`validate.ts`'s `WRITABLE_TARGET_PREFIXES`) — every cash effect below is therefore a
 * `Reward` of type `"money"`, never a `Modifier`, since `player.finances.cashCents` is not a
 * writable Modifier target.
 */
const events: SimulationCampaignSource["events"] = [
  // --- Employment ---------------------------------------------------------------------
  {
    id: "event-shift-schedule-cut",
    category: "employment",
    title: { key: "stable-life.event.shift-schedule-cut.title", text: "Shift Cut Short" },
    description: {
      key: "stable-life.event.shift-schedule-cut.description",
      text: "The schedule changes and a shift disappears from under you. The rent does not follow suit.",
    },
    weight: 12,
    // S16.3 — conditional on a job the player holds. Comparing the whole optional
    // `currentEmployment` object against `value: undefined` (documented in
    // `core/condition/types.ts`) reads it in one hop; walking to `.jobId` beyond it would
    // throw on an unemployed player, per `conditions.ts`'s generic per-segment walk.
    conditions: { field: "player.career.currentEmployment", operator: "not_equals", value: undefined },
    automaticOutcome: {
      effects: [
        { target: "player.needs.stress", operation: "add", value: 6, sourceId: "event-shift-schedule-cut" },
      ],
      rewards: [{ type: "money", target: "player.finances.cashCents", value: -DOLLARS(40) }],
      messages: [
        { key: "stable-life.event.shift-schedule-cut.outcome.message", visible: true, tone: "negative" },
      ],
    },
    tags: ["conditional"],
  },
  {
    id: "event-surprise-bonus",
    category: "employment",
    title: { key: "stable-life.event.surprise-bonus.title", text: "Surprise Bonus" },
    description: {
      key: "stable-life.event.surprise-bonus.description",
      text: "The till balanced for once, and some of the difference lands in your pay.",
    },
    weight: 6,
    // S16.3 — the second example of the job-held condition (S16.3 only requires one; this
    // is a second, unforced instance).
    conditions: { field: "player.career.currentEmployment", operator: "not_equals", value: undefined },
    automaticOutcome: {
      effects: [
        { target: "player.needs.happiness", operation: "add", value: 8, sourceId: "event-surprise-bonus" },
      ],
      rewards: [{ type: "money", target: "player.finances.cashCents", value: DOLLARS(50) }],
      messages: [{ key: "stable-life.event.surprise-bonus.outcome.message", visible: true, tone: "positive" }],
    },
    tags: ["conditional"],
  },
  {
    id: "event-job-interview-invitation",
    category: "employment",
    title: { key: "stable-life.event.job-interview-invitation.title", text: "Interview Invitation" },
    description: {
      key: "stable-life.event.job-interview-invitation.description",
      text: "Someone read the application after all, and wants to meet the person who wrote it.",
    },
    weight: 10,
    // S16.5 — `03` §11.3 would gate this on a `count` over `player.career.pendingApplications`
    // (has the player actually applied anywhere?). `count`/`exists` throw in this pinned
    // engine (`conditions.ts`'s `unresolvableCollection`), so that quantifier is omitted;
    // the condition narrows to "currently unemployed" only, which is a strictly weaker gate
    // than the corpus intends. Named here rather than worked around, per CP10.
    conditions: { field: "player.career.currentEmployment", operator: "equals", value: undefined },
    choices: [
      {
        id: "attend-interview",
        labelKey: "stable-life.event.job-interview-invitation.choice.attend-interview",
        timeCost: 3,
        outcomes: [
          {
            outcome: {
              effects: [
                {
                  target: "player.needs.stress",
                  operation: "add",
                  value: 5,
                  sourceId: "event-job-interview-invitation",
                },
              ],
              rewards: [],
              messages: [
                {
                  key: "stable-life.event.job-interview-invitation.outcome.attended",
                  visible: true,
                  tone: "neutral",
                },
              ],
            },
          },
        ],
      },
      {
        id: "skip-interview",
        labelKey: "stable-life.event.job-interview-invitation.choice.skip-interview",
        outcomes: [
          {
            outcome: {
              effects: [],
              rewards: [],
              messages: [
                {
                  key: "stable-life.event.job-interview-invitation.outcome.skipped",
                  visible: true,
                  tone: "neutral",
                },
              ],
            },
          },
        ],
      },
    ],
    tags: ["conditional"],
  },

  // --- Economy -------------------------------------------------------------------------
  {
    id: "event-inflation-adjustment",
    category: "economy",
    title: { key: "stable-life.event.inflation-adjustment.title", text: "Prices Creep Up" },
    description: {
      key: "stable-life.event.inflation-adjustment.description",
      text: "Nothing on the shelf changed except the number under it.",
    },
    weight: 15,
    conditions: { all: [] },
    automaticOutcome: {
      effects: [
        { target: "player.needs.stress", operation: "add", value: 3, sourceId: "event-inflation-adjustment" },
      ],
      rewards: [{ type: "money", target: "player.finances.cashCents", value: -DOLLARS(15) }],
      messages: [
        { key: "stable-life.event.inflation-adjustment.outcome.message", visible: true, tone: "negative" },
      ],
    },
    tags: ["world-triggered"],
  },
  {
    id: "event-hardship-relief-payment",
    category: "economy",
    title: { key: "stable-life.event.hardship-relief-payment.title", text: "Hardship Relief Payment" },
    description: {
      key: "stable-life.event.hardship-relief-payment.description",
      text: "A form filed months ago is finally worth something.",
    },
    weight: 5,
    unique: true,
    // S16.3 — conditional on the player's cash.
    conditions: { field: "player.finances.cashCents", operator: "less_than", value: DOLLARS(50) },
    automaticOutcome: {
      effects: [
        {
          target: "player.needs.happiness",
          operation: "add",
          value: 5,
          sourceId: "event-hardship-relief-payment",
        },
      ],
      rewards: [{ type: "money", target: "player.finances.cashCents", value: DOLLARS(80) }],
      messages: [
        { key: "stable-life.event.hardship-relief-payment.outcome.message", visible: true, tone: "positive" },
      ],
    },
    tags: ["unique"],
  },

  // --- Purchases -----------------------------------------------------------------------
  {
    id: "event-appliance-breaks",
    category: "purchases",
    title: { key: "stable-life.event.appliance-breaks.title", text: "The Fridge Dies" },
    description: {
      key: "stable-life.event.appliance-breaks.description",
      text: "It gives one last hum and stops. Everything in it has opinions about that now.",
    },
    weight: 10,
    conditions: { all: [] },
    automaticOutcome: {
      effects: [
        { target: "player.needs.stress", operation: "add", value: 4, sourceId: "event-appliance-breaks" },
      ],
      rewards: [{ type: "money", target: "player.finances.cashCents", value: -DOLLARS(35) }],
      messages: [{ key: "stable-life.event.appliance-breaks.outcome.message", visible: true, tone: "negative" }],
    },
    tags: ["immediate"],
  },
  {
    id: "event-limited-time-sale",
    category: "purchases",
    title: { key: "stable-life.event.limited-time-sale.title", text: "Limited-Time Sale" },
    description: {
      key: "stable-life.event.limited-time-sale.description",
      text: "A sign in the window insists this will never happen again. It happened last month too.",
    },
    weight: 8,
    conditions: { all: [] },
    choices: [
      {
        id: "buy-now",
        labelKey: "stable-life.event.limited-time-sale.choice.buy-now",
        moneyCostCents: DOLLARS(20),
        outcomes: [
          {
            outcome: {
              effects: [
                {
                  target: "player.needs.happiness",
                  operation: "add",
                  value: 4,
                  sourceId: "event-limited-time-sale",
                },
              ],
              rewards: [],
              messages: [
                { key: "stable-life.event.limited-time-sale.outcome.bought", visible: true, tone: "positive" },
              ],
            },
          },
        ],
      },
      {
        id: "skip-sale",
        labelKey: "stable-life.event.limited-time-sale.choice.skip-sale",
        outcomes: [
          {
            outcome: {
              effects: [],
              rewards: [],
              messages: [
                { key: "stable-life.event.limited-time-sale.outcome.skipped", visible: true, tone: "neutral" },
              ],
            },
          },
        ],
      },
    ],
    tags: ["repeatable"],
  },

  // --- Crime ---------------------------------------------------------------------------
  {
    id: "event-pickpocketed",
    category: "crime",
    title: { key: "stable-life.event.pickpocketed.title", text: "Pickpocketed" },
    description: {
      key: "stable-life.event.pickpocketed.description",
      text: "A crowd, a jostle, and a lighter pocket than you started the day with.",
    },
    weight: 6,
    // S16.3 — a second, distinct example of a cash-conditional event (S16.3 only requires
    // one; this one gates on cash being present at all rather than below a threshold).
    conditions: { field: "player.finances.cashCents", operator: "greater_than", value: 0 },
    automaticOutcome: {
      effects: [{ target: "player.needs.stress", operation: "add", value: 8, sourceId: "event-pickpocketed" }],
      rewards: [{ type: "money", target: "player.finances.cashCents", value: -DOLLARS(20) }],
      messages: [{ key: "stable-life.event.pickpocketed.outcome.message", visible: true, tone: "negative" }],
    },
    tags: ["conditional"],
  },
  {
    id: "event-mugging-attempt",
    category: "crime",
    title: { key: "stable-life.event.mugging-attempt.title", text: "Mugging Attempt" },
    description: {
      key: "stable-life.event.mugging-attempt.description",
      text: "Someone blocks the alley shortcut and asks, not very politely, for your wallet.",
    },
    weight: 4,
    conditions: { all: [] },
    choices: [
      {
        id: "hand-over-wallet",
        labelKey: "stable-life.event.mugging-attempt.choice.hand-over-wallet",
        outcomes: [
          {
            outcome: {
              effects: [
                { target: "player.needs.stress", operation: "add", value: 10, sourceId: "event-mugging-attempt" },
              ],
              rewards: [{ type: "money", target: "player.finances.cashCents", value: -DOLLARS(30) }],
              messages: [
                {
                  key: "stable-life.event.mugging-attempt.outcome.handed-over",
                  visible: true,
                  tone: "negative",
                },
              ],
            },
          },
        ],
      },
      {
        id: "run-away",
        labelKey: "stable-life.event.mugging-attempt.choice.run-away",
        outcomes: [
          {
            outcome: {
              effects: [
                { target: "player.needs.stress", operation: "add", value: 6, sourceId: "event-mugging-attempt" },
                { target: "player.needs.energy", operation: "subtract", value: 5, sourceId: "event-mugging-attempt" },
              ],
              rewards: [],
              messages: [
                { key: "stable-life.event.mugging-attempt.outcome.ran-away", visible: true, tone: "neutral" },
              ],
            },
          },
        ],
      },
    ],
    tags: ["world-triggered"],
  },

  // --- Bureaucracy — a two-step chain (03 §11.6) ----------------------------------------
  {
    id: "event-late-tax-filing-notice",
    category: "bureaucracy",
    title: { key: "stable-life.event.late-tax-filing-notice.title", text: "Late Filing Notice" },
    description: {
      key: "stable-life.event.late-tax-filing-notice.description",
      text: "A form due last season is due again, this time with a tone.",
    },
    weight: 7,
    conditions: { all: [] },
    chainId: "tax-filing-chain",
    chainStep: 1,
    automaticOutcome: {
      effects: [
        {
          target: "player.needs.stress",
          operation: "add",
          value: 5,
          sourceId: "event-late-tax-filing-notice",
        },
      ],
      rewards: [],
      messages: [
        { key: "stable-life.event.late-tax-filing-notice.outcome.message", visible: true, tone: "negative" },
      ],
      // S16.4 — the id below must name a real event in this same collection.
      scheduledEvents: [{ eventId: "event-tax-penalty-assessment", inWeeks: 2 }],
    },
    tags: ["chained"],
  },
  {
    id: "event-tax-penalty-assessment",
    category: "bureaucracy",
    title: { key: "stable-life.event.tax-penalty-assessment.title", text: "Penalty Assessment" },
    description: {
      key: "stable-life.event.tax-penalty-assessment.description",
      text: "The tone from two weeks ago becomes a number.",
    },
    // `weight: 0` — reachable only via the `scheduledEvents` link above, never by random
    // draw. `endOfWeek.ts`'s own `drawable()` comment names this as the intended way to
    // author a schedule-only event; scheduled firing also ignores `conditions` entirely
    // (same file), so the trivial condition below is never actually evaluated for this one.
    weight: 0,
    conditions: { all: [] },
    chainId: "tax-filing-chain",
    chainStep: 2,
    automaticOutcome: {
      effects: [],
      rewards: [{ type: "money", target: "player.finances.cashCents", value: -DOLLARS(45) }],
      messages: [
        { key: "stable-life.event.tax-penalty-assessment.outcome.message", visible: true, tone: "negative" },
      ],
      endsChain: true,
    },
    tags: ["chained"],
  },

  // --- Transportation --------------------------------------------------------------------
  {
    id: "event-bus-fare-increase",
    category: "transportation",
    title: { key: "stable-life.event.bus-fare-increase.title", text: "Fare Goes Up Again" },
    description: {
      key: "stable-life.event.bus-fare-increase.description",
      text: "The board votes on a Tuesday no one attends. The fare box votes every day after.",
    },
    weight: 12,
    cooldownWeeks: 8,
    conditions: { all: [] },
    automaticOutcome: {
      effects: [
        { target: "player.needs.stress", operation: "add", value: 2, sourceId: "event-bus-fare-increase" },
      ],
      rewards: [{ type: "money", target: "player.finances.cashCents", value: -DOLLARS(5) }],
      messages: [{ key: "stable-life.event.bus-fare-increase.outcome.message", visible: true, tone: "negative" }],
    },
    tags: ["recurring"],
  },
  {
    id: "event-car-breakdown",
    category: "transportation",
    title: { key: "stable-life.event.car-breakdown.title", text: "Car Breakdown" },
    description: {
      key: "stable-life.event.car-breakdown.description",
      text: "Something under the hood decides today is the day.",
    },
    weight: 3,
    // S16.5 — `03` §11.3 would gate this on an `exists` over `player.inventory` for an
    // owned vehicle ("owns any item tagged formal_clothing" is the corpus's own worked
    // example of exactly this shape). `exists`/`count` throw in this pinned engine, and
    // `items` is unauthored this slice regardless, so the ownership check is omitted
    // entirely rather than approximated; the event fires as ambient background instead.
    // Named here per CP10.
    conditions: { all: [] },
    automaticOutcome: {
      effects: [{ target: "player.needs.stress", operation: "add", value: 7, sourceId: "event-car-breakdown" }],
      rewards: [{ type: "money", target: "player.finances.cashCents", value: -DOLLARS(60) }],
      messages: [{ key: "stable-life.event.car-breakdown.outcome.message", visible: true, tone: "negative" }],
    },
    tags: ["world-triggered"],
  },

  // --- Business ----------------------------------------------------------------------
  {
    id: "event-team-morale-day",
    category: "business",
    title: { key: "stable-life.event.team-morale-day.title", text: "Team Morale Day" },
    description: {
      key: "stable-life.event.team-morale-day.description",
      text: "Someone brought a cake. It is being treated as a major event.",
    },
    weight: 9,
    conditions: { all: [] },
    automaticOutcome: {
      effects: [
        { target: "player.needs.happiness", operation: "add", value: 6, sourceId: "event-team-morale-day" },
      ],
      rewards: [],
      messages: [{ key: "stable-life.event.team-morale-day.outcome.message", visible: true, tone: "positive" }],
    },
    tags: ["world-triggered"],
  },
  {
    id: "event-employee-of-the-month",
    category: "business",
    title: { key: "stable-life.event.employee-of-the-month.title", text: "Employee of the Month" },
    description: {
      key: "stable-life.event.employee-of-the-month.description",
      text: "A laminated certificate and a small cash bonus, in that order of perceived value.",
    },
    weight: 4,
    unique: true,
    // S16.3 — a third example of the job-held condition.
    conditions: { field: "player.career.currentEmployment", operator: "not_equals", value: undefined },
    automaticOutcome: {
      effects: [
        {
          target: "player.needs.happiness",
          operation: "add",
          value: 10,
          sourceId: "event-employee-of-the-month",
        },
      ],
      rewards: [{ type: "money", target: "player.finances.cashCents", value: DOLLARS(100) }],
      messages: [
        { key: "stable-life.event.employee-of-the-month.outcome.message", visible: true, tone: "positive" },
      ],
    },
    tags: ["unique"],
  },

  // ===================================================================================
  // S21 — the remaining seven `03` §11.1 categories. Same rules as the fifteen above:
  // one §11.2 type tag each, cash as a `Reward` rather than a `Modifier`.
  // ===================================================================================

  // --- Housing -----------------------------------------------------------------------
  {
    id: "event-boiler-gives-up",
    category: "housing",
    title: { key: "stable-life.event.boiler-gives-up.title", text: "The Boiler Gives Up" },
    description: {
      key: "stable-life.event.boiler-gives-up.description",
      text: "It had been making the noise for weeks. The noise has stopped, which is worse.",
    },
    weight: 8,
    // S21.3 — the housing-condition event. `player.housing.damage` is §9.1's accumulated
    // disrepair, `0–100`, a stored scalar on `HousingState` (`actor.ts`), so this is a
    // plain field comparison with no collection anywhere in it.
    conditions: { field: "player.housing.damage", operator: "greater_than", value: 30 },
    automaticOutcome: {
      effects: [
        { target: "player.needs.stress", operation: "add", value: 8, sourceId: "event-boiler-gives-up" },
        { target: "player.needs.health", operation: "subtract", value: 4, sourceId: "event-boiler-gives-up" },
      ],
      rewards: [{ type: "money", target: "player.finances.cashCents", value: -DOLLARS(120) }],
      messages: [{ key: "stable-life.event.boiler-gives-up.outcome.message", visible: true, tone: "negative" }],
    },
    tags: ["conditional"],
  },
  {
    id: "event-landlord-inspection",
    category: "housing",
    title: { key: "stable-life.event.landlord-inspection.title", text: "Routine Inspection" },
    description: {
      key: "stable-life.event.landlord-inspection.description",
      text: "Two days' notice, delivered one day ago. Everything you own is now visible.",
    },
    weight: 7,
    cooldownWeeks: 6,
    // S21.5 — `03` §11.3's own worked example is "any NPC with resentment above 50", which
    // needs an `exists` over `player.relationships`; that throws in this pinned engine
    // (`conditions.ts`'s `unresolvableCollection`), and the natural-key form §7.1 documents
    // — `player.relationships.<npcId>.affinity` — throws too, because `relationships` is an
    // array and the generic per-segment walk cannot key into it. The condition narrows to
    // NPC *identity*: does this player's landlord happen to be this NPC. That is strictly
    // weaker than the corpus intends and is not a relationship condition. Named here rather
    // than approximated with `player.relationships.0.affinity`, which resolves but addresses
    // by index — the exact form §7.1 rejects, since it targets a different NPC after any
    // reordering. Per CP10.
    conditions: {
      field: "player.housing.landlordNpcId",
      operator: "equals",
      value: "npc-landlord-rented-room",
    },
    automaticOutcome: {
      effects: [
        { target: "player.needs.stress", operation: "add", value: 5, sourceId: "event-landlord-inspection" },
      ],
      rewards: [{ type: "relationship", target: "npc-landlord-rented-room", value: 2 }],
      messages: [
        { key: "stable-life.event.landlord-inspection.outcome.message", visible: true, tone: "neutral" },
      ],
    },
    tags: ["conditional"],
  },
  {
    id: "event-storm-repair-bill",
    category: "housing",
    title: { key: "stable-life.event.storm-repair-bill.title", text: "The Repair Bill" },
    description: {
      key: "stable-life.event.storm-repair-bill.description",
      text: "The roof is fixed. The invoice explains, at length, why it took three weeks.",
    },
    weight: 5,
    conditions: { all: [] },
    chainId: "storm-damage-chain",
    chainStep: 2,
    automaticOutcome: {
      effects: [
        { target: "player.needs.stress", operation: "add", value: 4, sourceId: "event-storm-repair-bill" },
      ],
      rewards: [{ type: "money", target: "player.finances.cashCents", value: -DOLLARS(180) }],
      messages: [
        { key: "stable-life.event.storm-repair-bill.outcome.message", visible: true, tone: "negative" },
      ],
      endsChain: true,
    },
    tags: ["chained"],
  },

  // --- Health ------------------------------------------------------------------------
  {
    id: "event-winter-flu",
    category: "health",
    title: { key: "stable-life.event.winter-flu.title", text: "Winter Flu" },
    description: {
      key: "stable-life.event.winter-flu.description",
      text: "Everyone at work had it. Now it is your turn, and the week has other plans.",
    },
    weight: 11,
    // §11.3 — a plain scalar comparison on a derived need. `player.needs.health` resolves
    // through `resolveEffectiveField`, so this reads the same value the player is shown.
    conditions: { field: "player.needs.health", operator: "less_than", value: 70 },
    automaticOutcome: {
      effects: [
        { target: "player.needs.health", operation: "subtract", value: 10, sourceId: "event-winter-flu" },
        { target: "player.needs.energy", operation: "subtract", value: 12, sourceId: "event-winter-flu" },
      ],
      rewards: [{ type: "item", target: "item-otc-medicine", value: 1 }],
      messages: [{ key: "stable-life.event.winter-flu.outcome.message", visible: true, tone: "negative" }],
    },
    tags: ["conditional"],
  },
  {
    id: "event-dental-emergency",
    category: "health",
    title: { key: "stable-life.event.dental-emergency.title", text: "Dental Emergency" },
    description: {
      key: "stable-life.event.dental-emergency.description",
      text: "A tooth that had been managing quietly for years decides to stop managing.",
    },
    weight: 4,
    conditions: { all: [] },
    choices: [
      {
        id: "pay-for-treatment",
        labelKey: "stable-life.event.dental-emergency.choice.pay-for-treatment",
        timeCost: 2,
        moneyCostCents: DOLLARS(150),
        outcomes: [
          {
            outcome: {
              effects: [
                { target: "player.needs.health", operation: "add", value: 8, sourceId: "event-dental-emergency" },
              ],
              rewards: [],
              messages: [
                { key: "stable-life.event.dental-emergency.outcome.treated", visible: true, tone: "positive" },
              ],
            },
          },
        ],
      },
      {
        id: "endure-it",
        labelKey: "stable-life.event.dental-emergency.choice.endure-it",
        outcomes: [
          {
            outcome: {
              effects: [
                { target: "player.needs.health", operation: "subtract", value: 6, sourceId: "event-dental-emergency" },
                { target: "player.needs.stress", operation: "add", value: 9, sourceId: "event-dental-emergency" },
              ],
              rewards: [],
              messages: [
                { key: "stable-life.event.dental-emergency.outcome.endured", visible: true, tone: "negative" },
              ],
            },
          },
        ],
      },
    ],
    tags: ["player-triggered"],
  },

  // --- Relationships -----------------------------------------------------------------
  {
    id: "event-friend-needs-a-favor",
    category: "relationships",
    title: { key: "stable-life.event.friend-needs-a-favor.title", text: "A Friend Needs a Favor" },
    description: {
      key: "stable-life.event.friend-needs-a-favor.description",
      text: "Priya asks for a Saturday. She has never asked for a Saturday before.",
    },
    weight: 9,
    // S21.3/S21.5 — §11.3 would gate this on the asking NPC's own affinity toward the
    // player, which needs either the `player.relationships.<npcId>` natural key (§7.1) or
    // an `exists` over the collection; both throw (`resolveField`'s generic per-segment
    // walk cannot key an array by an id, and `collection` is unimplemented). Narrowed
    // instead to `player.relationships.length` — "has met at least one NPC" — a real array
    // property that never throws, verified against the pinned engine directly (not
    // inferred). This is a different, categorically safer form than the
    // `player.relationships.0.affinity` index address this file's header rejects: that form
    // names a specific NPC by position, which silently changes identity on reordering; an
    // aggregate `.length` names no NPC at all, so reordering cannot make it wrong, only
    // ever weaker than the corpus's own per-NPC gate. The same narrow-and-name pattern
    // S16.5 already uses (`event-job-interview-invitation`'s "currently unemployed" for "a
    // pending application"). Named here per CP10.
    conditions: { field: "player.relationships.length", operator: "greater_than", value: 0 },
    choices: [
      {
        id: "help-out",
        labelKey: "stable-life.event.friend-needs-a-favor.choice.help-out",
        timeCost: 4,
        outcomes: [
          {
            outcome: {
              effects: [
                {
                  target: "player.needs.happiness",
                  operation: "add",
                  value: 7,
                  sourceId: "event-friend-needs-a-favor",
                },
                {
                  target: "player.needs.energy",
                  operation: "subtract",
                  value: 8,
                  sourceId: "event-friend-needs-a-favor",
                },
              ],
              rewards: [{ type: "relationship", target: "npc-old-friend", value: 6 }],
              messages: [
                { key: "stable-life.event.friend-needs-a-favor.outcome.helped", visible: true, tone: "positive" },
              ],
            },
          },
        ],
      },
      {
        id: "beg-off",
        labelKey: "stable-life.event.friend-needs-a-favor.choice.beg-off",
        outcomes: [
          {
            outcome: {
              effects: [
                {
                  target: "player.needs.happiness",
                  operation: "subtract",
                  value: 4,
                  sourceId: "event-friend-needs-a-favor",
                },
              ],
              rewards: [{ type: "relationship", target: "npc-old-friend", value: -4 }],
              messages: [
                { key: "stable-life.event.friend-needs-a-favor.outcome.declined", visible: true, tone: "negative" },
              ],
            },
          },
        ],
      },
    ],
    tags: ["npc-triggered"],
  },
  {
    id: "event-neighbor-borrows-again",
    category: "relationships",
    title: { key: "stable-life.event.neighbor-borrows-again.title", text: "Borrowed, Again" },
    description: {
      key: "stable-life.event.neighbor-borrows-again.description",
      text: "Tomasz needs the toolkit. Tomasz has needed the toolkit since March.",
    },
    weight: 8,
    cooldownWeeks: 4,
    // S21.5 — the same omission as `event-friend-needs-a-favor`: §11.3's literal example
    // ("any NPC with resentment above 50") is unauthorable here.
    conditions: { all: [] },
    automaticOutcome: {
      effects: [
        {
          target: "player.needs.happiness",
          operation: "subtract",
          value: 3,
          sourceId: "event-neighbor-borrows-again",
        },
      ],
      rewards: [
        { type: "relationship", target: "npc-next-door-neighbor", value: 3 },
        { type: "item", target: "item-basic-toolkit", value: -1 },
      ],
      messages: [
        { key: "stable-life.event.neighbor-borrows-again.outcome.message", visible: true, tone: "neutral" },
      ],
    },
    tags: ["repeatable"],
  },

  // --- Education ---------------------------------------------------------------------
  {
    id: "event-tutor-offers-extra-session",
    category: "education",
    title: { key: "stable-life.event.tutor-offers-extra-session.title", text: "An Extra Session" },
    description: {
      key: "stable-life.event.tutor-offers-extra-session.description",
      text: "Mr. Alavi has a free hour and a strong opinion about how you should spend it.",
    },
    weight: 7,
    // S21.3/S21.5 — §11.3 would gate this on a course currently in progress, which is a
    // `count` over `player.education.enrollments` filtered on `status: "active"`.
    // `enrollments` is an array on `EducationState` (`actor.ts`), so neither the quantifier
    // nor the natural-key walk resolves. Narrowed instead to
    // `player.education.enrollments.length` — "has at least one enrollment record" — a real
    // array property that never throws, verified against the pinned engine directly. This
    // asks a different question than "currently active" does (a completed or failed
    // enrollment stays in the array; only `withdraw_course` removes an entry), the same honest gap
    // between the narrowed gate and the corpus's own intent that S16.5's own precedent
    // already accepts (`event-job-interview-invitation`'s "currently unemployed" is not "has
    // a pending application" either). Named here per CP10.
    conditions: { field: "player.education.enrollments.length", operator: "greater_than", value: 0 },
    automaticOutcome: {
      effects: [
        {
          target: "player.needs.energy",
          operation: "subtract",
          value: 5,
          sourceId: "event-tutor-offers-extra-session",
        },
      ],
      rewards: [{ type: "relationship", target: "npc-community-college-teacher", value: 4 }],
      messages: [
        { key: "stable-life.event.tutor-offers-extra-session.outcome.message", visible: true, tone: "positive" },
      ],
    },
    tags: ["npc-triggered"],
  },
  {
    id: "event-credential-recognized",
    category: "education",
    title: { key: "stable-life.event.credential-recognized.title", text: "Someone Noticed" },
    description: {
      key: "stable-life.event.credential-recognized.description",
      text: "The equivalency certificate comes up in conversation and, for once, lands well.",
    },
    weight: 6,
    unique: true,
    // `player.education.completedCourseIds` is a `string[]` on `EducationState`, so
    // `contains` resolves against it directly — no collection quantifier needed. This is a
    // *completed*-course condition, which is a different question from the in-progress one
    // `event-tutor-offers-extra-session` had to omit; it is not a substitute for it.
    conditions: {
      field: "player.education.completedCourseIds",
      operator: "contains",
      value: "course-high-school-equivalency",
    },
    automaticOutcome: {
      effects: [
        {
          target: "player.needs.happiness",
          operation: "add",
          value: 9,
          sourceId: "event-credential-recognized",
        },
      ],
      rewards: [],
      messages: [
        { key: "stable-life.event.credential-recognized.outcome.message", visible: true, tone: "positive" },
      ],
    },
    tags: ["unique"],
  },

  // --- Weather -----------------------------------------------------------------------
  {
    id: "event-heatwave",
    category: "weather",
    title: { key: "stable-life.event.heatwave.title", text: "Heatwave" },
    description: {
      key: "stable-life.event.heatwave.description",
      text: "The city holds the heat overnight and gives it back at eight in the morning.",
    },
    weight: 10,
    cooldownWeeks: 10,
    conditions: { all: [] },
    automaticOutcome: {
      effects: [
        { target: "player.needs.energy", operation: "subtract", value: 7, sourceId: "event-heatwave" },
        { target: "player.needs.stress", operation: "add", value: 3, sourceId: "event-heatwave" },
      ],
      rewards: [],
      messages: [{ key: "stable-life.event.heatwave.outcome.message", visible: true, tone: "negative" }],
    },
    tags: ["recurring"],
  },
  {
    id: "event-storm-damages-roof",
    category: "weather",
    title: { key: "stable-life.event.storm-damages-roof.title", text: "The Storm Finds the Roof" },
    description: {
      key: "stable-life.event.storm-damages-roof.description",
      text: "Wind overnight, and a stain on the ceiling by morning that was not there before.",
    },
    weight: 5,
    conditions: { all: [] },
    chainId: "storm-damage-chain",
    chainStep: 1,
    automaticOutcome: {
      effects: [
        { target: "player.needs.stress", operation: "add", value: 6, sourceId: "event-storm-damages-roof" },
      ],
      rewards: [],
      messages: [
        { key: "stable-life.event.storm-damages-roof.outcome.message", visible: true, tone: "negative" },
      ],
      // S21.4 — the id below must name a real event in this same collection.
      scheduledEvents: [{ eventId: "event-storm-repair-bill", inWeeks: 3 }],
      advancesChain: true,
    },
    tags: ["chained"],
  },

  // --- Opportunity -------------------------------------------------------------------
  {
    id: "event-overtime-offered",
    category: "opportunity",
    title: { key: "stable-life.event.overtime-offered.title", text: "Overtime Offered" },
    description: {
      key: "stable-life.event.overtime-offered.description",
      text: "Someone called in sick. The hours are yours if you want them, and they are not good hours.",
    },
    weight: 12,
    // The same job-held scalar comparison S16 established — `currentEmployment` compared
    // whole against `undefined`, never walked into, so an unemployed player does not throw.
    conditions: { field: "player.career.currentEmployment", operator: "not_equals", value: undefined },
    choices: [
      {
        id: "take-the-shift",
        labelKey: "stable-life.event.overtime-offered.choice.take-the-shift",
        timeCost: 6,
        outcomes: [
          {
            outcome: {
              effects: [
                { target: "player.needs.energy", operation: "subtract", value: 10, sourceId: "event-overtime-offered" },
                { target: "player.needs.stress", operation: "add", value: 6, sourceId: "event-overtime-offered" },
              ],
              rewards: [{ type: "money", target: "player.finances.cashCents", value: DOLLARS(85) }],
              messages: [
                { key: "stable-life.event.overtime-offered.outcome.took-it", visible: true, tone: "neutral" },
              ],
            },
          },
        ],
      },
      {
        id: "decline-the-shift",
        labelKey: "stable-life.event.overtime-offered.choice.decline-the-shift",
        outcomes: [
          {
            outcome: {
              effects: [],
              rewards: [],
              messages: [
                { key: "stable-life.event.overtime-offered.outcome.declined", visible: true, tone: "neutral" },
              ],
            },
          },
        ],
      },
    ],
    tags: ["player-triggered"],
  },
  {
    id: "event-apartment-viewing-offered",
    category: "opportunity",
    title: { key: "stable-life.event.apartment-viewing-offered.title", text: "A Studio Comes Free" },
    description: {
      key: "stable-life.event.apartment-viewing-offered.description",
      text: "A studio on the next street is between tenants. It will not be for long.",
    },
    weight: 6,
    conditions: { all: [] },
    automaticOutcome: {
      effects: [
        {
          target: "player.needs.happiness",
          operation: "add",
          value: 3,
          sourceId: "event-apartment-viewing-offered",
        },
      ],
      rewards: [],
      messages: [
        { key: "stable-life.event.apartment-viewing-offered.outcome.message", visible: true, tone: "positive" },
      ],
    },
    // The housing tier this opportunity concerns, carried as a tag: `EventDefinition` has no
    // field for the content a §11.1 "Opportunity" event points at, the same schema gap S20's
    // landlord met when naming its housing tier. The §11.2 type tag is the first entry.
    tags: ["world-triggered", "housing-cheap-studio"],
  },

  // --- Pure absurdity ----------------------------------------------------------------
  {
    id: "event-pigeon-territorial-dispute",
    category: "pure-absurdity",
    title: { key: "stable-life.event.pigeon-territorial-dispute.title", text: "Territorial Dispute" },
    description: {
      key: "stable-life.event.pigeon-territorial-dispute.description",
      text: "A pigeon has decided the bicycle is its bicycle. It has brought documentation.",
    },
    weight: 3,
    conditions: { all: [] },
    automaticOutcome: {
      effects: [
        {
          target: "player.needs.happiness",
          operation: "add",
          value: 4,
          sourceId: "event-pigeon-territorial-dispute",
        },
        {
          target: "player.needs.stress",
          operation: "add",
          value: 2,
          sourceId: "event-pigeon-territorial-dispute",
        },
      ],
      rewards: [{ type: "item", target: "item-used-bicycle", value: 0 }],
      messages: [
        { key: "stable-life.event.pigeon-territorial-dispute.outcome.message", visible: true, tone: "absurd" },
      ],
    },
    tags: ["repeatable"],
  },
  {
    id: "event-neon-sign-misunderstanding",
    category: "pure-absurdity",
    title: { key: "stable-life.event.neon-sign-misunderstanding.title", text: "A Municipal Misunderstanding" },
    description: {
      key: "stable-life.event.neon-sign-misunderstanding.description",
      text: "The neon sign in the window has been mistaken for a business. A form has been sent.",
    },
    weight: 2,
    unique: true,
    conditions: { all: [] },
    automaticOutcome: {
      effects: [
        {
          target: "player.needs.stress",
          operation: "add",
          value: 4,
          sourceId: "event-neon-sign-misunderstanding",
        },
        {
          target: "player.needs.happiness",
          operation: "add",
          value: 6,
          sourceId: "event-neon-sign-misunderstanding",
        },
      ],
      rewards: [{ type: "item", target: "item-novelty-neon-sign", value: 0 }],
      messages: [
        { key: "stable-life.event.neon-sign-misunderstanding.outcome.message", visible: true, tone: "absurd" },
      ],
    },
    tags: ["unique"],
  },
];

/**
 * §16.3's completion requirements, minus the credential one the condition language cannot
 * express yet (see the file header). `highestTierAchieved` is a string, so "skilled or
 * better" is authored as the explicit set rather than an ordering comparison — the tier
 * union has no numeric rank the evaluator could compare against.
 *
 * §13's goal category list is a prose enumeration, not a code-level enum — `category` is a
 * free `string` on `GoalDefinition` (`content.ts`). §16.1 targets four goal categories; the
 * three below are chosen from fields the pinned engine can already address without a
 * collection quantifier (the same restriction the file header documents for events),
 * alongside `goal-stable-life`'s own `"scenario"` — four distinct categories total (S23.1).
 *
 * `goal-financial-cushion` is the persistent one §13.1 asks for (S23.2): the corpus's own
 * example is an eight-consecutive-week maintenance goal, reused here at a lower cash
 * threshold than the scenario goal so it reads as a stepping stone rather than a restatement.
 * `requiredDurationWeeks` is `GoalDefinition`'s field for it; the engine resets the
 * consecutive-week counter on any week the condition fails (04 §13.1), which this file has
 * no state to exercise directly — asserted here only as "present and greater than one",
 * per S23.2's own wording.
 *
 * `goal-career-advancement` and `goal-certified-professional` are stretch goals against
 * S15/S17 content already authored — a tier above the scenario goal's "skilled or better",
 * and a specific course completion rather than the scenario's omitted credential-level
 * check. Both are ordinary `player.career.*`/`player.education.completedCourseIds` field
 * reads, the same forms the scenario goal and `event-credential-recognized` already use.
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
  {
    id: "goal-financial-cushion",
    label: { key: "stable-life.goal.financial-cushion.label", text: "A Financial Cushion" },
    description: {
      key: "stable-life.goal.financial-cushion.description",
      text: "Five hundred dollars in hand, and keep it there for eight straight weeks.",
    },
    category: "wealth",
    conditions: { field: "player.finances.cashCents", operator: "greater_or_equal", value: DOLLARS(500) },
    requiredDurationWeeks: 8,
  },
  {
    id: "goal-career-advancement",
    label: { key: "stable-life.goal.career-advancement.label", text: "Career Advancement" },
    description: {
      key: "stable-life.goal.career-advancement.description",
      text: "Professional work, or better.",
    },
    category: "career",
    conditions: {
      any: [
        { field: "player.career.highestTierAchieved", operator: "equals", value: "professional" },
        { field: "player.career.highestTierAchieved", operator: "equals", value: "senior" },
      ],
    },
  },
  {
    id: "goal-certified-professional",
    label: { key: "stable-life.goal.certified-professional.label", text: "Certified Professional" },
    description: {
      key: "stable-life.goal.certified-professional.description",
      text: "Finish the entry IT certification.",
    },
    category: "education",
    conditions: {
      field: "player.education.completedCourseIds",
      operator: "contains",
      value: "course-professional-certification-it",
    },
  },
];

/**
 * §16.3 — twelve months to establish a stable life. `startingBackgroundIds` names
 * `background-kitchen-hand` (S23.3): of S22's three, it is the one whose
 * `startingCashModifierCents` is `0` (`initial.ts` sums every listed background's modifier
 * into `scenario.startingCashCents`), so the player's actual starting cash stays §16.3's
 * literal $200 — the number this file states three times over (here, the scenario
 * description below, and the catalog card). `background-office-temp`'s `"school"`
 * credential reads closer to §16.3's loose "Basic education" phrase, but that is prose
 * flavor text where $200 is a specific, repeated figure; preserving the figure exactly
 * is the choice made here. `startingInventory` is §16.3's "one week of food"
 * (`item-groceries-poor`, matching the scenario's tight-budget framing over the pricier
 * `item-groceries-basic`) plus one of "minimal possessions" (`item-secondhand-coat`), both
 * from S19's items.
 */
const scenarios: SimulationCampaignSource["scenarios"] = [
  {
    id: STABLE_LIFE_SCENARIO_ID,
    name: { key: "stable-life.scenario.name", text: "Stable Life" },
    description: {
      key: "stable-life.scenario.description",
      text: "Two hundred dollars, no job, basic education, a rented room, one week of food, and fifty-two weeks.",
    },
    startingBackgroundIds: ["background-kitchen-hand"],
    startingCashCents: DOLLARS(200),
    startingHousingId: "housing-rented-room",
    startingLocationId: "home",
    startingInventory: [
      { definitionId: "item-groceries-poor", quantity: 1 },
      { definitionId: "item-secondhand-coat", quantity: 1 },
    ],
    goalIds: ["goal-stable-life", "goal-financial-cushion", "goal-career-advancement", "goal-certified-professional"],
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

/**
 * §3.1/§3.4 — three traits, each granted by exactly one background below (S22.4). Every
 * `effects` entry targets a writable `Modifier` field (§10.2's restriction, the same one
 * `items` and `events` are bound by) since `validateModifiers` accepts nothing else; a trait's
 * effects apply as a permanent `StatusEffect` while the trait is possessed (`04` §5.4.3), not
 * a one-off. `trait-thick-skinned` and `trait-perfectionist` name each other in
 * `conflictsWith` — a corpus-plausible pairing (unbothered vs. anxious about small errors),
 * not a mechanic this slice's acceptance criteria require.
 */
const traits: SimulationCampaignSource["traits"] = [
  {
    id: "trait-thick-skinned",
    name: { key: "stable-life.trait.thick-skinned.name", text: "Thick-Skinned" },
    description: {
      key: "stable-life.trait.thick-skinned.description",
      text: "Bad days roll off. A useful trait, in a scenario built almost entirely from bad days.",
    },
    effects: [{ target: "player.needs.stress", operation: "subtract", value: 2, sourceId: "trait-thick-skinned" }],
    conflictsWith: ["trait-perfectionist"],
  },
  {
    id: "trait-organized",
    name: { key: "stable-life.trait.organized.name", text: "Organized" },
    description: {
      key: "stable-life.trait.organized.description",
      text: "Everything has a place, including the week itself.",
    },
    effects: [
      { target: "calendar.committedTimeUnits", operation: "subtract", value: 1, sourceId: "trait-organized" },
    ],
    conflictsWith: [],
  },
  {
    id: "trait-perfectionist",
    name: { key: "stable-life.trait.perfectionist.name", text: "Perfectionist" },
    description: {
      key: "stable-life.trait.perfectionist.description",
      text: "Careful work, and a running commentary on everything not yet careful enough.",
    },
    effects: [
      { target: "player.attributes.discipline", operation: "add", value: 3, sourceId: "trait-perfectionist" },
      { target: "player.needs.stress", operation: "add", value: 2, sourceId: "trait-perfectionist" },
    ],
    conflictsWith: ["trait-thick-skinned"],
  },
];

/**
 * §3.1/§16.1 — the three starting backgrounds, one per career path S15 authored
 * (food-service, clerical, retail's own path stays unclaimed — an eight-job budget across
 * three paths does not stretch to a fourth background), each granted its path's early skill
 * per §3.5 and one trait from above. §3.4's seven `AttributeState` fields (`03` §3.1's mirror
 * of the type) are set on every entry; none differs enough to matter mechanically, since §3.4
 * says attributes "should not increase through trivial repetition" and a background is a
 * one-time grant, not a repeated action. `startingCredentials` and `startingSkills` are what
 * S22.2 differentiates the three on.
 */
const backgrounds: SimulationCampaignSource["backgrounds"] = [
  {
    id: "background-kitchen-hand",
    name: { key: "stable-life.background.kitchen-hand.name", text: "Kitchen Hand" },
    description: {
      key: "stable-life.background.kitchen-hand.description",
      text: "A run of short-order jobs, none of them long enough to put on a résumé as one line.",
    },
    startingAttributes: {
      intelligence: 40, discipline: 45, charisma: 40, creativity: 35, resilience: 55, wisdom: 35, luck: 20,
    },
    startingSkills: { cooking: 15 },
    startingCredentials: ["none"],
    startingTraits: ["trait-thick-skinned"],
    startingCashModifierCents: 0,
  },
  {
    id: "background-office-temp",
    name: { key: "stable-life.background.office-temp.name", text: "Office Temp" },
    description: {
      key: "stable-life.background.office-temp.description",
      text: "Two years of filling in for whoever was out. Nobody trained you; you just watched.",
    },
    startingAttributes: {
      intelligence: 45, discipline: 55, charisma: 40, creativity: 35, resilience: 40, wisdom: 40, luck: 20,
    },
    startingSkills: { programming: 10 },
    startingCredentials: ["school"],
    startingTraits: ["trait-organized"],
    startingCashModifierCents: DOLLARS(20),
  },
  {
    id: "background-overqualified-graduate",
    name: { key: "stable-life.background.overqualified-graduate.name", text: "Overqualified Graduate" },
    description: {
      key: "stable-life.background.overqualified-graduate.description",
      text: "A certificate, a stack of debt to match it, and a job market that has not read either.",
    },
    startingAttributes: {
      intelligence: 55, discipline: 45, charisma: 40, creativity: 45, resilience: 35, wisdom: 40, luck: 20,
    },
    startingSkills: { management: 10 },
    startingCredentials: ["certificate"],
    startingTraits: ["trait-perfectionist"],
    startingCashModifierCents: -DOLLARS(50),
  },
];

export const stableLifeSource: SimulationCampaignSource = {
  description: {
    key: "stable-life.campaign.description",
    text: "Life in the Fast Lane — the Stable Life scenario. Fifty-two weeks to turn two hundred dollars and a rented room into something that survives a bad month.",
  },

  jobs,
  courses,
  housing,
  items,
  events,
  npcs,
  goals,
  scenarios,
  difficulties,
  opportunities: [],
  achievements: [],
  headlines: [],
  employers,
  locations,
  backgrounds,
  traits,
  skills,

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
 * game while any of its seventeen content collections is empty.
 *
 * It names what is *missing* rather than enumerating what is authored, and that is a
 * staleness decision rather than a style one. An enumeration has to be revised by every
 * slice that fills a collection, and was not: it read "15 of 30 random events" through four
 * merged slices after all 30 were written, in the one sentence a host shows a player before
 * loading. The set of empty collections only ever shrinks, `stable-life.test.ts` already
 * asserts exactly what is in it, and this sentence is checked against that same set.
 */
export const stableLifeCatalog = {
  title: "Life in the Fast Lane — Stable Life",
  description:
    "Fifty-two weeks to turn two hundred dollars and a rented room into something that survives a bad month.",
  duration: "52 weeks",
  contentNotice:
    "Seed content. Opportunities, achievements and headlines are not yet written; the rest of the scenario is authored.",
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
