# Life in the Fast Lane — Game Design

**Document status:** Revision 5 — location map, voice-gap mechanisms, opportunity
lifecycle
**Project stage:** Engine design

> **Scope of this document**
> What the game does: the loop, the systems, the content, the numbers, the feel.
> Described as design intent, not as code.
>
> - Why the game exists and what it is not: [`01-vision.md`](01-vision.md)
> - The types, APIs and architecture that implement all of this:
>   [`04-engine-specification.md`](04-engine-specification.md)

---

## 1. Core Gameplay Loop

The game is divided into weeks.

Each week, the player receives a limited number of time units.

Mandatory commitments consume some of those units automatically. The player allocates the remaining time among work, education, job hunting, shopping, rest, exercise, relationships, projects, business activities, and other actions.

At the end of the week, the engine processes income, expenses, needs, relationships, events, opportunities, and goal progress.

```text
Start week
→ Advance the calendar and reset spent time
→ Expire effects that ended last week
→ Apply mandatory commitments
→ Calculate available time
→ Present situations carried over from last week   ← see §11.5
→ Player responds to carried-over situations
→ Present available actions
→ Player selects actions
→ Validate actions
→ Resolve actions in order
→ Process income and scheduled expenses
→ Process inventory consumption
→ Process housing and charge rent
→ Reconcile overdue balances and late fees
→ Process needs
→ Process relationships
→ Process opportunities
→ Roll eligible events
→ Evaluate goals
→ Evaluate failure conditions
→ Produce weekly summary
→ Advance to next week
```

Events that require a decision do not interrupt the end of the week. They are
rolled at the end of week N and presented at the start of week N+1, where they
compete for that week's time budget like any other action. See §11.5.

---

## 2. Time Model

### 2.1 Weekly Turns

One turn represents one week.

```text
WEEKLY_TIME_UNITS = 14
```

A time unit represents approximately half a day of usable discretionary time.

The exact interpretation is abstract and exists primarily for game balance.

### 2.2 Example Action Costs

| Activity | Default time cost |
|---|---:|
| Work shift | 1 |
| Full-time employment | 8–10 per week |
| Part-time employment | 3–6 per week |
| Attend class | 2 |
| Study | 1 |
| Submit job applications | 1 |
| Shop for essentials | 1 |
| Exercise | 1 |
| Social activity | 1 |
| Rest | 1 |
| Medical appointment | 1 |
| Personal project | 1–4 |
| Business activity | 1–4 |
| Major event response | Variable |

All time costs are **derived by the engine** from the action type, its parameters,
and current state. A client never declares what an action costs; it asks.

### 2.3 Mandatory Commitments

Some activities automatically reserve time at the beginning of the week.

Examples:

- Full-time employment.
- Part-time employment.
- Classes.
- Recurring medical treatment.
- Contract obligations.
- Family responsibilities.
- Scheduled appointments.
- Court appearances.
- Business commitments.

Mandatory commitments may still require player confirmation in some modes, but skipping them creates explicit consequences.

### 2.4 Planning Affordances

A client must be able to:

- Add an action.
- Remove an action.
- Reorder actions.
- Replace an action.
- Preview total time usage.
- Preview mandatory commitments.

Each of these is an explicit engine operation returning a new plan. Plans are never
edited in place.

There is no separate "finalize" step. Executing a plan *is* the commit point, so a
client that wants a "ready to end the week?" confirmation owns that prompt — it is
presentation, not engine state.

Any action plan whose total time cost exceeds available time is rejected.

---

## 3. Player Model

### 3.1 What the Player Tracks

- Identity: name, age, background.
- Finances: cash, savings, debt, weekly income, weekly expenses, overdue balance, credit score, accounts.
- Needs: <!-- mirror-NeedState:declared:start -->health, energy, happiness, stress, satiety.<!-- mirror-NeedState:declared:end -->
- Attributes: <!-- mirror-AttributeState:declared:start -->intelligence, discipline, charisma, creativity, resilience, wisdom, luck.<!-- mirror-AttributeState:declared:end -->
- Education, career, housing.
- Inventory and relationships.
- Skills, traits, reputation, flags.

### 3.2 Needs Scale and Polarity

Default range: `0–100`.

Four of the five needs read *higher is better*. `stress` is inverted.

| Need | Polarity | 0–19 | 20–39 | 40–59 | 60–79 | 80–100 |
|---|---|---|---|---|---|---|
| `health` | higher is better | Critical | Poor | Functional | Good | Excellent |
| `energy` | higher is better | Critical | Poor | Functional | Good | Excellent |
| `happiness` | higher is better | Critical | Poor | Functional | Good | Excellent |
| `satiety` | higher is better | Critical | Poor | Functional | Good | Excellent |
| `stress` | **lower is better** | Excellent | Good | Functional | Poor | Critical |

`satiety` replaces the earlier `hunger`. The original name was genuinely ambiguous —
"hunger: 90" could reasonably mean either starving or well-fed, and content authors
would have split evenly on the guess. Satiety reads only one way.

`stress` keeps its name because players read a high stress number as bad without
being told. Generic code that must handle all five uniformly consults the polarity
table rather than assuming direction.

### 3.3 Need Dynamics

Every need has a defined weekly drift in the absence of player action:

| Need | Weekly drift | At zero |
|---|---:|---|
| `health` | 0 | Incapacitation: all actions except rest and medical are blocked; failure condition after 2 consecutive weeks |
| `energy` | −10 | Forced rest: the next week's discretionary time is halved |
| `happiness` | −2 | No hard block; compounds into stress and performance penalties |
| `satiety` | −25 | Health loses 8 per week at zero satiety |
| `stress` | −5 (recovers toward zero) | n/a — zero is the best state |

All needs clamp to `0–100` after every modification. Clamping happens once, at the
end of each system's pass, not after each individual change — so a −30 followed by
a +30 within the same pass nets to zero rather than clipping at the floor.

<!-- provisional-site-design-3-3:declared:start -->> **Provisional.** These drift rates are a starting point for balancing, not a
> decided design. They exist so the simulation harness has something to run.<!-- provisional-site-design-3-3:declared:end -->

### 3.4 Attributes

Attributes may change slowly and should not increase through trivial repetition.

### 3.5 Skills

Skills are stored independently from attributes.

Examples:

- Cooking.
- Maintenance.
- Programming.
- Accounting.
- Sales.
- Management.
- Driving.
- Negotiation.
- Writing.
- Customer service.
- Fitness.
- Research.

Suggested skill range: `0–100`.

### 3.6 Visible and Hidden Information

The player may see:

- Cash.
- Debt.
- Health.
- Energy.
- Happiness.
- Stress.
- Satiety.
- Current job.
- Education.
- Housing.
- Inventory.
- Known relationships.

The engine keeps some values partially or fully hidden:

- Luck.
- Employer reputation.
- NPC resentment.
- Event cooldowns.
- Opportunity weights.
- Rival strategy.
- Exact random rolls.

This is enforced, not merely documented. Clients receive a projection that does not
contain hidden values, rather than the full game state. See
[`04-engine-specification.md`](04-engine-specification.md) §6.

Hidden information must still obey explicit engine rules.

---

## 4. Actions

Every player choice is a structured action. Action families for the first version:

- Work.
- Search for work.
- Apply for a job.
- Attend education.
- Study.
- Shop.
- Eat.
- Rest.
- Exercise.
- Socialize.
- Travel.
- Maintain possessions.
- Pay bills.
- Borrow money.
- Repay debt.
- Save money.
- Invest.
- Negotiate.
- Start a project.
- Work on a project.
- Start a business.
- Operate a business.
- Respond to an event.
- Attempt a custom action.

### 4.1 Custom Actions

Clients may allow players to describe actions not represented by a predefined menu.
A custom action is translated into a structured proposal.

Example player intent:

> Ask the restaurant manager for evening shifts and free meals.

This becomes a `negotiate_job_terms` action targeting the restaurant-manager NPC,
with a preferred shift and requested benefits as parameters.

A custom action must not bypass:

- Prerequisites.
- Time costs.
- Financial costs.
- Location requirements.
- Relationship requirements.
- Skill checks.
- Game rules.

A translated action never carries its own cost. The engine prices it.

### 4.2 Action Ordering

The player may queue multiple actions before ending the week.

Ordering matters, because earlier actions may influence later actions.

```text
Buy interview clothes
→ Apply for office job
→ Attend interview
```

---

## 5. Randomness and Checks

Not every action should use randomness.

Deterministic actions include:

- Buying an available item.
- Paying rent.
- Eating owned food.
- Attending a scheduled class.
- Depositing money into savings.

Probabilistic actions may include:

- Applying for a job.
- Negotiating a raise.
- Repairing an appliance.
- Starting a business.
- Convincing an NPC.
- Avoiding termination.
- Receiving a promotion.
- Resolving some events.

### 5.1 Check Formula

A basic probability calculation may use:

```text
successChance = clamp(
    baseChance
  + skillBonus
  + attributeBonus
  + reputationBonus
  + relationshipBonus
  + situationalBonus
  - difficultyPenalty,
  minimumChance,
  maximumChance
)
```

Suggested default bounds:

```text
minimumChance = 5
maximumChance = 95
```

Some actions may permit guaranteed success or guaranteed failure when explicitly required.

---

## 6. Career System

Employment is one of the primary progression systems.

### 6.1 Job Tiers

Every job sits at an ordered tier. Tiers make "skilled or better" expressible as a
condition, drive promotion eligibility, and give goals and scenario requirements
something concrete to test.

| Tier | Rank | Character |
|---|---:|---|
| `entry` | 0 | No credential required. Abundant. Low pay, high time cost. |
| `skilled` | 1 | Certificate or demonstrated skill. Meaningfully better pay. |
| `professional` | 2 | Degree or substantial experience. Contested. |
| `senior` | 3 | Track record plus reputation. Scarce; see §14.3. |

### 6.2 Job Requirements

Requirements may include:

- Education.
- Certifications.
- Skills.
- Experience.
- Reputation.
- Clothing.
- Transportation.
- Health.
- Age.
- Relationship with an NPC.
- Completion of a prior event.
- Background checks.
- Availability.

### 6.3 Performance

Job performance may be influenced by:

- Relevant skills.
- Relevant attributes.
- Energy.
- Health.
- Stress.
- Happiness.
- Attendance.
- Relationships with coworkers.
- Relationships with management.
- Equipment.
- Commute.
- Recent events.

### 6.4 Promotions

Promotions may depend on:

- Weeks employed.
- Performance.
- Skills.
- Education.
- Certifications.
- Reputation.
- Relationships.
- Open positions.
- Employer conditions.
- Specific events.
- Random opportunity rolls.

"Open positions" is literal. Promotion slots at `professional` and `senior` tier are
finite and competed for. See §14.3.

### 6.5 Termination

Termination rules may include:

- Repeated absence.
- Persistent low performance.
- Failed mandatory checks.
- Misconduct.
- Company layoffs.
- Employer closure.
- Event consequences.
- Failed probation.
- Inability to meet schedule requirements.

### 6.6 Example Career Paths

```text
Dishwasher
→ Line Cook
→ Shift Supervisor
→ Restaurant Manager
→ Regional Director of Preventable Disasters
```

```text
Data Entry Clerk
→ Junior Administrator
→ Systems Administrator
→ Infrastructure Engineer
→ Person Blamed When Wi-Fi Stops
```

```text
Retail Associate
→ Department Lead
→ Assistant Manager
→ Store Manager
→ District Manager
→ Corporate Meeting Enthusiast
```

---

## 7. Education System

Education should include multiple providers, course types, costs, durations, and outcomes.

### 7.1 Education Types

- High-school equivalency.
- Vocational certificates.
- University degrees.
- Night classes.
- Professional certifications.
- Online courses.
- Self-directed learning.
- Apprenticeships.
- Employer training.
- Questionable motivational seminars.

### 7.2 Attendance and Study

Course success may depend on:

- Attendance.
- Study time.
- Intelligence.
- Discipline.
- Energy.
- Stress.
- Existing skills.
- Course difficulty.

### 7.3 Education Rewards

A course may grant:

- A credential.
- Skill increases.
- Attribute progress.
- Reputation.
- Job eligibility.
- Access to additional courses.
- Relationships.
- New locations.
- New opportunities.

### 7.4 Failure

A course may be failed because of:

- Insufficient attendance.
- Insufficient study.
- Unpaid tuition.
- Excessive stress.
- Failed exams.
- Event consequences.

Failure does not always erase all progress. Each course declares how much accumulated
progress is retained on failure.

---

## 8. Needs System

The needs system creates pressure and prevents the player from endlessly converting health and happiness into money.

### 8.1 Energy

Consumed by: work, study, exercise, travel, social activity, projects, illness, stress.

Restored by: rest, sleep-quality effects, good housing, food, health, some items, some activities.

Low energy may cause:

- Reduced work performance.
- Reduced study performance.
- Failed actions.
- Accidents.
- Illness.
- Forced rest.
- Relationship penalties.

### 8.2 Health

Influenced by: food quality, satiety, housing quality, exercise, work conditions, stress, illness, medical treatment, substance-related events, environmental events.

Critical health may:

- Block actions.
- Force treatment.
- Cause job absence.
- Create debt.
- Trigger failure conditions.

### 8.3 Happiness

Influenced by: housing, possessions, relationships, leisure, career satisfaction, education progress, financial security, traits, events, goal progress.

Happiness should not be reducible to owning expensive items alone.

### 8.4 Stress

Influenced by: workload, debt, unemployment, poor housing, low satiety, relationship conflict, instability, education pressure, health problems, overdue obligations.

High stress may reduce:

- Energy recovery.
- Happiness.
- Work performance.
- Study performance.
- Relationship success.
- Health.

### 8.5 Satiety

Satiety creates short-cycle survival pressure. It falls steadily and must be
actively maintained.

Food may be represented through:

- Individual items.
- Meal units.
- Weekly food plans.
- Household inventory.

Poor food quality may restore satiety while reducing health or happiness.

### 8.6 System Interactions

```text
Low energy
→ Lower work performance
→ Lower promotion chance
→ Higher termination risk
```

```text
High stress
→ Poorer sleep
→ Lower energy recovery
→ Reduced performance
→ Additional stress
```

```text
Poor housing
→ Reduced sleep quality
→ Reduced energy
→ Reduced happiness
→ Higher illness risk
```

---

## 9. Housing System

Housing affects expenses, comfort, safety, health, storage, prestige, commute, and access to other mechanics.

### 9.1 Housing Condition

Housing tracks two things beyond its fixed definition:

- **`damage`** — accumulated disrepair, `0–100`, rising through events and neglect,
  falling through maintenance. Mutable state.
- **`quality`** — a single derived read-only number combining the housing
  definition's comfort and safety against current damage. Content conditions test
  `quality` when they mean "is this place bad," rather than spelling out a
  multi-axis test each time.

`quality` cannot be written to. Attempting to set it is a content validation error.

### 9.2 Example Housing Progression

```text
Friend's sofa
→ Shared room
→ Cheap studio
→ Decent apartment
→ House
→ Luxury property
→ Suspiciously empty penthouse
```

### 9.3 Rent and Ownership

The housing system should support:

- Rent.
- Security deposits.
- Mortgages.
- Property ownership.
- Maintenance.
- Utilities.
- Insurance.
- Late fees.
- Eviction.
- Foreclosure.
- Moving costs.

### 9.4 Failure to Pay

Failure to pay rent should create escalation rather than immediate game-over.

```text
Late payment
→ Warning
→ Penalty
→ Landlord relationship damage
→ Formal notice
→ Eviction event
→ Loss of housing
```

Each rung is evaluated in the same week its cause occurs. Wages arrive before rent is
charged, and overdue reconciliation happens after — so a player who is paid on Monday
and pays rent on Tuesday is never flagged late, while a player who genuinely misses
rent advances a rung immediately rather than a week later.

---

## 10. Inventory and Purchases

Items may affect mechanics, unlock actions, create expenses, depreciate, require maintenance, or fail.

### 10.1 Item Categories

- Food.
- Clothing.
- Furniture.
- Appliances.
- Electronics.
- Vehicles.
- Tools.
- Medical items.
- Entertainment.
- Education materials.
- Business equipment.
- Luxury goods.

### 10.2 Item Effects

- Clothing improves employability or prestige.
- A computer unlocks remote jobs and online education.
- A vehicle reduces travel time but creates fuel, insurance, and repair expenses.
- Furniture improves happiness or energy recovery.
- Appliances reduce recurring time costs.
- Tools improve maintenance checks.
- Entertainment items improve happiness.
- Terrible purchases briefly improve happiness and later become expensive clutter.

Item effects are modifiers applied as a layer over base values. Owning two of the
same item does not stack its effect; owning two different items with similar effects
does. Selling or breaking an item removes its layer immediately, with nothing to
unwind.

### 10.3 Durability and Maintenance

Items may:

- Degrade through use.
- Require maintenance.
- Break.
- Lose effectiveness.
- Create events.
- Be repaired.
- Be replaced.
- Be sold.

---

## 11. Events

Events are declarative and data-driven.

### 11.1 Event Categories

- Employment.
- Housing.
- Health.
- Relationships.
- Economy.
- Education.
- Purchases.
- Crime.
- Weather.
- Opportunity.
- Bureaucracy.
- Transportation.
- Business.
- Pure absurdity.

### 11.2 Event Types

Events may be:

- Immediate.
- Delayed.
- Recurring.
- Conditional.
- Chained.
- Player-triggered.
- NPC-triggered.
- World-triggered.
- Unique.
- Repeatable.

### 11.3 Event Conditions

Event conditions are a nestable logical tree, not a flat list. `all`, `any` and `not`
compose freely, and quantifiers ask questions about collections — "owns any item
tagged formal_clothing", "any NPC with resentment above 50".

A flat AND-only list could not express "unemployed **or** badly stressed" without
authoring two near-identical events that then drift apart.

### 11.4 Example Event

```yaml
id: apartment_pipe_disaster
category: housing
titleKey: event.apartment_pipe_disaster.title
descriptionKey: event.apartment_pipe_disaster.description
weight: 10

conditions:
  any:
    - field: player.housing.quality
      operator: less_than
      value: 35
    - field: player.housing.damage
      operator: greater_than
      value: 60

choices:
  - id: repair_yourself
    labelKey: event.apartment_pipe_disaster.choice.repair_yourself
    timeCost: 2
    check:
      skill: maintenance
      difficulty: 45

  - id: call_landlord
    labelKey: event.apartment_pipe_disaster.choice.call_landlord
    outcomes:
      - effects:
          - target: player.relationships.npc-landlord.affinity
            operation: add
            value: -3

  - id: ignore_problem
    labelKey: event.apartment_pipe_disaster.choice.ignore_problem
    outcomes:
      - effects:
          - target: player.needs.happiness
            operation: add
            value: -4
          - target: player.housing.damage
            operation: add
            value: 8
```

Every player-facing string is a lookup key. The English text lives in a string table
shipped with the content pack, so localization is not a retrofit across every event
file later.

> **Twice corrected.** The original example tested `player.housing.quality` and wrote
> `player.housing.damage`, neither of which existed. Both are now real fields (§9.1).
> It then targeted `npc.landlord.relationship.affinity`, which stopped existing when
> relationships moved onto the actor — an NPC no longer holds one, each actor holds
> their own. The path is now `player.relationships.<npcId>.affinity`.
>
> That this example broke twice is the argument for the Tier 1 path validation in
> engine spec §4.3: every one of these would have been caught at content load rather
> than by someone reading carefully.

### 11.5 When Choice-Events Resolve

Events roll at the **end** of week N. An event that requires a decision does not
interrupt end-of-week processing — it is queued and presented at the **start** of
week N+1, where its time cost competes against that week's fresh budget alongside
every other action.

The consequence is a one-week lag between cause and decision: the pipe bursts in
week 12, you choose what to do about it in week 13. This is framed to the player as
the week's opening situations rather than as delayed news.

The alternative — pausing mid-week for a decision — was rejected because it requires
the end-of-week resolution to be suspendable and resumable, which is both
significant machinery and the most likely place for replay determinism to quietly
break.

### 11.6 Event Chains

One event may schedule or unlock another.

```text
Late rent
→ Landlord warning
→ Payment agreement
→ Failed agreement
→ Eviction notice
→ Eviction hearing
```

Chain state is tracked explicitly. Chains may legitimately loop, so a cycle in a
chain is a validation warning rather than an error.

---

## 12. NPCs and Relationships

NPCs exist as stateful entities rather than disposable dialogue generators.

### 12.1 Relationship Dimensions

Relationships track affinity, trust, respect, and resentment separately.

A single friendship score is insufficient for all interactions.

An NPC may:

- Like the player but not trust them.
- Respect the player but resent them.
- Trust the player without enjoying their company.

Resentment is hidden from the player. The other three are visible.

Relationships belong to the person holding them, not to the NPC. The same landlord
can respect the player and resent the rival, and remembers separately what each of
them did. A single shared attitude per NPC would have made the "social climber" rival
preset (§14.1) impossible to implement.

### 12.2 NPC Roles

- Employers.
- Managers.
- Coworkers.
- Teachers.
- Friends.
- Partners.
- Landlords.
- Lenders.
- Customers.
- Competitors.
- Government employees.
- Business partners.
- Neighbors.
- Medical professionals.

### 12.3 NPC Memories

NPCs remember what happened, with a category, a magnitude, the week it occurred,
and an optional expiry. NPC decisions may use relevant memories.

### 12.4 Dialogue Boundary

Dialogue may be generated externally, but the engine supplies the mechanical context —
attitude, trust, respect, current need, and the resolved negotiation result.

External dialogue must not alter the resolved outcome.

---

## 13. Goals and Victory

At game creation, the player selects or receives goals.

Goal categories may include:

- Wealth.
- Career.
- Education.
- Happiness.
- Relationships.
- Health.
- Business ownership.
- Reputation.
- Property ownership.
- Retirement.
- Scenario-specific objectives.

### 13.1 Persistent Goals

Some goals must remain satisfied for multiple weeks.

Example:

```text
Maintain:
- Happiness of at least 70.
- Health of at least 65.
- No overdue debt.
- Stable housing.

For 8 consecutive weeks.
```

This prevents temporary exploits such as borrowing money to momentarily satisfy a wealth goal.

A persistent goal tracks a consecutive-week counter. Any week in which the condition
is not satisfied resets that counter to zero — partial credit is not carried.

### 13.2 Goals and Failure in the Same Week

If a goal's completion condition and a failure condition are both satisfied at the
end of the same week, **the goal wins and the player completes** — by default.

This rewards a desperate final-week scramble instead of punishing the player for
losing a race they could not see. The alternative produces the worst possible ending
screen: "you reached $2,000. You were also evicted. You lose."

Each scenario may override it. A challenge scenario built around survival rather than
achievement can declare that failure wins, making the last week genuinely dangerous
instead of a free swing. Cruelty of that kind should be an authored decision attached
to a specific scenario, not a rule the whole game inherits.

### 13.3 Game Modes

**Classic Mode** — reach selected goals before an AI-controlled rival.

**Open Life Mode** — no rival and no fixed end date.

**Challenge Mode** — complete a predefined scenario. Examples:

- Escape debt.
- Become a CEO.
- Retire early.
- Start a company.
- Survive long-term unemployment.
- Raise a family.
- Become independently wealthy.
- Maintain happiness while working in enterprise IT.

---

## 14. Rival Simulation

A rival may be simulated using the same rules as the player.

### 14.1 Rival Personality Presets

- Conservative planner.
- Career obsessive.
- Social climber.
- Entrepreneur.
- Opportunist.
- Education maximizer.
- Wealth maximizer.
- Chaos goblin.

### 14.2 Fairness

The rival must obey the same mechanical rules as the player.

The rival must not receive:

- Invisible money.
- Free promotions.
- Ignored prerequisites.
- Impossible time allocations.
- Immunity from events.

Any difficulty advantage must be explicit. Examples:

- Better starting attributes.
- More starting money.
- Higher planning depth.
- Reduced penalties.
- Improved information access.

This is enforced structurally: the rival receives a bounded projection of the world,
exactly as a client does. "Improved information access" as a difficulty setting means
literally widening that projection, and is visible in the difficulty definition.

The rival also draws randomness from its own isolated stream, so the number of
decisions it makes can never perturb the player's rolls.

### 14.3 Contested Resources

Most of the world is not scarce. Nobody competes for a dishwashing job, and a rival
who absorbed every entry-level position would make the early game unplayable through
no fault of the player.

Scarcity is applied deliberately, where losing the race should sting:

| Resource | Contested? |
|---|---|
| `entry` and `skilled` tier jobs | No — unlimited openings |
| `professional` and `senior` tier jobs | **Yes** — finite position count |
| Promotion slots | **Yes** — finite per employer |
| Limited course seats | **Yes** — where the course declares a cap |
| Prime housing | **Yes** — where the definition declares a cap |
| Items, generic opportunities | No |

When the player and rival contend for the same position in the same week, both
resolve their check independently. If both succeed, the larger success margin wins;
an exact tie is broken by a seeded roll from the world's own random stream, so the
result is reproducible.

---

## 15. Economy

The initial economy may use mostly fixed values with controlled variation:
inflation, unemployment rate, interest rate, sector demand, market prices, and flags.

### 15.1 Economic Effects

The economy may influence:

- Job availability.
- Salary ranges.
- Rent.
- Food prices.
- Interest costs.
- Investment performance.
- Layoffs.
- Business opportunities.
- Item prices.
- Property values.

### 15.2 What the Player Can See

Inflation, unemployment and interest rates are newspaper facts and are shown directly.

Per-sector demand is shown as a **band** — `cold`, `steady` or `hot` — never as a
number. A person living in this world reads job boards and hears which industries are
laying off, so hiding it entirely would make every education decision a blind guess.
But the exact figure feeds job-availability rolls, and publishing it would let players
optimise against the formula rather than make judgements under uncertainty.

"Logistics is hiring, retail is shedding" is the intended texture. "Logistics is 71"
is not.

### 15.3 Scope Limitation

The economy should create pressure and variation without becoming a financial-market simulator.

The first version does not require:

- Real-time markets.
- Complex monetary policy.
- Detailed supply chains.
- Full business accounting.
- Regional economic simulation.

---

## 16. Initial Content

### 16.1 Content Targets

- 8 jobs.
- 3 career paths.
- 6 courses.
- 4 housing types.
- 20 purchasable items.
- 5 recurring expenses.
- 30 random events.
- 8 NPCs.
- 4 goal categories.
- 3 starting backgrounds.
- 1 complete scenario.

### 16.2 Initial Locations

Locations form a connected map, and **moving between them costs time**. Each location
declares which actions can be performed there, so a week is a routing problem as well
as an allocation problem: reaching the college, the employment office and a work shift
in the same week may simply not fit.

| Location | Enter cost | Connects to | Actions available |
|---|---:|---|---|
| Home | 1 | Market, Employment Office, Recreation Area, Workplace | rest, eat, study, socialise |
| Workplace | 1 | Home, Market, Recreation Area | work, work overtime, negotiate |
| Market | 1 | Home, Workplace, Bank | buy, sell |
| Bank | 1 | Market, Employment Office | deposit, withdraw, repay, borrow |
| Employment Office | 1 | Home, Bank, Department of Forms | search for work, apply for a job |
| Recreation Area | 1 | Home, Workplace, Community College | exercise, socialise |
| Community College | 1 | Recreation Area, Department of Forms | attend class, enrol |
| Department of Forms | **2** | Employment Office, Community College | bureaucratic events |

Travel is one action per hop between adjacent locations, priced by the **destination's**
`travelTimeUnits`. There is no pathfinding — a two-hop journey is two actions. All
connections are bidirectional.

Home is the hub: four locations sit one hop away. The Department of Forms costs 2 to
enter and is three hops from Home — you have to genuinely want that form. That is a
joke the map itself tells.

**Distances from Home:** Market 1 · Employment Office 1 · Recreation Area 1 ·
Workplace 1 · Bank 2 · Community College 2 · Department of Forms 3.

### 16.2.1 What the Map Does to the Week

Travel is now a real budget line, so the §16.4 arithmetic has to include it:

| Week shape | Time |
|---|---:|
| Full-time entry work | 1 travel + 10 work + 1 home = **12 of 14** |
| Part-time work plus a short certificate | 1 + 5 + 1 (work) + 2 + 3 + 2 (college) = **14 of 14** |
| A trip to the Department of Forms | 1 + 2 + event + 2 + 1 = **6+ before doing anything** |

Full-time leaves two units — enough to eat and rest, not enough to study. Part-time
plus a certificate fits exactly, with nothing left over for a single event response.
That is the intended squeeze, and it is why the switch from full-time to part-time is
the scenario's central decision rather than an obvious optimisation.

> **This tightens §16.4 rather than invalidating it.** The earlier feasibility check
> assumed free travel and found the certificate path viable with a $136 cushion. With
> movement charged the path still fits in the time budget — but only exactly, and any
> week containing a choice-event or a bureaucratic errand breaks it. Simulation should
> confirm whether that is difficulty or impossibility; if it is the latter, the lever
> to move first is the college's `travelTimeUnits`, not wages.

### 16.3 First Scenario — "Stable Life"

The player begins with:

- $200 cash.
- No job.
- Basic education.
- A cheap rented room.
- One week of food.
- Minimal possessions.
- Twelve months (52 weeks) to establish a stable life.

Completion requirements:

```text
Cash reserve:      $2,000
Employment tier:   skilled or better
Education:         certificate or better
Happiness:         60 or higher
Health:            60 or higher
Overdue rent:      none
```

### 16.4 Provisional Economic Baseline

<!-- provisional-site-design-16-4:declared:start -->
> **These numbers are provisional.** They are not a balance decision. They exist so
> that the scenario is runnable and the simulation harness can begin finding
> problems on day one. Expect all of them to change.

**Recurring weekly costs**

| Item | Cost | Notes |
|---|---:|---|
| Rented room (rent) | $95 | Cheapest housing tier |
| Utilities | $18 | Scales with housing tier |
| Groceries (basic) | $45 | Restores satiety to full for one week |
| Groceries (poor quality) | $25 | Restores satiety, costs 3 health |
| Transport | $15 | Waived if the player owns a vehicle |
| **Baseline total** | **$173** | Before any discretionary spending |

**Wages by tier**

| Tier | Weekly pay (full-time) | Time cost | Effective hourly feel |
|---|---:|---:|---|
| `entry` | $210 | 10 units | Survivable, no slack |
| `skilled` | $340 | 9 units | First real breathing room |
| `professional` | $520 | 8 units | Savings become possible |
| `senior` | $780 | 8 units | Comfortable |

Part-time pays pro rata at 55% of the tier's full-time weekly rate for 5 units.

**Education costs**

| Course type | Tuition | Duration | Weekly time |
|---|---:|---:|---:|
| Short certificate | $340 | 8 weeks | 3 units |
| Vocational certificate | $900 | 16 weeks | 4 units |
| Degree module | $1,600 | 24 weeks | 5 units |

**Feasibility sanity check.** Entry-level full-time nets roughly $37/week after the
baseline. That alone reaches about $1,900 over 52 weeks — just short of target, and
only if nothing goes wrong. The intended path is therefore to spend early weeks on a
certificate at a real cost in both money and time, reach `skilled` around week 20,
and bank the difference. This is deliberately tight; if simulation shows it is
impossible rather than merely hard, wages move before anything else does.
<!-- provisional-site-design-16-4:declared:end -->
