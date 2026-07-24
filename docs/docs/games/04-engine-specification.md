# Life in the Fast Lane — Engine Specification

**Document status:** Revision 5 — location model, voice-gap mechanisms, opportunity
and scheduled-event lifecycles
**Project stage:** Engine design
**Implementation language:** TypeScript
**Runtime:** Node.js

> **Scope of this document**
> The technical contract: architectural principles, state types, the engine API,
> resolution pipeline, content architecture, serialization, testing, and delivery phases.
>
> - Why the game exists: [`01-vision.md`](01-vision.md)
> - What the game does and what the numbers mean: [`03-game-design.md`](03-game-design.md)
>
> Judgement calls made in the absence of a decision in revision 1 are marked
> **⚑ Judgement call** inline and collected in §22.

---

## 1. Architectural Principles

### 1.1 Deterministic Simulation

The engine controls:

- Time.
- Money.
- Income.
- Expenses.
- Employment.
- Education.
- Skills.
- Housing.
- Inventory.
- Health.
- Energy.
- Satiety.
- Happiness.
- Stress.
- Relationships.
- Reputation.
- Opportunities.
- Event probabilities.
- Goal progression.
- Failure conditions.
- Random-number generation.

Given the same:

- Initial seed.
- Content version.
- Engine version.
- Starting configuration.
- Sequence of player actions.

The engine must produce the same mechanical results.

Determinism is not aspirational. It is a testable property, verified by §19
acceptance criterion 18, and it constrains the rules in §2.

### 1.2 Data-Driven Content

The following are represented as JSON or YAML definitions:

- Jobs.
- Employers.
- Courses.
- Schools.
- Skills.
- Items.
- Housing.
- Locations.
- NPCs.
- Backgrounds.
- Traits.
- Events.
- Event chains.
- Goals.
- Scenarios.
- Difficulty settings.
- Economy configurations.

Adding a new job, item, NPC, or event should normally not require changes to engine code.

### 1.3 Interface Independence

The engine must not depend on:

- Any web framework.
- Any desktop framework.
- Any game engine.
- Any chat interface.
- Any AI provider.
- Any distribution platform.
- Any rendering library.
- Any specific database.
- Any platform-specific API.

The engine performs **no I/O of any kind**. It does not read files. Content arrives
as an already-loaded, already-validated in-memory registry (§4.1).

```text
Text client
Desktop client
Web client
Steam client
Discord client
CLI
Mobile client
AI adapter
       │
       ▼   (structured commands)
Game Engine API
       │
       ▼
Content Registry (in memory)  +  Save Data
       ▲
       │   (file I/O lives here, outside the engine)
Content Loader package
```

### 1.4 Error Handling Model

The engine is **non-throwing in all resolution paths**. Every foreseeable failure —
invalid action, insufficient funds, unmet prerequisite, unknown target — is returned
as data on a `ValidationResult` or a command result.

Exceptions are reserved exclusively for programmer error, and always indicate a bug
rather than a game situation:

- A `ContentRegistry` that failed validation being passed to `createEngine`.
- A save that fails schema parsing in `deserialize`.
- An internal invariant violation (a reducer producing an out-of-range need).

The reason is determinism. A throw midway through `endWeek` would leave state
partially advanced with no defined recovery, and no way to reproduce the resulting
save. Returning failure as data keeps every path total.

### 1.5 Performance Budget

§18.4 requires running large numbers of games. Without a target nobody can tell a
healthy implementation from a broken one.

| Operation | Budget |
|---|---:|
| `endWeek` on a mature 52-week state | < 2 ms |
| Full 52-week game, no client | < 100 ms |
| 10,000 full games, single-threaded | < 15 min |
| `serialize` + `deserialize` round trip | < 5 ms |

These are engineering budgets, not hard limits. Exceeding them is a defect to
investigate, not a build failure.

---

## 2. Core Conventions

These conventions apply everywhere and exist to protect §1.1.

### 2.1 Numeric Representation

**All money is integer cents.** Field names carry the `Cents` suffix. There are no
fractional currency values anywhere in state.

```typescript
type Cents = number;   // integer; 1234 === $12.34
```

Rates are integer basis points, not floats:

```typescript
type BasisPoints = number;   // integer; 250 === 2.50%
```

**All needs, skills, attributes and reputation values are integers** in `0–100`.

Every calculation that could produce a fraction states its rounding rule at the point
of calculation. The default, where unstated, is round-half-away-from-zero.

**Banned in any resolution path:** `Math.random`, `Math.pow`, `Math.exp`, `Math.log`,
`Math.sin`/`cos`/`tan`, and `**` with a non-integer exponent. Basic IEEE-754
arithmetic is bit-identical across JavaScript engines; the transcendental functions
are not specified to be, and using them silently breaks cross-platform reproducibility.
Enforced by lint rule.

### 2.2 Deterministic Iteration

`Record<string, T>` key order depends on insertion order, which after a
`serialize`/`deserialize` round trip depends on the order of keys in the JSON text.
Any iteration that affects state can therefore diverge between a fresh game and a
loaded one.

**Rule:** wherever a `Record` is iterated in a way that affects state — skill decay,
weighted selection, modifier application, reputation processing — keys must be
explicitly sorted first.

```typescript
function orderedKeys<T>(record: Record<string, T>): string[] {
  return Object.keys(record).sort();
}
```

Read-only iteration for display is exempt. Enforced by lint rule and by §18.1's
save/load equivalence test.

### 2.3 Reason Codes

Every validation failure, state change and outcome carries a stable machine-readable
code. Clients never string-match English.

```typescript
type ReasonCode =
  // validation
  | "insufficient_time"
  | "insufficient_funds"
  | "missing_credential"
  | "missing_item"
  | "missing_skill_level"
  | "unmet_relationship"
  | "wrong_location"
  | "unknown_target"
  | "action_not_available"
  | "read_only_field"
  // outcomes
  | "check_succeeded"
  | "check_failed"
  | "position_filled"
  | "promoted"
  | "terminated"
  | "course_completed"
  | "course_failed"
  | "rent_charged"
  | "rent_overdue"
  | "evicted"
  | "item_broke"
  | "opportunity_offered"
  | "opportunity_accepted"
  | "opportunity_declined"
  | "opportunity_expired"
  | "opportunity_revoked"
  | "event_scheduled"
  | "event_cancelled"
  | "event_triggered"
  | "goal_completed"
  | "goal_reset"
  | "failure_condition_met";
```

The list is extended as systems are built. Codes are additive and never renamed once
shipped, because saves and replay logs reference them.

### 2.4 Localized Strings

Every player-facing string **reaching the engine** is a lookup key, never literal text.

```typescript
type LocKey = string;   // e.g. "event.apartment_pipe_disaster.title"
```

Revision 1 was half-and-half — `summaryKey` and `descriptionKey` were keys while
event `title`, `description` and `label` were raw English. Retrofitting the raw half
across every content file at Phase 6 would be far more expensive than starting
consistent.

### 2.4.1 Authoring Form vs Built Form

Requiring authors to hand-write keys is the wrong trade. A single event needs a title,
a description and a label per choice — six or more keys and six matching string-table
rows before any mechanics exist. Multiplied by the §16.1 target of 30 events, 8 jobs
and 6 courses, that friction lands squarely on the thing you need most: content to
actually play.

So authors write **plain text inline**, and a build step extracts it.

```yaml
# authoring form — what a human writes
id: apartment_pipe_disaster
title: Indoor Water Feature
description: A pipe has begun expressing itself through the ceiling.
choices:
  - id: call_landlord
    label: Call the landlord
```

```yaml
# built form — what the engine loads
id: apartment_pipe_disaster
titleKey: event.apartment_pipe_disaster.title
descriptionKey: event.apartment_pipe_disaster.description
choices:
  - id: call_landlord
    labelKey: event.apartment_pipe_disaster.choice.call_landlord
```

```json
// strings/en.json — generated
{
  "event.apartment_pipe_disaster.title": "Indoor Water Feature",
  "event.apartment_pipe_disaster.description": "A pipe has begun expressing itself through the ceiling.",
  "event.apartment_pipe_disaster.choice.call_landlord": "Call the landlord"
}
```

Keys are derived deterministically from the content id and field path, so the same
source always produces the same key and translations survive re-extraction. Extraction
runs in the `content` package, before validation — the engine only ever sees built
form, and its schema is unchanged.

An author may still write an explicit `titleKey` to reuse a shared string. Extraction
leaves any field already in key form untouched.

---

## 3. Randomness

### 3.1 Generator

All random outcomes use an engine-owned seeded PRNG. `Math.random` is banned (§2.1).

**Algorithm: PCG32.** Chosen for a small serializable state, good statistical
quality, and an implementation short enough to audit.

```typescript
interface RngState {
  readonly algorithm: "pcg32";
  readonly state: string;      // 64-bit, hex-encoded
  readonly increment: string;  // 64-bit, hex-encoded — the stream selector
}
```

### 3.2 Named Substreams

The engine does not draw from one global sequence. Randomness is partitioned into
independent named streams, each derived deterministically:

```typescript
type StreamId =
  | { kind: "system"; system: SystemId; week: number }
  | { kind: "action"; actionId: string }
  | { kind: "event"; week: number }
  | { kind: "agent"; agentId: string; week: number }
  | { kind: "world"; week: number };

function deriveStream(seed: string, id: StreamId): RngState;
```

A system or resolver never touches `RngState` directly. It receives a handle scoped
to its own stream, so it cannot read from or advance anyone else's:

```typescript
interface RngHandle {
  readonly stream: StreamId;

  nextInt(minInclusive: number, maxInclusive: number): number;
  nextPercent(): number;                       // 1–100
  pick<T>(items: readonly T[]): T;
  weightedPick<T>(items: readonly Array<{ item: T; weight: number }>): T;

  readonly drawIndex: number;                  // draws taken; for debug info
}
```

`weightedPick` sorts candidates by id before accumulating weights, per §2.2 — without
that, weighted event selection would depend on collection order and diverge after a
save/load round trip.

Two properties follow, both of which matter more than they first appear:

**Adding a random draw does not shift unrelated rolls.** With one global sequence,
introducing a new roll anywhere renumbers everything downstream — every balance
fixture breaks, not because balance changed but because the stream moved. Given
§18.4 depends on large seeded suites, that fragility would be paid constantly.

**The rival cannot perturb the player.** The rival draws from `{ kind: "agent" }`.
However many decisions it evaluates, the player's rolls are untouched. This is what
makes §14.2's fairness claim in the design document structurally true rather than a
promise.

`RngState` is part of `GameState` (§5) and therefore part of every save.

### 3.3 Resolution Debug Information

```typescript
interface ResolutionDebugInfo {
  baseChance?: number;
  modifiers?: Record<string, number>;
  finalChance?: number;
  roll?: number;
  stream?: StreamId;
  drawIndex?: number;
}
```

Populated only when `metadata.transparency` is `"outcomes"` (§5.2). Under `"off"` —
the default for normal play — the field is absent entirely rather than present and
ignored, so nothing leaks through a client that renders whatever it is given.

Debug info travels on `ActionOutcome`, which reaches clients through `CommandResult`,
not through a state projection. §6's exclusion rule is therefore about **state reads**:
no projection exposes rolls, weights or hidden attributes. Transparent mode answers a
different question — "why did *this* action fail" — and needs no additional projection
audience to do it.

Intended for development, testing, balancing, bug reports, and optional transparent
game modes.

---

## 4. Content

### 4.1 Content Registry

The engine receives content as a frozen, pre-validated in-memory registry. It never
loads anything itself (§1.3).

```typescript
interface ContentRegistry {
  readonly packs: ResolvedContentPack[];

  readonly jobs: ReadonlyMap<string, JobDefinition>;
  readonly employers: ReadonlyMap<string, EmployerDefinition>;
  readonly courses: ReadonlyMap<string, CourseDefinition>;
  readonly housing: ReadonlyMap<string, HousingDefinition>;
  readonly items: ReadonlyMap<string, ItemDefinition>;
  readonly events: ReadonlyMap<string, EventDefinition>;
  readonly npcs: ReadonlyMap<string, NPCDefinition>;
  readonly goals: ReadonlyMap<string, GoalDefinition>;
  readonly locations: ReadonlyMap<string, LocationDefinition>;
  readonly achievements: ReadonlyMap<string, AchievementDefinition>;
  readonly headlines: ReadonlyMap<string, HeadlineDefinition>;
  readonly opportunities: ReadonlyMap<string, OpportunityDefinition>;
  readonly backgrounds: ReadonlyMap<string, BackgroundDefinition>;
  readonly traits: ReadonlyMap<string, TraitDefinition>;
  readonly skills: ReadonlyMap<string, SkillDefinition>;
  readonly scenarios: ReadonlyMap<string, ScenarioDefinition>;
  readonly difficulties: ReadonlyMap<string, DifficultyDefinition>;

  readonly strings: ReadonlyMap<LocKey, string>;
}

interface ResolvedContentPack {
  id: string;
  version: string;
}
```

`ReadonlyMap` rather than `Record` — ordered iteration is explicit and §2.2's sorting
requirement does not apply to lookups.

### 4.2 Content Pack Manifest

```typescript
interface ContentPackManifest {
  id: string;
  name: string;
  version: string;

  engineVersionRange: string;
  dependencies: string[];

  contentPaths: string[];
  stringTablePaths: string[];
}
```

### 4.3 Content Validation

Validation runs in the loader, before the registry is frozen, and is tiered by what
is actually decidable.

**Tier 1 — static, load-time, hard failure.**

- Duplicate IDs.
- Missing references.
- Schema conformance.
- Unsupported schema versions.
- Missing promotion targets.
- Invalid item references.
- **Condition and modifier path validity** — every `field`/`target` string resolves
  to a known path, and no modifier targets a derived read-only field.
- Missing string-table keys.

Path validation is newly practical: §7 removed the other stringly-typed write
surface, so condition and modifier paths are now the only paths in the system and can
be checked against a generated path set. This is the check that would have caught
revision 1's broken example event.

**Tier 2 — graph analysis, load-time, warning.**

Cycle detection over each explicitly declared graph: `promotionPaths`, event chains,
course prerequisites.

Warnings rather than errors, because some cycles are legitimate — a repeatable event
chain that loops deliberately, or a demotion path returning to an earlier role. A
strict mode promotes them to errors for CI.

**Tier 3 — simulation-time, not load-time. See §18.4.**

Impossible requirements, unreachable content, unsatisfiable goals, dead-end states.

Determining whether a requirement can *ever* be satisfied means reasoning about all
reachable states across all action sequences and all random outcomes. That is not a
load-time check. Revision 1 listed it alongside duplicate-ID detection as though it
were the same kind of problem; it belongs with the simulation harness, which already
exists to find "impossible goals."

### 4.4 Content Directory Layout

```text
content/
  backgrounds/
  careers/
  courses/
  difficulties/
  economy/
  employers/
  events/
  goals/
  housing/
  items/
  locations/
  npcs/
  scenarios/
  skills/
  strings/
  traits/
```

---

## 5. Game State

The complete authoritative representation of a running game.

```typescript
interface GameState {
  version: number;
  gameId: string;
  seed: string;
  rng: RngState;

  status: GameStatus;

  calendar: CalendarState;
  player: PlayerState;
  economy: EconomyState;
  world: WorldState;

  activeEffects: StatusEffect[];
  activeOpportunities: Opportunity[];
  scheduledEvents: ScheduledEvent[];
  pendingEventResponses: PendingEventResponse[];

  goals: GoalState[];
  history: HistoryEntry[];
  actionLog: LoggedAction[];

  metadata: GameMetadata;
}

type GameStatus =
  | "active"
  | "completed"
  | "failed"
  | "abandoned";
```

`rng` closes revision 1's central contradiction: §17 required saves to contain
random-generator state while `GameState` had no field to hold it, making every
post-load replay divergent and acceptance criterion 18 unsatisfiable.

### 5.1 Calendar State

```typescript
interface CalendarState {
  currentWeek: number;
  currentYear: number;
  season?: "spring" | "summer" | "autumn" | "winter";

  totalTimeUnits: number;
  committedTimeUnits: number;
  spentTimeUnits: number;
}
```

Invariant, checked after every mutation:

```text
0 ≤ committedTimeUnits + spentTimeUnits ≤ totalTimeUnits
availableTimeUnits = totalTimeUnits − committedTimeUnits − spentTimeUnits
```

```typescript
const WEEKLY_TIME_UNITS = 14;
```

### 5.2 Metadata

```typescript
interface GameMetadata {
  createdAt: string;
  updatedAt: string;

  scenarioId: string;
  difficultyId: string;
  mode: GameMode;

  contentPacks: ResolvedContentPack[];
  engineVersion: string;

  transparency: TransparencyLevel;
  migrations: MigrationRecord[];
}

type TransparencyLevel =
  | "off"          // debug omitted entirely — normal play
  | "outcomes";    // resolvers populate ResolutionDebugInfo on every outcome

type GameMode = "classic" | "open_life" | "challenge";

interface MigrationRecord {
  fromFormatVersion: number;
  toFormatVersion: number;
  appliedAt: string;
  engineVersion: string;
}
```

`contentPacks` replaces revision 1's single `contentVersion: string`. One string
cannot identify `base@1.2.0 + winter-dlc@0.3.1 + user-mod@2`, and §4.2 explicitly
supports multiple packs with dependencies — so saves would silently mis-hydrate.

### 5.3 World State

```typescript
interface WorldState {
  npcs: NPCState[];
  locations: LocationState[];

  jobMarket: JobMarketState;
  eventCooldowns: Record<string, number>;   // eventId → week last fired
  firedUniqueEvents: string[];
  chainStates: EventChainState[];

  strangenessBase: number;                  // 0–100; derived value adds modifiers
  headlinePool: HeadlinePoolState;

  agents: AgentState[];                     // rivals; empty in open_life mode

  flags: Record<string, boolean>;
}

interface HeadlinePoolState {
  remainingIds: string[];        // shuffled, drawn from the front
  shownThisWeek?: string;
  cyclesCompleted: number;
}

interface LocationState {
  definitionId: string;
  discovered: boolean;
  accessible: boolean;
}

interface JobMarketState {
  openings: JobOpening[];
}

interface JobOpening {
  jobId: string;
  contested: boolean;
  positionsAvailable: number;   // Number.POSITIVE_INFINITY when uncontested
  postedWeek: number;
  expiresAtWeek?: number;
}

interface EventChainState {
  chainId: string;
  scope: ChainScope;
  currentStep: number;
  startedWeek: number;
  active: boolean;
}

type ChainScope = "game" | "profile";
```

`JobOpening.contested` and `positionsAvailable` implement the design document's
§14.3 scarcity model: `entry` and `skilled` postings are uncontested with unbounded
positions, while `professional`/`senior` roles and promotion slots carry real counts
that the player and rival compete for.

### 5.3.1 World Strangeness

[`02-narrative-voice.md`](02-narrative-voice.md) requires that "reality should slowly
become stranger over time. Never suddenly. Never randomly." That is a progression
curve, and without state behind it the absurdity arrives uniformly distributed from
week 1 — precisely the failure the voice document warns against.

`strangenessBase` rises on a defined curve with elapsed weeks. The value content
actually gates on is the **derived** one (§7), so `Modifier`s can push it:

```typescript
// DerivedPath member
"world.strangeness"
```

Events and headlines declare `minStrangeness` / `maxStrangeness`. Early weeks draw
from the mundane pool; by week 90 the mold has opinions.

Making it derived rather than plain state costs nothing — the layer already exists —
and buys the thing a fixed curve cannot: an event that accelerates reality. The goose
gets to make the world weirder.

Raw `strangenessBase` never appears in a projection. The player is meant to notice
the drift, not read the dial.

### 5.3.2 Chain Scope

Event chains are not all the same kind of thing, so scope is declared per chain rather
than globally.

| Chain | Scope | Why |
|---|---|---|
| Eviction ladder | `game` | Cannot follow you into your next character's life |
| The goose | `profile` | The 183-week arc outlives any 52-week scenario |

A `"profile"` chain advances on **cumulative weeks played across all games** and its
state lives in `PlayerProfile` (§16.3), not `GameState`. The consequence is
deliberate: a new character inherits a goose that already owns rental property, with
no explanation offered. Given the source document's instruction — *never explain the
goose* — that is the correct behaviour.

A single global scope would be wrong in both directions: game-scoped kills the long
arc, profile-scoped carries your eviction history into a new life.

### 5.4 Effects, Opportunities and Scheduled Events

```typescript
interface StatusEffect {
  id: string;
  sourceId: string;
  sourceKind: "item" | "housing" | "trait" | "event" | "job" | "course" | "system";

  modifiers: Modifier[];

  appliedWeek: number;
  expiresAtWeek?: number;      // absent = permanent while source persists
  stacking: "refresh" | "stack";
  descriptionKey: LocKey;
  visible: boolean;
}

interface Opportunity {
  id: string;                  // unique per occurrence
  definitionId: string;
  kind: OpportunityKind;
  targetId: string;

  offeredWeek: number;
  expiresAtWeek: number;

  terms?: Record<string, unknown>;
}

type OpportunityKind =
  | "job_offer" | "promotion" | "course_place"
  | "housing" | "business" | "social";

interface ScheduledEvent {
  id: string;
  eventId: string;
  scheduledWeek: number;
  createdWeek: number;

  chainId?: string;
  chainStep?: number;
  payload?: Record<string, unknown>;
}

interface PendingEventResponse {
  id: string;
  eventId: string;
  rolledWeek: number;          // week N — when it fired
  presentWeek: number;         // week N+1 — when the player answers
  availableChoiceIds: string[];
}
```

`PendingEventResponse` implements the deferred-event model (design §11.5). Events roll
at the end of week N; those needing a decision queue here and are presented at the
start of week N+1, where their time cost competes against a fresh budget.

Presentation is owned by the `events` entry in `START_WEEK_SYSTEM_ORDER` (§12.1).
`getTurnContext` surfaces the queue, `respondToEvent` consumes it, and `endWeek`
refuses a week that still has unanswered responses.

### 5.4.1 Opportunity Lifecycle

Revision 2 had `Opportunity` in state, `"opportunity"` in `RewardType`,
`generatedOpportunities: string[]` on two outcome types, an `opportunities` entry in
`END_WEEK_SYSTEM_ORDER`, and a hidden `weight` field — with **no definition type for
any of those ids to resolve to** and no stated behaviour anywhere. Community detection
isolated it as a single-node island, which is what that looks like from the outside.

**Generation.** Three paths, all producing an `Opportunity` from an
`OpportunityDefinition` (§14.8):

| Path | Trigger |
|---|---|
| Rolled | `OpportunitySystem` draws from the eligible pool each week, weighted, from the world stream |
| Action | `ActionOutcome.generatedOpportunities` — negotiating well produces an offer |
| Event or reward | `EventOutcome.generatedOpportunities`, or a `Reward` of type `"opportunity"` |

`expiresAtWeek` is set from the definition's `durationWeeks`.

**Resolution.** An open opportunity leaves `activeOpportunities` exactly one way:

| Outcome | Cause | Reason code |
|---|---|---|
| Accepted | `accept_opportunity` action | `opportunity_accepted` |
| Declined | `decline_opportunity` action | `opportunity_declined` |
| Expired | `expiresAtWeek` passed | `opportunity_expired` |
| Revoked | contested position filled by a rival | `opportunity_revoked` |

**The `opportunities` system**, in order, each end of week:

1. **Revoke** — any `contested` opportunity whose target position was filled this week.
   It runs after `employment` (position 3 in the order), so a rival hire earlier in the
   same pass is already visible.
2. **Expire** — anything past `expiresAtWeek`.
3. **Offer** — roll new opportunities from the eligible pool.

Revoking and expiring before offering matters: a slot freed this week becomes
available to re-offer this week rather than next.

**Why explicit decline exists.** Letting an offer lapse and refusing it are different
acts, and NPCs remember (§14.6). Turning down a manager's offer to your face is a
relationship event; forgetting to answer is a different one. Without
`decline_opportunity` the engine cannot tell them apart, and `NPCMemory` loses a
distinction the narrative design depends on.

**Revocation is deliberate.** Design §14.3 makes `professional` and `senior` positions
finite and contested. If holding an unexpired offer reserved the slot, the rival could
never take it and the scarcity model would be decorative. Instead the offer evaporates
with a visible message — which is the moment the rival stops being a background
simulation and becomes something the player feels.

### 5.4.2 Scheduled Event Lifecycle

**Creation.** `EventOutcome.scheduledEvents: Array<{ eventId, inWeeks }>` produces a
`ScheduledEvent` with `scheduledWeek = currentWeek + inWeeks`, inheriting `chainId`
and `chainStep` from the emitting event. Recorded as `event_scheduled`.

**Firing.** The `events` system drains due entries **before** rolling anything random:

```text
events system:
  1. take every ScheduledEvent where scheduledWeek <= currentWeek
  2. fire each one unconditionally
  3. queue any with choices as PendingEventResponse for next week   (§11.5)
  4. then roll random eligible events by weight as normal
```

**Unconditionally** is exact: a scheduled event ignores `weight`, `cooldownWeeks`,
`unique`, and its own `conditions`. It was committed to when it was scheduled.

The alternative — re-checking eligibility at fire time — lets a multi-week chain break
silently in the middle. The eviction sequence schedules a hearing three weeks out; if
some condition drifts in week two, the player simply never gets the hearing and
nothing records why. That failure is invisible, which makes it the wrong default.

**Cancellation.** `EventOutcome.endsChain: true` cancels every pending
`ScheduledEvent` carrying that `chainId`, emitting `event_cancelled` for each. This is
the intended way to stop a sequence: paying off the arrears ends the eviction chain,
which cancels the hearing. Explicit, recorded, and inspectable in history.

> **Deliberate limitation.** A scheduled event with no `chainId` has no cancellation
> path — it fires regardless. If you schedule "the landlord visits in three weeks" as
> a standalone, it fires even after you move out. The fix is to put it in a chain, so
> that moving out can end the chain. Stated here so it is a known constraint rather
> than a surprise.

### 5.5 Goal State

```typescript
interface GoalState {
  definitionId: string;
  status: "active" | "completed" | "failed";

  satisfiedThisWeek: boolean;
  consecutiveWeeksSatisfied: number;
  requiredDurationWeeks?: number;

  firstSatisfiedWeek?: number;
  completedWeek?: number;
  failedWeek?: number;

  progressNotes: GoalProgressNote[];
}

interface GoalProgressNote {
  conditionIndex: number;
  satisfied: boolean;
  currentValue: unknown;
  targetValue: unknown;
}
```

`consecutiveWeeksSatisfied` resets to zero on any unsatisfied week — no partial
credit — which is what makes design §13.1's anti-exploit intent actually hold.

`progressNotes` exists to serve the Transparent Consequences principle: a client can
show *which* clause of a compound goal is currently unmet, not just that the goal
isn't done.

### 5.6 Economy State

```typescript
interface EconomyState {
  inflation: BasisPoints;
  unemploymentRate: BasisPoints;
  interestRate: BasisPoints;

  sectorDemand: Record<string, number>;      // exact value — hidden
  marketPrices: Record<string, Cents>;

  publishedIndicators: string[];   // which keys the player is allowed to see
  flags: Record<string, boolean>;
}

type DemandBand = "cold" | "steady" | "hot";

function demandBand(value: number): DemandBand;   // <35 cold, 35–65 steady, >65 hot
```

Rates are basis points rather than floats (§2.1). Both `Record` fields are subject to
§2.2's sorted-iteration rule — weighted price drift over an unsorted map would
diverge after a save/load round trip.

**Sector demand is banded, not hidden.** The exact number stays secret because it is
a direct input to job-availability rolls and exposing it would let players optimise
against the formula. But a person living in this world reads job boards and hears
about layoffs — hiding which industries are hiring entirely would make every
education decision a blind guess, which is the opposite of the Transparent
Consequences principle.

So projections expose `demandBand(value)` and never the value. Players learn that
logistics is hot and retail is cold; they do not learn that logistics is 71.

`publishedIndicators` controls the rest. Inflation, unemployment and interest are
newspaper facts and are published by default.

---

## 6. State Visibility and Projections

Design §3.6 declares values the player must not see. Revision 1 then handed clients
the entire `GameState`, making the hidden-information design documentation rather
than enforcement.

A projection is a narrower type. Clients are typed against it and **cannot reference
hidden fields, because the fields are not on the type**.

```typescript
interface PlayerVisibleState {
  gameId: string;
  status: GameStatus;
  calendar: CalendarState;

  player: VisiblePlayerState;      // no attributes.luck
  economy: VisibleEconomyState;    // published indicators only
  world: VisibleWorldState;        // no cooldowns, no weights, no rival internals

  activeEffects: VisibleStatusEffect[];   // only where visible === true
  opportunities: VisibleOpportunity[];
  goals: GoalState[];

  pendingEventResponses: PendingEventResponse[];
  recentHistory: HistoryEntry[];          // only where visible === true

  metadata: GameMetadata;
}
```

The narrowed types are derived from their authoritative counterparts rather than
hand-copied, so a new hidden field cannot leak by being forgotten in a parallel
definition:

```typescript
type VisiblePlayerState =
  Omit<ActorState, "attributes" | "relationships"> & {
    attributes: Omit<AttributeState, "luck">;
    relationships: VisibleRelationshipState[];
  };

type VisibleEconomyState =
  Pick<EconomyState, "inflation" | "unemploymentRate" | "interestRate"> & {
    marketPrices: Record<string, Cents>;        // filtered to publishedIndicators
    sectorDemand: Record<string, DemandBand>;   // banded, never the raw value
  };

type VisibleWorldState = {
  npcs: VisibleNPCState[];
  locations: LocationState[];
  jobMarket: JobMarketState;
  chainStates: EventChainState[];
  // no eventCooldowns, no firedUniqueEvents, no agents
};

type VisibleNPCState = Omit<NPCState, "flags" | "memories">;

type VisibleRelationshipState = Omit<RelationshipState, "resentment">;

type VisibleStatusEffect =
  Omit<StatusEffect, "modifiers"> & {
    magnitudeHint: "minor" | "moderate" | "major";
  };

/** Nothing is hidden on the instance — selection `weight` lives on
 *  OpportunityDefinition, and definitions are registry content, never projected. */
type VisibleOpportunity = Opportunity;
```

Excluded from every projection: `rng`, `attributes.luck`, **`ActorState.counters`**,
`RelationshipState.resentment`, `NPCState.memories`, `world.eventCooldowns`,
**`world.strangenessBase`**, `world.agents`, raw `EconomyState.sectorDemand` values,
`OpportunityDefinition.weight`, `AgentState.strategy`,
`EmployerDefinition.reputation`, and any `HistoryEntry`/`StateChange` marked
`visible: false`.

`counters` and `strangenessBase` are the two newest exclusions and both are
load-bearing for the narrative design: a player who can read the coffee count knows
they are being measured, and a player who can read the strangeness dial stops
noticing the drift and starts watching a number.

`ResolutionDebugInfo` is not in this list because it never travels through a
projection — it rides on `ActionOutcome` via `CommandResult`, gated by
`metadata.transparency` (§3.3).

`VisibleStatusEffect` replaces raw `modifiers` with a coarse magnitude hint. Exposing
the modifier list would leak exact numbers the player is not meant to compute with,
while showing nothing at all would make active effects invisible — the player should
know they are stressed and underslept, without being handed the arithmetic.

### 6.1 One Mechanism, Two Views

The rival's `PublicWorldState` is the same idea — a bounded view for a non-omniscient
consumer — so it is the same machinery, configured differently:

```typescript
type ProjectionAudience = "player" | "agent";

interface ProjectionConfig {
  audience: ProjectionAudience;
  informationAccess: "standard" | "enhanced";   // difficulty setting
}

function project(state: GameState, config: ProjectionConfig): PlayerVisibleState | PublicWorldState;

interface PublicWorldState {
  week: number;
  economy: VisibleEconomyState;
  jobMarket: JobMarketState;
  availableCourses: string[];
  availableHousing: string[];
  knownOpportunities: VisibleOpportunity[];
}
```

This makes design §14.2's fairness rule structural. "Improved information access" as
a difficulty advantage is literally `informationAccess: "enhanced"` widening the
projection — declared in the difficulty definition, visible to the player, and
impossible to grant by accident.

---

## 7. Base and Derived Values

Revision 1 specified `Modifier` and `activeEffects` without saying how modifiers
stack, in what order operations apply, when they expire relative to the needs pass,
or — most damagingly — what a `set` modifier restores when it ends. A modifier that
*sets* health to 50 for three weeks has nothing to return to, because the original
value was overwritten.

The cause is treating modifiers as mutations. The fix is treating them as a layer.

**State stores base values. Modifiers never write to state.** Derived values are
computed on read by applying every active modifier over the base.

```typescript
type DerivedPath =
  | `player.needs.${NeedKey}`
  | `player.attributes.${keyof AttributeState}`
  | `player.skills.${string}`
  | "player.housing.quality"
  | "player.career.effectivePerformance"
  | "calendar.energyRecoveryRate"
  | "world.strangeness";

interface DerivedValueResolver {
  resolve(path: DerivedPath, base: number, effects: StatusEffect[]): number;
  isReadOnly(path: string): boolean;
}
```

`DerivedPath` is a closed union, which is what lets §4.3's Tier 1 validation reject a
modifier targeting a derived field at load time rather than discovering it at runtime.

**Application order** is fixed:

```text
1. base value
2. all `add` and `subtract` modifiers, summed
3. all `multiply` modifiers, multiplied
4. `set` overrides, highest priority wins; ties broken by earliest appliedWeek
5. clamp to the field's declared range
```

**Stacking** is governed by `StatusEffect.stacking`. A second effect from the same
`sourceId` with `"refresh"` replaces the first and resets its expiry; `"stack"` adds
a second independent layer. Two different sources always stack.

**Expiry** is removal from `activeEffects` at the *start* of the week following
`expiresAtWeek`. An effect expiring in week 12 still applies throughout week 12. This
removes the off-by-one that would otherwise afflict every buff in the game.

Because nothing was ever overwritten, expiry has nothing to undo — the derived value
simply recomputes.

Design §9.1's derived `quality` falls out of this same mechanism rather than being a
special case. Derived paths are read-only; a modifier or content effect targeting one
is a Tier 1 validation error (`read_only_field`).

> **⚑ Judgement call.** Derived reads go through a resolver on every access, which
> costs against §1.5's budget. Assumed mitigation is memoizing per week per path and
> invalidating when `activeEffects` changes. If profiling contradicts this, the
> cache strategy changes — the model does not.

---

## 8. Player State

Everything a person in this world is made of. The player and every rival share this
shape — design §14.2 requires the rival to obey identical mechanics, and the only way
to guarantee that structurally is for both to run the same state through the same
systems.

```typescript
interface ActorState {
  identity: ActorIdentity;
  currentLocationId: string;
  finances: FinancialState;
  needs: NeedState;
  attributes: AttributeState;

  education: EducationState;
  career: CareerState;
  housing: HousingState;

  inventory: InventoryItem[];
  relationships: RelationshipState[];

  skills: Record<string, number>;
  traits: string[];
  reputation: Record<string, number>;

  flags: Record<string, boolean>;
  counters: Record<string, number>;   // hidden — never appears in a projection
}

/** The player is an actor. Alias kept for readability at call sites. */
type PlayerState = ActorState;
```

`counters` exists because `flags` is boolean-only and every statistic
[`02-narrative-voice.md`](02-narrative-voice.md) asks for is a count — cups of coffee
consumed, interviews survived, chairs accidentally broken, flies manually executed.

Counters are filled from two directions:

**Automatically, from the audit trail.** Every emitted `StateChange` increments
`counters[change.reason]`. The reason-code vocabulary is already a taxonomy of things
that happen, so "times evicted", "promotions", "checks failed" and "times rent went
overdue" come free with no authoring at all.

**Explicitly, from content.** `RewardType` includes `"counter"` for the statistics
that aren't state changes — the flies, the chairs, the twenty minutes spent looking
for keys that were in your hand. These only happen because an event says so.

Counters are excluded from every projection. A player who can see the coffee count
knows they are being measured, and the entire premise is that they should not.

Revision 1 named this `PlayerState` and then had `AgentState.player: PlayerState` —
a rival whose state was spelled "player". The parity requirement was real but lived
only in a comment. Naming the shared shape `ActorState` makes it legible in the type
system and removes the misleading field name.

All four `Record` fields — `skills`, `reputation`, `flags` and `counters` — are
subject to §2.2's sorted-iteration rule. `counters` is the newest and the easiest to
forget, because auto-increment writes to it from every reducer rather than from one
obvious place.

### 8.1 Identity

```typescript
interface ActorIdentity {
  actorId: string;          // "player" or a rival's agent id
  name: string;
  age: number;
  backgroundId: string;
}

type PlayerIdentity = ActorIdentity;
```

`actorId` is new and load-bearing: with rivals now holding their own relationships
(§8.9) and NPCs remembering things about specific actors (§14.6), every actor must be
addressable.

### 8.2 Finances

```typescript
interface FinancialState {
  cashCents: Cents;
  savingsCents: Cents;
  debtCents: Cents;

  weeklyIncomeCents: Cents;
  weeklyExpensesCents: Cents;

  overdueBalanceCents: Cents;
  creditScore?: number;

  accounts: FinancialAccount[];
}

interface FinancialAccount {
  id: string;
  kind: "checking" | "savings" | "credit_card" | "loan" | "investment";
  label: LocKey;

  balanceCents: Cents;            // negative = owed
  interestRate: BasisPoints;      // per annum
  minimumPaymentCents?: Cents;
  paymentDueWeek?: number;

  openedWeek: number;
  closedWeek?: number;
}
```

### 8.3 Needs

```typescript
interface NeedState {
  health: number;
  energy: number;
  happiness: number;
  stress: number;
  satiety: number;
}

type NeedKey = keyof NeedState;

const NEED_POLARITY: Record<NeedKey, "higher_is_better" | "lower_is_better"> = {
  health:    "higher_is_better",
  energy:    "higher_is_better",
  happiness: "higher_is_better",
  satiety:   "higher_is_better",
  stress:    "lower_is_better"
};
```

`satiety` replaces revision 1's `hunger`, which was genuinely ambiguous — `hunger: 90`
could mean starving or well-fed and content authors would have split on the guess.

`stress` keeps its name because players read high stress as bad without help.
`NEED_POLARITY` exists so that generic code — UI bar colouring, "most urgent need"
helpers, rival need-scoring, goal evaluation — cannot get direction wrong. Revision 1
applied one interpretation band to all five, formally asserting that `stress: 90` was
"Excellent."

Drift rates, zero-behaviour and clamp semantics are in design §3.3. Clamping applies
once per system pass, not per individual change.

### 8.4 Attributes

```typescript
interface AttributeState {
  intelligence: number;
  discipline: number;
  charisma: number;
  creativity: number;
  resilience: number;
  wisdom: number;
  luck: number;      // hidden — never appears in a projection
}
```

`wisdom` is new, added because
[`02-narrative-voice.md`](02-narrative-voice.md) awards it ("You spend twenty minutes
searching for your keys. They were in your hand. +1 Wisdom") and a narrative document
promising a stat the engine doesn't have is drift waiting to be discovered during
implementation.

> **⚑ Open.** Nothing currently reads `wisdom` — no `CheckDefinition`, no
> `Requirement`, no `PerformanceFactor` consults it. An attribute the engine never
> consults is dead weight, so it needs at least one consumer to earn its place. The
> natural candidates are resisting bad-decision events, or a `CheckModifier` on
> negotiation and bureaucracy checks. Flagged rather than silently invented.

### 8.5 Education

```typescript
interface EducationState {
  enrollments: CourseEnrollment[];
  credentials: Credential[];
  completedCourseIds: string[];
  failedCourseIds: string[];
}

interface CourseEnrollment {
  courseId: string;
  startedWeek: number;
  weeksCompleted: number;

  attendedUnits: number;
  studyUnits: number;
  missedSessions: number;

  tuitionPaidCents: Cents;
  tuitionOutstandingCents: Cents;

  retainedProgress: number;      // 0–100, carried from a prior failed attempt
  status: "active" | "completed" | "failed" | "withdrawn";
}

interface Credential {
  id: string;
  courseId: string;
  awardedWeek: number;
  level: CredentialLevel;
  labelKey: LocKey;
}

type CredentialLevel =
  | "none"
  | "school"
  | "certificate"
  | "diploma"
  | "degree"
  | "postgraduate";
```

`CredentialLevel` is ordered, so the scenario requirement "certificate or better"
is directly expressible.

### 8.6 Career

```typescript
interface CareerState {
  currentEmployment?: Employment;
  history: EmploymentRecord[];

  totalWeeksEmployed: number;
  pendingApplications: JobApplication[];

  highestTierAchieved: JobTier;
}

interface Employment {
  jobId: string;
  employerId: string;
  startedWeek: number;

  performance: number;           // 0–100
  attendanceRatio: number;       // 0–100, rolling
  warnings: number;
  probationUntilWeek?: number;

  weeklyPayCents: Cents;
  weeksAtCurrentPay: number;
}

interface EmploymentRecord {
  jobId: string;
  employerId: string;
  tier: JobTier;
  startedWeek: number;
  endedWeek: number;
  endReason: ReasonCode;
  finalPerformance: number;
}

interface JobApplication {
  jobId: string;
  submittedWeek: number;
  resolvesWeek: number;
  contested: boolean;
  outcome?: "pending" | "offered" | "rejected" | "position_filled";
}

type JobTier = "entry" | "skilled" | "professional" | "senior";

const JOB_TIER_RANK: Record<JobTier, number> = {
  entry: 0, skilled: 1, professional: 2, senior: 3
};
```

`JobTier` did not exist in revision 1, yet the first scenario's win condition read
"Employment level: Skilled" — a requirement referencing a field that was never
designed. Tags could have faked it, but tags have no ordering, so "skilled or better"
would have been inexpressible. Promotions, job requirements and career goals all need
the ranking.

### 8.7 Housing

```typescript
interface HousingState {
  definitionId: string;
  movedInWeek: number;

  ownership: "renting" | "owned" | "mortgaged" | "staying_with_someone";

  damage: number;                // 0–100, mutable
  weeklyCostCents: Cents;
  depositPaidCents: Cents;

  rentDueWeek: number;
  overdueRentCents: Cents;
  missedPayments: number;
  evictionStage: EvictionStage;

  landlordNpcId?: string;
}

type EvictionStage =
  | "none"
  | "warning"
  | "penalty"
  | "formal_notice"
  | "hearing_scheduled"
  | "evicted";

// Derived, read-only. Not stored.
// quality = clamp(round((comfort + safety) / 2) − round(damage × 0.6), 0, 100)
type HousingQuality = number;
```

`damage` and `quality` are both new. Revision 1's only complete content example
tested `player.housing.quality` and wrote `player.housing.damage`, and neither
existed anywhere in the specification — `HousingDefinition` had `comfort`, `safety`,
`prestige` and `storage`, and `HousingState` was undefined entirely. The maintenance
loop the design describes had nowhere to write.

`quality` is derived and read-only; writes to it fail Tier 1 validation.

### 8.8 Inventory

```typescript
interface InventoryItem {
  instanceId: string;
  definitionId: string;

  quantity: number;
  acquiredWeek: number;
  purchasePriceCents: Cents;

  condition: number;             // 0–100
  weeksSinceMaintenance: number;
  broken: boolean;
}
```

### 8.9 Relationships

A relationship is held by the **actor**, not by the NPC. Each actor carries their own
record of how a given NPC regards them.

```typescript
interface RelationshipState {
  npcId: string;
  category: "professional" | "personal" | "transactional" | "adversarial";

  affinity: number;
  trust: number;
  respect: number;
  resentment: number;      // hidden — never appears in a projection

  knownSinceWeek: number;
  lastInteractionWeek?: number;
  interactionCount: number;
}
```

Revision 1 had both `PlayerState.relationships: RelationshipState[]` and
`NPCState.relationship: NPCRelationship` without distinguishing them, and put the four
affective dimensions on the NPC. Because `NPCState` lives in the shared `WorldState`,
that gave each NPC exactly **one** relationship — implicitly the player's — so a rival
could not have a relationship with anyone. "Social climber" as a rival strategy preset
(design §14.1) was unimplementable.

Moving the dimensions onto the actor gives every actor their own social state and
leaves `NPCState` holding only what genuinely belongs to the NPC: its role,
availability, memories and flags. The same NPC can respect the player and resent the
rival, which is what a competitive life sim wants.

---

## 9. Actions

```typescript
type ActionType =
  | "work" | "work_overtime"
  | "search_for_work" | "apply_for_job" | "negotiate_job_terms"
  | "attend_class" | "study" | "enroll_course" | "withdraw_course"
  | "shop" | "eat" | "rest" | "exercise" | "socialize" | "travel"
  | "maintain_item" | "repair_item" | "sell_item"
  | "pay_bills" | "borrow_money" | "repay_debt" | "deposit_savings" | "invest"
  | "move_housing"
  | "start_project" | "work_on_project"
  | "start_business" | "operate_business"
  | "accept_opportunity" | "decline_opportunity"
  | "respond_to_event"
  | "custom";

interface GameAction {
  id: string;
  type: ActionType;
  actorId: string;

  targetId?: string;
  parameters: Record<string, unknown>;
}
```

`ActionType` is a closed union rather than `string`. An open string type would make
"is this action supported" a runtime question and leave `AvailableAction` unable to
enumerate anything. `"custom"` is the escape hatch for adapter-translated intent
(§15.1), and it resolves through the same validation as everything else.

`timeCost` is **removed**. In revision 1 the client supplied it while
`ValidationResult.calculatedTimeCost` implied the engine derived it — both cannot be
authoritative, and trusting the client's figure means a client (or an AI adapter
proposing a custom action) chooses its own costs. That directly contradicts the
central principle that clients never manipulate authoritative state, and would allow
fourteen zero-cost job applications a week.

Costs are always engine-derived and returned by `validateAction` and
`getTurnContext`. The same applies to money.

Example:

```json
{
  "id": "action-001",
  "type": "apply_for_job",
  "actorId": "player",
  "targetId": "job-junior-accountant",
  "parameters": {}
}
```

### 9.1 Action Plans

```typescript
interface WeeklyActionPlan {
  readonly week: number;
  readonly actions: readonly GameAction[];

  readonly totalTimeCost: number;      // engine-computed
  readonly totalMoneyCostCents: Cents; // engine-computed
}
```

`finalized` is gone. It had no setter and no defined effect, and `executeActionPlan`
consuming a plan already *is* the commit point. A client that wants a "ready to end
the week?" confirmation owns that prompt — it is presentation, not engine state. The
`plan_already_finalized` reason code goes with it.

Plans are immutable. Every edit returns a new plan with costs recomputed, so preview
is free and never requires re-validating from scratch.

Revision 1 promised add/remove/reorder/replace/preview affordances in the design
document but exposed no API for any of them — which is why its own flagship example
did `plan.actions.push(...)`, mutating an engine-produced object three lines after
declaring state immutable. The hedge ("should *preferably* return new snapshots")
existed to make that legal. Both are now resolved: the affordances are real methods
(§11), and immutability is unconditional.

---

## 10. Action Resolution

```typescript
interface ActionResolver {
  readonly type: ActionType;

  canExecute(state: GameState, action: GameAction, ctx: ResolutionContext): ValidationResult;
  calculate(state: GameState, action: GameAction, ctx: ResolutionContext): ActionOutcome;
  apply(state: GameState, outcome: ActionOutcome): GameState;
}

interface ResolutionContext {
  registry: ContentRegistry;
  week: number;
  rng: RngHandle;                  // scoped to this action's substream
  derived: DerivedValueResolver;
}
```

### 10.0 Resolver Dispatch

Resolvers are held in an exhaustive map built at engine construction:

```typescript
type ResolverTable = Record<Exclude<ActionType, "custom">, ActionResolver>;
```

`Record` over the closed union means **a missing resolver is a compile error**, not a
runtime surprise. Adding a member to `ActionType` without writing its resolver fails
the build — which is the behaviour you want from a union that content files reference
by name.

`"custom"` is excluded deliberately and has no resolver. It is a marker for
adapter-translated intent (§15.1), not an executable action: an adapter must translate
natural language into a concrete `ActionType` *before* submission. A `GameAction` with
`type: "custom"` reaching `validateAction` fails with `action_not_available`. This is
what stops an AI adapter from inventing mechanics — it cannot route around the table,
because there is no entry to route to.

### 10.1 Resolution Pipeline

```text
Receive action
→ Validate action schema
→ Validate actor
→ Validate target
→ Validate prerequisites
→ Validate location
→ Calculate time cost      ← engine-derived
→ Validate available time
→ Calculate money cost     ← engine-derived
→ Validate money
→ Validate inventory
→ Calculate modifiers
→ Perform seeded random roll if required
→ Produce outcome
→ Apply state changes via typed reducers
→ Emit StateChange audit records
→ Trigger dependent effects
→ Record history
```

### 10.2 Validation Result

```typescript
interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];

  calculatedTimeCost?: number;
  calculatedMoneyCostCents?: Cents;
}

interface ValidationError {
  code: ReasonCode;
  messageKey: LocKey;
  field?: string;
  actionId?: string;
  details?: Record<string, unknown>;   // e.g. { required: 45, actual: 12 }
}

interface ValidationWarning {
  code: ReasonCode;
  messageKey: LocKey;
  actionId?: string;
  details?: Record<string, unknown>;
}
```

`details` carries the numbers behind the refusal, which is what lets a client render
"you need Maintenance 45, you have 12" rather than a bare rejection — the
Transparent Consequences principle made concrete.

### 10.3 Action Outcome

```typescript
interface ActionOutcome {
  actionId: string;
  success: boolean;

  degree:
    | "critical_failure"
    | "failure"
    | "partial"
    | "success"
    | "critical";

  reason: ReasonCode;

  changes: StateChange[];
  generatedEvents: string[];
  generatedOpportunities: string[];
  messages: OutcomeMessage[];

  debug?: ResolutionDebugInfo;
}

interface OutcomeMessage {
  key: LocKey;
  params?: Record<string, string | number>;
  tone?: "neutral" | "positive" | "negative" | "absurd";
  visible: boolean;
}
```

### 10.4 State Changes Are Audit Records

State is mutated by **typed reducers**. `StateChange` is what a reducer *emits* to
describe what it did — a record for the history log, the weekly summary and the
transparency requirement.

```typescript
type StateChangeValue = number | string | boolean;

interface StateChange {
  path: string;
  operation: "set" | "increment" | "decrement" | "add" | "remove";
  value: StateChangeValue;
  previousValue?: StateChangeValue;

  reason: ReasonCode;
  sourceId?: string;
  visible: boolean;
}
```

Revision 1 used this struct as the mutation *mechanism*. That reintroduces untyped
mutation on top of TypeScript: a typo in `"player.needs.happines"` silently creates a
field rather than failing to compile — which is precisely the class of bug that put
two non-existent housing fields into the specification's own example. `value: unknown`
combined with an operation was unsound, array `add`/`remove` had no defined identity
semantics, and load-time validation had nothing to check paths against.

Reducers are ordinary typed functions:

```typescript
function applyNeedChange(
  state: GameState,
  need: NeedKey,
  delta: number,
  reason: ReasonCode
): { state: GameState; change: StateChange };
```

The audit record keeps everything the transparency and history features needed. The
untyped write path is gone. `visible` on each change closes the leak where a visible
history entry could carry a change to a hidden field such as `attributes.luck`.

Direct mutation from clients remains impossible: clients hold a projection (§6),
not state.

---

## 11. Engine API

```typescript
function createEngine(registry: ContentRegistry): GameEngine;

interface GameEngine {
  // lifecycle
  createGame(config: NewGameConfig): CommandResult<GameState>;

  // reading
  getTurnContext(state: GameState): TurnContext;
  getPlayerView(state: GameState): PlayerVisibleState;

  // planning — every method returns a new plan
  createActionPlan(state: GameState): WeeklyActionPlan;
  addAction(state: GameState, plan: WeeklyActionPlan, action: GameAction): PlanEditResult;
  removeAction(state: GameState, plan: WeeklyActionPlan, actionId: string): PlanEditResult;
  replaceAction(state: GameState, plan: WeeklyActionPlan, actionId: string, replacement: GameAction): PlanEditResult;
  reorderActions(state: GameState, plan: WeeklyActionPlan, orderedActionIds: string[]): PlanEditResult;
  previewPlan(state: GameState, plan: WeeklyActionPlan): PlanPreview;

  // validation
  validateAction(state: GameState, action: GameAction): ValidationResult;
  validateActionPlan(state: GameState, plan: WeeklyActionPlan): ValidationResult;

  // execution
  executeActionPlan(state: GameState, plan: WeeklyActionPlan): ActionPlanExecutionResult;
  respondToEvent(state: GameState, pendingResponseId: string, choiceId: string): EventResolution;
  endWeek(state: GameState): WeekResolution;

  // persistence
  serialize(state: GameState): string;
  deserialize(data: string): CommandResult<GameState>;
  migrate(data: string): CommandResult<GameState>;
}
```

### 11.1 Configuration and Context

```typescript
interface NewGameConfig {
  seed: string;
  scenarioId: string;
  difficultyId: string;
  backgroundId: string;

  playerName: string;
  mode: GameMode;

  goalIds?: string[];
  rival?: RivalConfig;

  transparency?: TransparencyLevel;   // default "off"
}

interface RivalConfig {
  strategyId: string;
  informationAccess?: "standard" | "enhanced";
  startingAdvantages?: Modifier[];
}

interface TurnContext {
  week: number;

  totalTimeUnits: number;
  committedTimeUnits: number;
  availableTimeUnits: number;

  mandatoryCommitments: MandatoryCommitment[];
  availableActions: AvailableAction[];
  pendingEventResponses: PendingEventResponse[];

  activeGoals: GoalState[];
  warnings: ValidationWarning[];
}

interface MandatoryCommitment {
  sourceId: string;
  sourceKind: "job" | "course" | "medical" | "contract" | "event";
  timeUnits: number;
  labelKey: LocKey;
  skippable: boolean;
  skipConsequenceKey?: LocKey;
}

interface AvailableAction {
  type: ActionType;
  targetId?: string;
  labelKey: LocKey;

  timeCost: number;
  moneyCostCents: Cents;

  available: boolean;
  blockedBy: ValidationError[];
}
```

`AvailableAction.blockedBy` means a client can grey out an action *and say why*
without a separate call — the Transparent Consequences requirement that the player
should understand why an action is unavailable.

`AvailableAction` includes `travel` entries for each location reachable from the
actor's current position, so a client can render both "what can I do here" and "where
can I go" from one call.

The rule that `endWeek` refuses a week with unanswered `pendingEventResponses` is
specified in §11.5 alongside the rest of the week-boundary contract.

### 11.2 Command Results

```typescript
interface CommandResult<T> {
  success: boolean;
  value?: T;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

interface PlanEditResult extends CommandResult<WeeklyActionPlan> {}

interface PlanPreview {
  totalTimeCost: number;
  availableTimeUnits: number;
  totalMoneyCostCents: Cents;
  projectedCashCents: Cents;
  overCommitted: boolean;
  perAction: Array<{ actionId: string; timeCost: number; moneyCostCents: Cents }>;
}

interface ActionPlanExecutionResult extends CommandResult<GameState> {
  outcomes: ActionOutcome[];
  changes: StateChange[];
  messages: OutcomeMessage[];
  failedActionId?: string;      // set on failure; no state was applied
}

interface EventResolution extends CommandResult<GameState> {
  eventId: string;
  choiceId: string;
  outcome?: ActionOutcome;
  changes: StateChange[];
  messages: OutcomeMessage[];
}

interface WeekResolution extends CommandResult<GameState> {
  week: number;
  summary: WeeklySummary;
  changes: StateChange[];
  triggeredEvents: string[];
  deferredEventResponses: PendingEventResponse[];
  goalUpdates: GoalState[];
  statusChanged?: GameStatus;
}

interface WeeklySummary {
  week: number;
  incomeCents: Cents;
  expensesCents: Cents;
  netCents: Cents;
  needsDelta: Record<NeedKey, number>;
  headlineKeys: LocKey[];
}
```

### 11.3 Immutability

Engine operations **return new state snapshots and never mutate caller-owned state.**
This is unconditional. Revision 1's "should preferably" would have been violated
within a fortnight, and the benefits it claimed — replay, state comparison,
debugging, multi-client safety — all depend on it holding absolutely.

### 11.4 Plan Execution Is Atomic

`executeActionPlan` is all-or-nothing. If any action fails, **no state is applied** —
the returned `value` equals the input state, `success` is `false`, `failedActionId`
names the action, and `errors` explains why.

Revision 2 implied partial execution via `stoppedAtActionId` without saying what
happened to the actions that had already run. That ambiguity is expensive in exactly
the place it hurts most: every test of a multi-action plan would have to assert on
intermediate state, and a replay would need to record how far execution got.

Atomicity is affordable here because `validateActionPlan` exists to catch problems
*before* execution. A client that validates first should never see a mid-plan failure;
if it does, that is a bug in cost derivation, not an expected path.

There is no per-action commit path: execution is the plan, applied atomically. A client
that wants finer granularity submits smaller plans.

### 11.5 The Week Boundary

`endWeek` runs `END_WEEK_SYSTEM_ORDER`, then `START_WEEK_SYSTEM_ORDER`, and returns
state **positioned at the start of week N+1** — calendar advanced, effects expired,
commitments recomputed, deferred events queued, ready to plan.

`createGame` runs the start-of-week pass once so week 1 is equally ready.

The client loop is therefore:

```text
getTurnContext → respond to pending events → build plan → executeActionPlan → endWeek → repeat
```

There is no `beginWeek`. A separate call would be forgettable, and forgetting it
produces a silently wrong time budget rather than an error — the worst available
failure mode. Nothing is lost by collapsing the boundary: `WeekResolution` is the
record of the week that just ended, and its history entries capture the end-of-N
state for anything that needs to inspect it.

`endWeek` refuses to run while `pendingEventResponses` is non-empty, returning an
error rather than silently discarding an unanswered decision.

---

## 12. Engine Systems

```typescript
interface GameSystem {
  id: SystemId;
  process(state: GameState, context: SystemContext): SystemResult;
}

type SystemId =
  // start of week
  | "time_advance" | "effects" | "time_commit"
  // end of week
  | "employment" | "education"
  | "finance_income" | "finance_reconcile"
  | "inventory" | "housing" | "needs"
  | "relationships" | "opportunities"
  | "events" | "headline" | "goals" | "failure" | "achievements" | "history";

interface SystemContext {
  registry: ContentRegistry;
  week: number;
  rng: RngHandle;                 // scoped to { kind: "system", system, week }
  derived: DerivedValueResolver;
}

interface SystemResult {
  state: GameState;
  changes: StateChange[];
  messages: OutcomeMessage[];
  generatedEvents: string[];
  generatedOpportunities: string[];
  diagnostics: ValidationWarning[];
}
```

### 12.1 Start-of-Week Order

A week does not begin implicitly. Four systems run in a defined order between
`endWeek` returning and the player planning the next week:

```typescript
const START_WEEK_SYSTEM_ORDER: SystemId[] = [
  "time_advance",   // increment currentWeek, reset spentTimeUnits
  "effects",        // expire activeEffects past expiresAtWeek
  "time_commit",    // recompute committedTimeUnits from job and course commitments
  "events"          // present pendingEventResponses deferred from last week
];
```

The time system is deliberately two entries. The week must increment **before**
expiry, because `expiresAtWeek` is compared against the new week number. But
commitments must be recomputed **after** expiry, because an expiring "reduced hours"
or "medical leave" effect changes what those commitments are. Collapsing them into a
single pass forces one of the two to be wrong, and the failure is silent — the player
is quietly granted or robbed of time units with nothing to indicate it.

This ordering exists because §7 requires effect expiry to happen "at the start of the
week following `expiresAtWeek`". Revision 1 had no start-of-week phase at all, so
`TimeSystem` was declared in the system list and never executed, and the expiry rule
had no defined moment to fire.

### 12.2 End-of-Week Order

```typescript
const END_WEEK_SYSTEM_ORDER: SystemId[] = [
  "employment",
  "education",
  "finance_income",       // wages in, scheduled expenses out
  "inventory",
  "housing",              // rent levied, maintenance, damage
  "finance_reconcile",    // overdue balances, late fees, eviction advancement
  "needs",
  "relationships",
  "opportunities",
  "events",
  "headline",             // draw one, without replacement
  "goals",
  "failure",
  "achievements",         // evaluate after everything that could unlock one
  "history"
];
```

Order must be stable and covered by tests.

`headline` runs after `events` so a week's headline can reference the strangeness
level that week's events just moved. `achievements` runs second-to-last because an
achievement condition may depend on anything earlier in the pass — including a
counter incremented by the failure system.

**Why finance is two passes.** The finance system does two jobs that want opposite
positions relative to housing:

| Job | Must run | Because |
|---|---|---|
| Income and scheduled expenses | **before** housing | Rent should be payable from this week's wages |
| Overdue reconciliation, late fees, eviction advancement | **after** housing | It must see rent that just went unpaid |

Revision 1 ran both as a single `finance` pass before `housing`, so reconciliation
never saw the current week's rent — late fees and each rung of the eviction ladder
landed a week behind their cause, roughly six weeks of drift across the full
escalation. Simply swapping `finance` and `housing` would have fixed that and broken
the other half, charging rent before wages arrived and producing false overdrafts for
solvent players. Splitting the pass is the only ordering that satisfies both.

### 12.3 Goals and Failure Precedence

`goals` runs before `failure`. When a completion condition and a failure condition are
both satisfied at the end of the same week, precedence is **declared by the scenario**:

```typescript
type GoalFailurePrecedence = "goals_win" | "failure_wins";
```

`ScenarioDefinition.goalFailurePrecedence` defaults to `"goals_win"`.

The default exists because the alternative produces the worst available ending —
"you reached $2,000. You were also evicted. You lose." — and punishes the player for
losing a race they could not see. Rewarding a desperate final-week scramble is the
better default game.

Making it per-scenario rather than global lets a deliberately brutal challenge
scenario opt into `"failure_wins"`, where surviving matters more than achieving.
Difficulty of this kind should be an authored choice, not a global rule.

---

## 13. Conditions, Requirements, Modifiers and Rewards

### 13.1 Conditions

Conditions form a nestable logical tree. Revision 1's flat `Condition[]` meant
implicit AND and nothing else — "unemployed **or** stress above 70" was inexpressible
without authoring two near-identical events that then drift apart, and
`failureConditions` on goals had the same ceiling.

```typescript
type Condition =
  | ComparisonCondition
  | { all: Condition[] }
  | { any: Condition[] }
  | { not: Condition }
  | ExistsCondition
  | CountCondition;

interface ComparisonCondition {
  field: string;
  operator: ComparisonOperator;
  value: unknown;
}

type ComparisonOperator =
  | "equals" | "not_equals"
  | "less_than" | "less_or_equal"
  | "greater_than" | "greater_or_equal"
  | "in" | "not_in"
  | "contains" | "has_tag" | "has_flag";

type CollectionSelector =
  | "player.inventory"
  | "player.relationships"
  | "player.education.credentials"
  | "player.career.history"
  | "world.npcs"
  | "world.jobMarket.openings"
  | "state.goals"
  | "state.activeEffects";
```

Counters are scalar, not a collection, so an achievement condition reads them as an
ordinary comparison — `field: "player.counters.flies_executed"`, `operator:
"greater_or_equal"`, `value: 100`. That is the whole of *Predator of the Air*.

```typescript
interface ExistsCondition {
  exists: { collection: CollectionSelector; where: Condition };
}

interface CountCondition {
  count: { collection: CollectionSelector; where: Condition };
  operator: ComparisonOperator;
  value: number;
}
```

The quantifiers are not optional extras. Design §6.2 requires clothing and
transportation as job prerequisites, and those are naturally tag-based — "owns any
item tagged `formal_clothing`" cannot be written without `exists`.

`ComparisonOperator` was referenced throughout revision 1 and never enumerated,
which left the entire content condition language formally unspecified.

### 13.2 Requirements

```typescript
interface Requirement {
  type: RequirementType;
  condition: Condition;
  failureCode: ReasonCode;
  messageKey: LocKey;
}

type RequirementType =
  | "skill" | "attribute" | "credential" | "item" | "money"
  | "relationship" | "location" | "event_completed" | "need"
  | "job_tier" | "age" | "flag";
```

### 13.3 Modifiers

```typescript
interface Modifier {
  target: string;                 // must resolve to a writable base path
  operation: "add" | "subtract" | "multiply" | "set";
  value: number;
  durationWeeks?: number;
  sourceId: string;
  priority?: number;              // `set` conflict resolution; default 0
}
```

Application order, stacking and expiry are specified in §7. `multiply` uses
`value / 100` as a percentage against integer bases, rounded half-away-from-zero
after the full chain.

**Addressing collection members.** Several state collections are arrays rather than
`Record`s, and content needs to target one member of them — the landlord's affinity,
one item's condition. Array-typed state is addressed **by its natural key**, never by
index:

| Collection | Key | Example target |
|---|---|---|
| `player.relationships` | `npcId` | `player.relationships.npc-landlord.affinity` |
| `player.inventory` | `instanceId` | `player.inventory.item-0041.condition` |
| `player.education.enrollments` | `courseId` | `player.education.enrollments.crs-bookkeeping.studyUnits` |
| `world.npcs` | `id` | `world.npcs.npc-landlord.currentRole` |

Index addressing is forbidden: array order is not part of the state contract, so
`relationships.0.affinity` would target a different NPC after any reordering and
silently corrupt a save. Tier 1 validation rejects numeric path segments.

### 13.4 Rewards

```typescript
interface Reward {
  type: RewardType;
  target?: string;
  value?: unknown;
  parameters?: Record<string, unknown>;
}

type RewardType =
  | "credential" | "skill" | "attribute" | "money" | "item"
  | "reputation" | "relationship" | "unlock_location"
  | "unlock_course" | "opportunity" | "flag" | "modifier"
  | "counter";        // increments ActorState.counters — see §8
```

---

## 14. Content Definition Types

### 14.1 Jobs

```typescript
interface JobDefinition {
  id: string;
  titleKey: LocKey;
  descriptionKey: LocKey;

  employerId: string;
  careerPathId: string;
  tier: JobTier;

  schedule: JobSchedule;
  compensation: JobCompensation;

  requirements: Requirement[];
  performance: JobPerformanceRules;

  promotionPaths: PromotionPath[];
  terminationRules: TerminationRule[];

  contested: boolean;
  positionsAvailable?: number;    // required when contested

  tags: string[];
}

interface JobSchedule {
  weeklyTimeCost: number;
  flexibility: number;
  requiredDays?: string[];
  shiftTypes?: string[];
  remoteEligible?: boolean;
}

interface JobCompensation {
  baseWeeklyPayCents: Cents;
  performanceBonusCents?: Cents;
  commissionRate?: BasisPoints;
  overtimeRate?: BasisPoints;
  benefits?: string[];
}

interface JobPerformanceRules {
  factors: PerformanceFactor[];
  weeklyDriftToward: number;      // performance regresses toward this baseline
  minimumAcceptable: number;
}

interface PerformanceFactor {
  source: "skill" | "attribute" | "need" | "relationship" | "item" | "housing";
  key: string;
  weight: number;                 // may be negative, e.g. stress
}

interface PromotionPath {
  toJobId: string;
  minimumWeeksInRole: number;
  minimumPerformance: number;
  requirements: Requirement[];
  contested: boolean;
  baseChance: number;
}

interface TerminationRule {
  code: ReasonCode;
  condition: Condition;
  warningsBeforeTermination: number;
  severanceWeeks?: number;
  messageKey: LocKey;
}
```

### 14.2 Courses

```typescript
interface CourseDefinition {
  id: string;
  nameKey: LocKey;
  descriptionKey: LocKey;
  providerId: string;

  tuitionCents: Cents;
  durationWeeks: number;
  weeklyTimeCost: number;
  difficulty: number;

  seatsAvailable?: number;        // absent = uncapped
  requirements: Requirement[];
  rewards: Reward[];
  awardsCredential?: CredentialLevel;

  failureRules: CourseFailureRules;
  tags: string[];
}

interface CourseFailureRules {
  minimumAttendanceRatio: number;
  minimumStudyUnitsPerWeek: number;
  maximumMissedSessions: number;
  tuitionGraceWeeks: number;
  maximumStress?: number;
  progressRetainedOnFailure: number;   // 0–100
}
```

### 14.3 Housing

```typescript
interface HousingDefinition {
  id: string;
  nameKey: LocKey;
  descriptionKey: LocKey;

  upfrontCostCents: Cents;
  weeklyCostCents: Cents;
  depositCents?: Cents;

  capacity: number;
  comfort: number;
  safety: number;
  prestige: number;
  storage: number;

  commuteModifier: number;
  energyRecoveryModifier: number;
  happinessModifier: number;
  healthModifier: number;

  maintenanceRisk: number;
  unitsAvailable?: number;        // absent = uncapped

  requirements: Requirement[];
  tags: string[];
}
```

### 14.4 Items

```typescript
interface ItemDefinition {
  id: string;
  nameKey: LocKey;
  descriptionKey: LocKey;
  category: string;

  purchasePriceCents: Cents;
  baseResaleValueCents: Cents;
  weeklyCostCents?: Cents;

  effects: Modifier[];
  stacking: "refresh" | "stack";

  durability?: number;
  maintenanceRules?: MaintenanceRule[];

  requirements: Requirement[];
  tags: string[];
}

interface MaintenanceRule {
  intervalWeeks: number;
  costCents: Cents;
  timeCost: number;
  skillCheck?: CheckDefinition;
  conditionLossIfSkipped: number;
  breakageChanceAtZeroCondition: number;
}
```

### 14.5 Events

```typescript
interface EventDefinition {
  id: string;
  category: string;
  titleKey: LocKey;
  descriptionKey: LocKey;

  weight: number;
  conditions: Condition;

  cooldownWeeks?: number;
  unique?: boolean;

  choices?: EventChoice[];
  automaticOutcome?: EventOutcome;

  chainId?: string;
  chainStep?: number;

  tags: string[];
}

interface EventChoice {
  id: string;
  labelKey: LocKey;

  timeCost?: number;
  moneyCostCents?: Cents;

  requirements?: Requirement[];
  check?: CheckDefinition;

  outcomes: ConditionalOutcome[];
}

interface ConditionalOutcome {
  condition?: Condition;
  onDegree?: ActionOutcome["degree"][];
  weight?: number;
  outcome: EventOutcome;
}

interface EventOutcome {
  effects: Modifier[];
  rewards?: Reward[];
  messages: OutcomeMessage[];

  generatedEvents?: string[];
  scheduledEvents?: Array<{ eventId: string; inWeeks: number }>;
  generatedOpportunities?: string[];

  advancesChain?: boolean;
  endsChain?: boolean;
}

interface CheckDefinition {
  skill?: string;
  attribute?: keyof AttributeState;
  difficulty: number;

  modifiers?: CheckModifier[];
  criticalSuccessMargin?: number;
  criticalFailureMargin?: number;

  minimumChance?: number;         // default 5
  maximumChance?: number;         // default 95
}

interface CheckModifier {
  source: "skill" | "attribute" | "need" | "reputation" | "relationship" | "item";
  key: string;
  weight: number;
}
```

An event whose selected choice set is non-empty defers to the following week (§5.4).
An event with only an `automaticOutcome` resolves immediately within end-of-week
processing.

### 14.6 NPCs

```typescript
interface NPCDefinition {
  id: string;
  nameKey: LocKey;
  descriptionKey: LocKey;

  defaultRole: string;
  initialRelationship: NPCRelationship;
  availability: AvailabilityRule[];

  tags: string[];
}

interface NPCState {
  id: string;
  definitionId: string;

  memories: NPCMemory[];

  currentRole: string;
  availability: AvailabilityRule[];

  flags: Record<string, boolean>;
}

/** The affective dimensions. Held by actors (§8.9), not by NPCs. */
interface NPCRelationship {
  affinity: number;
  trust: number;
  respect: number;
  resentment: number;    // hidden — never appears in a projection
}

interface NPCMemory {
  id: string;
  aboutActorId: string;      // whom this memory concerns
  eventId?: string;
  week: number;

  category: string;
  magnitude: number;

  descriptionKey: LocKey;
  expiresAtWeek?: number;
}

interface AvailabilityRule {
  locationId?: string;
  fromWeek?: number;
  toWeek?: number;
  condition?: Condition;
}
```

### 14.7 Goals, Scenarios, Difficulty

```typescript
interface GoalDefinition {
  id: string;
  labelKey: LocKey;
  descriptionKey: LocKey;
  category: string;

  conditions: Condition;
  requiredDurationWeeks?: number;
  failureConditions?: Condition;

  rewards?: Reward[];
}

interface ScenarioDefinition {
  id: string;
  nameKey: LocKey;
  descriptionKey: LocKey;

  startingBackgroundIds: string[];
  startingCashCents: Cents;
  startingHousingId: string;
  startingLocationId: string;
  startingInventory: Array<{ definitionId: string; quantity: number }>;

  goalIds: string[];
  weekLimit?: number;
  mode: GameMode;

  goalFailurePrecedence: GoalFailurePrecedence;   // default "goals_win"
}

interface DifficultyDefinition {
  id: string;
  labelKey: LocKey;

  economyModifiers: Modifier[];
  needDriftModifiers: Modifier[];
  checkDifficultyOffset: number;

  rivalInformationAccess: "standard" | "enhanced";
  rivalStartingAdvantages: Modifier[];
}
```

Every rival advantage is declared here and nowhere else, which is what makes design
§14.2's "any advantage must be explicit" auditable.

### 14.8 Supporting Definitions

```typescript
interface OpportunityDefinition {
  id: string;
  kind: OpportunityKind;
  targetId: string;              // jobId, courseId, housingId, npcId — by kind

  nameKey: LocKey;
  descriptionKey: LocKey;

  durationWeeks: number;         // how long the offer stands once made
  weight: number;                // pool selection — hidden, never projected
  conditions?: Condition;        // eligibility to be offered at all
  requirements?: Requirement[];  // what accepting demands

  terms?: Record<string, unknown>;
  acceptRewards?: Reward[];
  contested: boolean;            // may be revoked when the position is filled

  tags: string[];
}

interface AchievementDefinition {
  id: string;
  nameKey: LocKey;              // "They Seem To Like You", not "First Promotion"
  descriptionKey: LocKey;

  condition: Condition;         // typically over counters — see §8
  hidden: boolean;              // true = not listed until unlocked

  scope: "profile";             // v1: always profile-scoped
}

interface HeadlineDefinition {
  id: string;
  textKey: LocKey;

  minStrangeness?: number;
  maxStrangeness?: number;
  conditions?: Condition;

  tags: string[];
}

interface EmployerDefinition {
  id: string;
  nameKey: LocKey;
  sector: string;
  reputation: number;             // hidden
  jobIds: string[];
  npcIds: string[];
}

interface LocationDefinition {
  id: string;
  nameKey: LocKey;
  descriptionKey: LocKey;

  connections: string[];          // adjacent location ids — the map graph
  travelTimeUnits: number;        // cost to enter this location from an adjacent one
  actionTypes: ActionType[];      // what can be done here

  unlockedBy?: Condition;
}
```

The map is an explicit adjacency graph. `travel` moves to an **adjacent** location
only — no pathfinding in v1 — so a multi-hop journey costs multiple actions and
multiple time units. That is the intended constraint, not a limitation: geography is
a real budget line, and routing is part of the weekly decision.

`actionTypes` is what makes §10.1's "Validate location" step executable. An action
whose `type` is not in the current location's `actionTypes` fails with
`wrong_location`. Revision 2 had a validation step, a `travel` action type, a
`travelTimeUnits` field, a `LocationState` record and a `"location"` requirement
type — five references to a concept with no state behind it, because `ActorState` had
no location. `currentLocationId` (§8) is what they were all missing.

`travel` resolves like any other action. Its `targetId` is a location id; its derived
time cost is that location's `travelTimeUnits`; and it is valid only when the target
appears in the current location's `connections`. Attempting a non-adjacent hop fails
with `wrong_location`.

```typescript
interface BackgroundDefinition {
  id: string;
  nameKey: LocKey;
  descriptionKey: LocKey;
  startingAttributes: AttributeState;
  startingSkills: Record<string, number>;
  startingCredentials: CredentialLevel[];
  startingTraits: string[];
  startingCashModifierCents: Cents;
}

interface TraitDefinition {
  id: string;
  nameKey: LocKey;
  descriptionKey: LocKey;
  effects: Modifier[];
  conflictsWith: string[];
}

interface SkillDefinition {
  id: string;
  nameKey: LocKey;
  category: string;
  decayPerWeek: number;
}
```

### 14.9 Agents

```typescript
interface AgentStrategy {
  id: string;
  selectActions(view: PublicWorldState, agent: AgentState): GameAction[];
}

interface AgentState {
  id: string;
  strategyId: string;
  displayNameKey: LocKey;

  actor: ActorState;              // identical shape to the player
  goals: GoalState[];

  planningDepth: number;
  strategy: Record<string, unknown>;   // hidden — never projected
}
```

The rival runs `ActorState` because design §14.2 requires identical mechanics. Every
system that processes the player processes rivals through the same code path, so the
two cannot diverge silently — a bug in employment resolution affects both, and a rule
change cannot be applied to one and forgotten for the other.

`strategy` and `planningDepth` are the only agent-specific fields, and both are
hidden from every projection.

---

## 15. External Intelligence Boundary

### 15.1 Allowed Responsibilities

An external intelligence adapter may:

- Interpret natural-language player intent.
- Convert intent into structured action proposals.
- Generate narration from structured outcomes.
- Generate dialogue from NPC state.
- Assist developers with content creation.
- Produce alternative text variants.
- Summarize weekly results.

### 15.2 Prohibited Responsibilities

An external intelligence adapter must not:

- Create money.
- Modify stats directly.
- Ignore prerequisites.
- Decide success without an engine result.
- Change historical state.
- Invent completed actions.
- Create permanent content silently.
- Reveal hidden state accidentally.
- Override random outcomes.
- Bypass validation.

Several of these are now structurally impossible rather than merely forbidden. An
adapter receives a projection (§6), so it cannot reveal `luck` or `resentment` — it
never had them. It cannot set an action's cost, because `GameAction` no longer
carries one (§9).

### 15.3 Bounded Context

Requests receive only the context required for the task.

```json
{
  "week": 12,
  "action": { "type": "apply_for_job", "target": "junior-accountant" },
  "outcome": { "degree": "failure", "reason": "missing_credential" },
  "visibleStateChanges": [],
  "tone": "satirical"
}
```

```json
{
  "npcId": "npc-restaurant-manager",
  "attitude": "skeptical",
  "trust": 22,
  "respect": 31,
  "currentNeed": "weekend_staff",
  "negotiationResult": "partial_success"
}
```

`reason` is a `ReasonCode` (§2.3), not free text. The authoritative state remains
inside the engine.

---

## 16. Save and Serialization

A save must contain everything required to reproduce the simulation:

- Game state.
- Seed.
- **Random-generator state.**
- Engine version.
- Resolved content pack set.
- Scenario and difficulty.
- Active, scheduled and pending events.
- Active opportunities.
- NPC memories.
- Retained history.
- Action log.
- Goal progress.

### 16.1 Save Envelope

```typescript
interface SaveEnvelope {
  formatVersion: number;
  engineVersion: string;
  contentPacks: ResolvedContentPack[];
  savedAt: string;

  replayCompatible: boolean;
  checksum: string;

  state: GameState;
}
```

### 16.2 Migration and the Replay Boundary

§1.1 scopes determinism to a single engine version. §16.3 supports migrating saves
between versions. These are compatible only if the consequence is stated:

**A migrated save is not replay-compatible.** Its recorded action log can no longer
be guaranteed to reproduce its recorded history, because the rules that produced that
history have changed.

Migration therefore sets `replayCompatible: false`. Replay tooling refuses such a
save rather than producing plausible, wrong results. The compacted history (§17.1)
survives migration intact, so the player's journal is unaffected — only exact
reproduction is lost.

### 16.3 The Player Profile

A second, much smaller save artifact, separate from `GameState` and outliving any
single game.

```typescript
interface PlayerProfile {
  formatVersion: number;
  profileId: string;

  lifetimeWeeksPlayed: number;
  gamesStarted: number;
  gamesCompleted: number;

  lifetimeCounters: Record<string, number>;
  unlockedAchievements: UnlockedAchievement[];
  profileChainStates: EventChainState[];   // scope === "profile" only

  updatedAt: string;
}

interface UnlockedAchievement {
  achievementId: string;
  unlockedAt: string;
  atLifetimeWeek: number;
  inGameId: string;
}
```

Achievements that reset every playthrough are strange — *Predator of the Air* asks for
100 flies, and the joke depends on the count accumulating quietly over a long time
without the player ever being told it was being kept. Profile scope is what makes
that possible.

It also gives profile-scoped chains (§5.3.2) somewhere to live, so gap 6 and gap 2
are the same save artifact rather than two separate mechanisms.

**Boundary rules.** The profile is written at `endWeek` and at game completion. It is
never read during resolution — nothing mechanical depends on it, so a missing or
corrupt profile degrades to "no achievements, gags restart" rather than breaking a
game. This keeps determinism intact: a golden-master fixture replays identically
regardless of profile state, because no resolver ever consults it.

`lifetimeCounters` accumulates the per-game `ActorState.counters` at game end.

### 16.4 Migration Rules

A migration must:

- Preserve state where possible.
- Record the migration in `metadata.migrations`.
- Fail clearly when a save cannot be migrated.
- Never silently discard important state.

---

## 17. History and Replay

```typescript
interface HistoryEntry {
  id: string;
  week: number;
  sequence: number;

  category: string;
  sourceId?: string;

  summaryKey: LocKey;
  summaryParams?: Record<string, string | number>;
  stateChanges: StateChange[];

  visible: boolean;
  compacted: boolean;
}

interface LoggedAction {
  week: number;
  sequence: number;
  action: GameAction;
  eventResponse?: { eventId: string; choiceId: string };
}
```

### 17.1 Retention

Revision 1 recorded every action and every state change, kept all of it forever, and
put the whole thing in the save. At roughly 15 entries per week the 52-week scenario
reaches several megabytes, re-serialized on every save. Open Life Mode has no end
date, so its saves grow without bound — that is the case that actually breaks.

Two mechanisms, solving different problems:

**Tiered history.** Full detail for the most recent `HISTORY_DETAIL_WEEKS` (default 8).
Older weeks compact to one summary entry per week per category, marked
`compacted: true`. Nothing player-visible is lost, and the journal survives migration.

**Action log.** `GameState.actionLog` keeps the compact ordered sequence of actions
and event responses. Combined with the seed and `RngState`, it reproduces a run
exactly — within one engine and content version (§16.2). This is the bug-reproduction
path, and it is far smaller than the history it can regenerate.

```typescript
const HISTORY_DETAIL_WEEKS = 8;
```

### 17.2 Uses

Weekly summaries, save debugging, replay, player journals, achievement checks,
narrative generation, bug reproduction.

---

## 18. Testing Strategy

The engine must be fully testable without a graphical interface or AI integration.

### 18.1 Unit Tests

- Requirement evaluation.
- Condition evaluation, including nesting and quantifiers.
- Time calculations and the calendar invariant.
- Financial calculations in integer cents.
- Need changes, drift, clamping and polarity.
- Derived-value resolution, modifier ordering, stacking and expiry.
- Skill checks and bounds.
- Random rolls and substream isolation.
- Event eligibility and cooldowns.
- Goal evaluation, including consecutive-week reset.
- Serialization round-trip equivalence.
- Save migration.
- Projection completeness — **no hidden field appears in any projection**.
- Sorted-iteration compliance.
- Start-of-week ordering: an effect expiring in week N still applies throughout
  week N, and `committedTimeUnits` is recomputed *after* expiry.
- Travel: adjacency enforced, `travelTimeUnits` charged, non-adjacent hop rejected
  with `wrong_location`.
- Location gating: an action absent from the current location's `actionTypes` fails.
- Plan atomicity: a plan whose third action fails leaves state deep-equal to input.
- Resolver table exhaustiveness, and `type: "custom"` rejected with
  `action_not_available`.
- Canonical serialization: `serialize` emits sorted keys for any input ordering.
- Counter auto-increment: every emitted `StateChange` bumps `counters[reason]` exactly
  once, and an atomic plan rollback (§11.4) rolls counters back with it.
- Headline pool: no repeat until exhausted, reshuffles on exhaustion, same seed draws
  the same 52-week sequence.
- Strangeness: rises monotonically on the curve, responds to `Modifier`s, and content
  outside its `minStrangeness`/`maxStrangeness` band is never selected.
- Projection exclusion for `counters` and `world.strangenessBase`.
- `demandBand` thresholds, and that raw `sectorDemand` never reaches a projection.
- Transparency gating: `debug` is absent under `"off"` and populated under
  `"outcomes"`.

### 18.2 Integration Tests

- Complete weekly processing.
- Employment progression across tiers.
- Education completion and failure with retained progress.
- Rent failure and the full eviction ladder.
- Item purchase, maintenance and breakage.
- Multi-step event chains.
- Deferred event responses spanning a week boundary.
- Contested position resolution between player and rival.
- Relationship consequences.
- Per-actor relationships: the same NPC holds different attitudes toward the player
  and the rival, and `NPCMemory.aboutActorId` keeps their histories separate.
- Finance two-pass: rent is payable from the same week's wages, and unpaid rent
  advances the eviction ladder in that same week rather than the next.
- Goal completion under both `goals_win` and `failure_wins` precedence.
- Failure conditions.
- Achievement unlock fires exactly once, writes to `PlayerProfile`, and is not
  re-awarded on a later week or a later game.
- Profile independence: a golden-master fixture replays byte-identically with an
  empty profile, a populated profile, and a corrupt one — nothing mechanical reads it.
- Chain scope: a `"game"` chain resets between games; a `"profile"` chain resumes at
  its stored step and advances on cumulative weeks.
- Opportunity lifecycle: each of accept, decline, expire and revoke removes the
  offer exactly once and emits its own reason code.
- Opportunity ordering: a contested offer revoked in the same pass that freed the
  slot can be re-offered that same week, not the next.
- Scheduled events fire unconditionally — a due event whose `conditions` no longer
  hold, whose `cooldownWeeks` is active, and which is marked `unique` and already
  fired, still fires when scheduled.
- `endsChain` cancels every pending `ScheduledEvent` for that `chainId` and emits
  `event_cancelled` per entry; a chainless scheduled event survives it.
- Full eviction chain end to end: late payment → warning → penalty → notice →
  scheduled hearing → hearing fires; and the paid-off variant where `endsChain`
  cancels the hearing before it arrives.

### 18.3 Deterministic Scenario Tests

```typescript
const engine = createEngine(registry);

const created = engine.createGame({
  seed: "ogre-001",
  scenarioId: "stable-life",
  difficultyId: "standard",
  backgroundId: "broke-but-capable",
  playerName: "Test Subject",
  mode: "challenge"
});

const plan = engine.addAction(created.value!, engine.createActionPlan(created.value!), {
  id: "action-001",
  type: "apply_for_job",
  actorId: "player",
  targetId: "job-warehouse-associate",
  parameters: {}
}).value!;

const result = engine.executeActionPlan(created.value!, plan);

expect(result.outcomes[0].degree).toBe("success");
```

### 18.4 Determinism Harness

Acceptance criterion 18 — *byte-identical `serialize()` output from the same seed and
action sequence* — is the criterion with real teeth, and it needs machinery that
revision 2 did not specify.

**Canonical serialization.** `serialize` must emit **sorted object keys** and a stable
number format. Without it, "byte-identical" is unachievable even for a perfectly
deterministic engine, because JSON key order follows insertion order and insertion
order follows code paths.

**Fixture format.** A playthrough is its config plus its action log — a shape
`GameState.actionLog` already provides:

```typescript
interface PlaythroughFixture {
  name: string;
  config: NewGameConfig;
  log: LoggedAction[];
}
```

The runner calls `createGame(config)`, replays each logged action and event response
in order, calls `endWeek` at each week boundary, and serializes the final state.

**Two test kinds, catching different failures:**

| Kind | What it catches | What it misses |
|---|---|---|
| **Golden files** — committed fixtures with expected `serialize()` output | Behaviour regressions: a balance edit that changed something it shouldn't | Non-determinism on paths the fixtures never touch |
| **Property tests** — N random seeds, each run twice, outputs compared | Non-determinism anywhere: unsorted iteration, `Math.random` creeping in, floating-point drift | Behaviour changes, since both runs change together |

Both are required. A golden file proves *this* game still plays the same way; a
property test proves *any* game plays the same way twice.

Golden output is committed. A diff on failure shows exactly which field moved, which
turns "the engine changed" into "the engine changed `player.finances.cashCents` in
week 31."

### 18.5 Simulation Tests

Automated agents run large numbers of games to identify:

- Impossible goals.
- Dominant strategies.
- Infinite-money exploits.
- Death spirals.
- Unavoidable failures.
- Useless actions.
- Overpowered jobs.
- Broken event weights.
- Economy instability.
- Rival unfairness.
- Unreachable content and unsatisfiable requirements (Tier 3 of §4.3).

Runs must meet the §1.5 budget.

---

## 19. Acceptance Criteria for the Engine Prototype

Each criterion has a measurable test. Revision 1's wording ("produce a valid initial
game state") was unfalsifiable for eighteen of the twenty.

| # | Criterion | Measurable |
|---:|---|---|
| 1 | Create a game from scenario and seed | `createGame` returns `success: true` with a populated state |
| 2 | Valid initial state | State passes the full invariant suite: calendar invariant holds, all needs in `0–100`, every reference resolves in the registry |
| 3 | Calculate weekly time | `getTurnContext().availableTimeUnits` equals total − committed − spent for 100 seeded starts |
| 4 | Accept a plan | `validateActionPlan` returns `valid: true` for a plan within budget |
| 5 | Reject invalid actions | Each `ReasonCode` in the validation group is produced by at least one crafted case |
| 6 | Resolve valid actions | `executeActionPlan` returns per-action `outcomes`, each with a `degree`, and ≥1 `StateChange` |
| 7 | Income and expenses | After `endWeek`, `cashCents` delta equals `summary.netCents` exactly |
| 8 | Update needs | Every need moves per its drift table; all end clamped in `0–100` |
| 9 | Housing costs | Rent charged once per week; `overdueRentCents` increments when unpaid |
| 10 | Education progress | `weeksCompleted` advances only with attendance ≥ course minimum |
| 11 | Employment progress | `performance` responds to its declared factors in the declared direction |
| 12 | Seeded events | Same seed produces an identical `triggeredEvents` sequence across 100 runs |
| 13 | Evaluate goals | `consecutiveWeeksSatisfied` increments on satisfied weeks and resets to 0 otherwise |
| 14 | Evaluate failure | Each failure condition transitions status to `failed` in a crafted case |
| 15 | Weekly summary | `WeekResolution.summary` is populated and internally consistent with `changes` |
| 16 | Save complete state | `serialize` output contains `rng`, `actionLog` and all pending collections |
| 17 | Load without loss | `deserialize(serialize(s))` is deep-equal to `s` |
| 18 | Reproduce from seed | Two runs from identical seed and action sequence produce **byte-identical** `serialize()` output |
| 19 | No UI | Full suite passes in Node with no DOM and no renderer |
| 20 | No AI provider | Full suite passes with no network access and no adapter package installed |

---

## 20. Package Architecture

```text
packages/
  engine/
    src/
      actions/
      conditions/
      derived/
      events/
      goals/
      projections/
      random/
      reducers/
      requirements/
      serialization/
      simulation/
      state/
      systems/
      validation/

  content/
    src/
      loaders/
      schemas/
      validators/
      strings/
    data/
      backgrounds/  careers/  courses/  employers/  events/
      goals/  housing/  items/  locations/  npcs/
      scenarios/  skills/  strings/  traits/

  adapters/
    src/
      intent/
      narration/
      dialogue/

  clients/
    cli/  text/  web/  desktop/

  test-support/
    src/
      agents/
      builders/
      fixtures/
      seeded-scenarios/
```

### 20.1 Dependency Rule

```text
Clients
  ↓
Adapters
  ↓
Engine
  ↓
Content schemas and definitions
```

The engine must never import a client or AI adapter. File I/O lives in `content`,
never in `engine`.

---

## 21. Development Phases

### Phase 1 — Simulation Kernel

Game state · PCG32 generator and substream derivation · time allocation · action
schema · action validation · typed reducers and `StateChange` audit records ·
weekly processing · save and load · action log · tiered history.

### Phase 2 — Core Life Systems

Work · education · income · expenses · needs with drift and polarity · housing
including damage and the eviction ladder · purchases · derived-value resolver ·
goals · basic failure conditions.

### Phase 3 — Content Engine

JSON and YAML loaders · content schemas · tiered validation · requirements ·
nested conditions and quantifiers · modifiers · rewards · event chains · deferred
event responses · string tables.

### Phase 4 — Reference Text Client

Specified in [`05-text-client.md`](05-text-client.md). Game creation · location and
status display from `PlayerVisibleState` · weekly action planning via the
plan-editing API · event responses · weekly summary · save and load.

The client is deliberately plain. Its job is to prove the API is complete by driving
every method from a real command — the coverage checklist in §6 of that document is
the completion criterion, not any quality of presentation.

### Phase 5 — Optional Intelligence Adapters

Natural-language intent parsing · narration · dialogue · custom-action translation ·
content-development assistance. These adapters remain optional.

### Phase 6 — Production Game Client

Visual locations or board · character portraits · sound · music · Steam integration ·
achievements · cloud saves · controller support · accessibility options ·
localization (already structurally supported by §2.4).

---

## 22. Judgement Calls and Open Questions

### 22.1 Resolved in Revision 3

Flagged as judgement calls in revision 2, since decided.

| Area | Resolution |
|---|---|
| §12.1 Start of week | `START_WEEK_SYSTEM_ORDER` added. `TimeSystem` now executes; effect expiry and deferred-event presentation have a defined moment, and commitment recomputation is ordered after expiry. |
| §12.2 Finance ordering | Split into `finance_income` (before housing) and `finance_reconcile` (after). The eviction ladder no longer lags a week per rung, and rent is still paid from this week's wages. |
| §12.3 Goal/failure ties | Per-scenario via `ScenarioDefinition.goalFailurePrecedence`, defaulting to `goals_win`. Brutal scenarios can opt into `failure_wins`. |
| §8.9 Relationships | Affective dimensions moved onto `RelationshipState`, held per actor. Rivals can now form relationships at all; `NPCMemory` gained `aboutActorId`. |
| §8, §14.9 Actor shape | `ActorState` extracted. `PlayerState` is an alias; `AgentState.actor` replaces the misleading `AgentState.player`. |
| §3.3 Transparent mode | `metadata.transparency` gates debug population. No third projection audience needed — debug rides on outcomes, not state reads. |
| §5.6 Sector demand | Banded `cold`/`steady`/`hot` in projections; the exact value stays hidden. |

### 22.2 Still Open

| Area | Call made | Why it may need revisiting |
|---|---|---|
| §7 Derived values | Resolver assumed to memoize per week per path | If profiling shows the cache is the bottleneck, the strategy changes — the layer model does not. |
| §8.7 Housing quality | `(comfort + safety) / 2 − damage × 0.6` | Formula invented to make the design's derived-quality concept concrete. Pure balance; expect it to change. |
| §6 `VisibleStatusEffect` | Raw `modifiers` replaced by a three-band `magnitudeHint` | Invented to avoid leaking exact numbers while keeping effects visible. The band count is arbitrary. |
| §5.6 `demandBand` | Thresholds at 35 and 65 | Arbitrary. Tune once job availability exists and the real distribution of demand values is known. |
| Design §3.3 | Need drift rates | Explicitly provisional; they exist so the simulation harness has something to run. |
| Design §16.4 | Scenario economics | Explicitly provisional. The feasibility check implies the scenario is winnable only via the certificate path — simulation should confirm or kill that. |

---

## 23. Central Architectural Rule

The engine must be playable through automated tests with no user interface and no AI
integration.

```typescript
const engine = createEngine(registry);

const created = engine.createGame({
  seed: "ogre-001",
  scenarioId: "stable-life",
  difficultyId: "standard",
  backgroundId: "broke-but-capable",
  playerName: "Test Subject",
  mode: "challenge"
});

if (!created.success) throw new Error("Could not create game");
const game = created.value!;

// Plans are immutable — every edit returns a new plan.
const edit = engine.addAction(game, engine.createActionPlan(game), {
  id: "action-001",
  type: "apply_for_job",
  actorId: "player",
  targetId: "job-warehouse-associate",
  parameters: {}
});

if (!edit.success) throw new Error("Invalid action");

const validation = engine.validateActionPlan(game, edit.value!);
if (!validation.valid) throw new Error("Invalid action plan");

const actionResult = engine.executeActionPlan(game, edit.value!);
const weekResult = engine.endWeek(actionResult.value!);
```

Once this works, every client is presentation.

The engine is the product foundation.
