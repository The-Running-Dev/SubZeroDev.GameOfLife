# Life in the Fast Lane — Vision

**Document status:** Initial specification, restructured
**Project stage:** Engine design
**Working title:** Life in the Fast Lane

> **Scope of this document**
> Why this game exists, what it is trying to feel like, what it deliberately is not,
> and what could go wrong. No mechanics, no types, no APIs.
>
> - How the world sounds: [`02-narrative-voice.md`](02-narrative-voice.md)
> - Mechanics and content design: [`03-game-design.md`](03-game-design.md)
> - Types, APIs, architecture: [`04-engine-specification.md`](04-engine-specification.md)
> - The first client, and the API's proving ground: [`05-text-client.md`](05-text-client.md)

---

## 1. Project Summary

Life in the Fast Lane is a satirical life-simulation game in which the player attempts to build a successful life while managing limited time, money, education, employment, housing, health, stress, happiness, relationships, possessions, and unpredictable events.

The player begins with limited resources, weak qualifications, basic housing, and a set of personal goals. Each game week, the player allocates a finite amount of time among work, education, job hunting, shopping, rest, relationships, projects, and other activities.

The game engine remains completely independent from any user interface, artificial-intelligence provider, distribution platform, rendering framework, or client application.

The engine owns all authoritative game state and mechanical outcomes.

External clients may present choices, interpret natural-language input, generate dialogue, narrate results, or render the game visually, but they never directly manipulate authoritative game state.

The central architectural principle is:

> Build a deterministic, interface-independent simulation engine. Treat every interface as a replaceable client.

---

## 2. Product Vision

The game should reproduce the central appeal of classic life simulators:

- Limited time.
- Limited money.
- Career progression.
- Education requirements.
- Increasing lifestyle costs.
- Tradeoffs between work and personal life.
- Random opportunities and disasters.
- Multiple paths toward success.
- Satirical writing.
- High replayability.

The engine should support:

- Structured player actions.
- Natural-language actions through optional adapters.
- Stateful non-player characters.
- Dynamic event chains.
- Multiple career paths.
- Multiple educational paths.
- Flexible victory goals.
- Seeded simulations.
- Data-driven content.
- Moddable content packs.
- Multiple client applications.
- Optional AI-assisted narration.
- Automated simulation and balancing tests.

The game should be mechanically understandable but narratively absurd.

An event may involve an emotional-support printer, a hostile landlord, or an aggressively unhelpful government clerk, but the mechanical causes and consequences must remain understandable.

---

## 3. Creative Principles

These are the principles that govern tone and player experience. The architectural
principles that govern implementation live in
[`04-engine-specification.md`](04-engine-specification.md).

The full narrative direction — the narrator, the tone rules, the long-arc gags — is
[`02-narrative-voice.md`](02-narrative-voice.md). §3.1 below is the short form of it.

### 3.1 Controlled Absurdity

The writing may be ridiculous.

The rules may not be arbitrary.

Every state change must result from:

- A player action.
- A recurring rule.
- A scheduled event.
- A triggered event.
- An explicit system effect.
- A deterministic calculation.
- A seeded random roll.

### 3.2 Transparent Consequences

The player should generally understand:

- Why an action is unavailable.
- What an action costs.
- What happened.
- What changed.
- Why a job application failed.
- Why a promotion occurred.
- Why an expense was charged.
- Why an event triggered.
- Why a relationship changed.
- Why a goal was completed or lost.

Some hidden values may exist, but the game should never feel mechanically dishonest.

### 3.3 Simulation Before Scope Expansion

The first version must prove that the weekly gameplay loop is enjoyable before adding:

- A visual board.
- Animated characters.
- Large amounts of generated content.
- Complex macroeconomic simulation.
- Full family simulation.
- Steam achievements.
- Multiplayer.
- User-generated mods.
- Large open worlds.
- Procedurally generated cities.

---

## 4. First Playable Scope

The first playable version should prove the core loop with limited but meaningful content.

The mechanical detail behind each of these systems is specified in
[`03-game-design.md`](03-game-design.md). The content targets and starting
scenario are in that document's Initial Content section.

### 4.1 Player Systems

Include:

- Cash.
- Savings.
- Debt.
- Time.
- Energy.
- Health.
- Happiness.
- Stress.
- Satiety.
- Skills.
- Education.
- Employment.
- Housing.
- Inventory.
- Basic relationships.
- Goals.

---

## 5. Non-Goals for the Initial Version

The initial engine does not need:

- Multiplayer.
- Real-time gameplay.
- Procedural cities.
- Full family genetics.
- Detailed combat.
- Real financial-market data.
- Real-world brands.
- Persistent online accounts.
- Cloud infrastructure.
- Microtransactions.
- User-generated content tools.
- Voice input.
- Full three-dimensional rendering.

---

## 6. Risks

### 6.1 Scope Creep

The concept can easily expand into an unlimited life simulator.

Mitigation:

- Build one scenario.
- Use a fixed initial content target.
- Prove the weekly loop first.
- Treat additional systems as later modules.

### 6.2 AI Overreach

An AI interface may create inconsistent outcomes or bypass rules.

Mitigation:

- Keep AI outside the engine.
- Require structured actions.
- Validate every action.
- Resolve every outcome mechanically.

### 6.3 Content Explosion

A data-driven system may encourage excessive content creation before the mechanics are proven.

Mitigation:

- Build only enough content to test each system.
- Reuse generic systems.
- Test depth before breadth.

### 6.4 Balance Problems

Interacting systems may create exploits or unavoidable failure loops.

Mitigation:

- Use seeded simulations.
- Build automated agents.
- Record complete history.
- Add balancing telemetry during development.

### 6.5 Excessive Complexity

Detailed simulation can become difficult for players to understand.

Mitigation:

- Keep player-visible rules clear.
- Explain consequences.
- Limit hidden variables.
- Add complexity only when it creates meaningful decisions.

---

## 7. The Bet

The engine must be playable through automated tests with no user interface and no AI integration.

Once that works, every client is presentation.

The engine is the product foundation.
