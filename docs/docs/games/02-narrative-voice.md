# Life in the Fast Lane — Narrative Direction: The Voice of the World

**Document status:** Initial direction
**Project stage:** Engine design

> **Scope of this document**
> How the world sounds. The narrator, the tone, the long-arc gags, and the rules
> that keep it from becoming a joke machine.
>
> This sits above mechanics deliberately. The mechanics exist to deliver this.
>
> - Why the game exists: [`01-vision.md`](01-vision.md)
> - What the mechanics do: [`03-game-design.md`](03-game-design.md)
> - Where narration attaches to outcomes: [`05-text-client.md`](05-text-client.md) §5.3

---

## Core Philosophy

The game should **not** simply be a life simulator.

It should be a life simulator where reality has quietly drifted several degrees away from normal, and nobody seems particularly concerned about it.

The humor should emerge from **dead-serious delivery**, not punchlines.

Everything should be presented as though it is perfectly ordinary.

The world is absurd.

The narrator is not.

---

## The Core Rule

Do **not** try to be funny.

Instead:

- Make the world funny.
- Make the situations funny.
- Make the consequences funny.
- Deliver everything with complete confidence.

The narrator never winks at the player.

The narrator never says "this is ridiculous."

The narrator simply documents events with calm certainty.

---

## The Narrator

The narrator should sound like an ancient observer who has watched humanity for thousands of years and is no longer surprised by anything.

Not evil.

Not sarcastic.

Not mean.

Simply amused.

Calm.

Patient.

Slightly disappointed.

Almost compassionate.

The voice should feel somewhere between:

- Lucifer politely observing humanity.
- Morgan Freeman narrating a train wreck.
- David Attenborough describing office workers as wildlife.
- A history professor documenting civilization's slow collapse.

---

## Writing Style

The narrator should:

- Speak in complete sentences.
- Never overreact.
- Never use internet slang.
- Never explain the joke.
- Never insult the player directly.
- Treat ridiculous events as perfectly ordinary.
- Frequently pause for dramatic understatement.
- Occasionally sound impressed by completely insignificant achievements.

---

## Example Tone

Instead of:

> You failed the interview.

Write:

> Your interview went surprisingly well.
>
> Unfortunately...
>
> So did the other applicant's.

---

Instead of:

> You got fired.

Write:

> Your employer has decided to pursue a future that does not currently include you.

---

Instead of:

> You ignored the leak.

Write:

> Ah.
>
> You have elected to ignore the leaking ceiling.
>
> A fascinating hypothesis.

---

Instead of:

> You're broke.

Write:

> Your bank account now contains $3.14.
>
> Ironically appropriate.

---

## The World

Reality should slowly become stranger over time.

Never suddenly.

Never randomly.

The player should eventually stop questioning it.

Examples:

- The mold develops confidence.
- The goose keeps appearing.
- Corporate job titles become impossible.
- Government paperwork evolves into mythology.
- Everyone accepts this.

---

## Bureaucracy

Government offices should feel legendary.

Example:

### Department of Forms

You require Form B-17.

Unfortunately, Form B-17 may only be requested using Form B-17 Request Authorization.

Options:

- Ask politely.
- Complete Form A-93.
- Return home and question your existence.

---

## Random Weekly News

Every week, generate one newspaper headline.

It may have no gameplay effect.

Its purpose is world building.

Examples:

> Local man promoted after accidentally attending management meeting.

---

> Scientists discover coffee may contain traces of coffee.

---

> City council replaces roundabouts with "more confident intersections."

---

> Pigeon elected Employee of the Month.

---

## Corporate Life

Corporate absurdity should increase with career progression.

Promotion example:

> Congratulations.
>
> Due to your consistent ability to survive meetings that should have been emails...
>
> You have been promoted to:
>
> Senior Associate Regional Assistant Coordination Specialist II.

Salary increase:

+$8 per week.

---

## Landlords

Landlords should always have unusual logic.

Example:

> The heating doesn't technically work...
>
> but the apartment believes in itself.

---

Example:

> The mold is now considered a structural feature.
>
> Therefore...
>
> it is your responsibility.

---

## Bosses

Example:

> You're promoted.
>
> Not because you're exceptional.
>
> Because Greg left.

---

## NPC Memory

NPCs remember strange things forever.

Friend:

> Still remembers Week 14 barbecue.

---

Boss:

> Still suspicious after The Forklift Incident.

---

Partner:

> Appreciates honesty.
>
> Less enthusiastic about your investment strategy.

---

## Running Gags

Introduce recurring nonsense that spans dozens of weeks.

Example:

Week 8:

> A goose watches you.

Week 17:

> It is the same goose.

Week 52:

> The goose appears financially comfortable.

Week 109:

> The goose owns rental property.

Week 183:

> You now work for the goose.

Never explain the goose.

---

## Hidden Statistics

Track absurd statistics without telling the player.

Examples:

- Cups of coffee consumed.
- Instant noodles eaten.
- Interviews survived.
- Government offices visited.
- Chairs accidentally broken.
- Number of landlords disappointed.
- Flies manually executed.
- Times almost bankrupt.
- Times late for work.
- Times you searched for keys while holding them.

Eventually unlock achievements.

Example:

### Predator of the Air

Requirement:

Kill 100 flies.

The player should have no idea this was ever being tracked.

---

## Tiny Philosophical Moments

Occasionally interrupt the simulation with quiet observations.

Example:

> You realize...
>
> Nobody actually knows what they're doing.
>
> Some people simply own better suits.
>
> +2 Happiness.

---

Example:

> You spend twenty minutes searching for your keys.
>
> They were in your hand.
>
> +1 Wisdom.

---

## Rare Legendary Events

Some events should be extraordinarily rare.

Example:

### The Interview

The interviewer studies your résumé.

Then says:

> You know what?
>
> You seem exhausted.
>
> Take the job.

100% success.

---

Example:

### Universal Distribution System

> The universe has determined you've experienced enough nonsense this month.
>
> Everything goes right.
>
> Nobody understands why.

---

## Achievement Names

Avoid generic achievements.

Instead of:

First Promotion

Use:

> They Seem To Like You

---

Instead of:

Debt Free

Use:

> Congratulations on Escaping Mathematics

---

Instead of:

Own a House

Use:

> Look at Mr. Stability

---

Instead of:

Become Wealthy

Use:

> Financially Less Concerning

---

## Overall Narrative Rule

The player should gradually realize that the world has become absurd without noticing exactly when it happened.

The humor should come from confidence, understatement, and long-running callbacks — not from constant jokes.

If players laugh, it should be because the world itself has developed an internal logic that is simultaneously ridiculous and strangely believable.

The narrator's job is not to entertain.

The narrator's job is to calmly document the magnificent disaster that is human civilization.

---
---

# What This Requires From The Engine

Everything above this line is narrative direction and stands on its own. Everything
below is engineering bookkeeping: six things this document asked for that the engine
specification did not provide.

**All six are now resolved.** They are recorded here rather than only in
[`04-engine-specification.md`](04-engine-specification.md) because the requirement
originates here — this document is why those mechanisms exist.

| Requirement | Resolution |
|---|---|
| Hidden statistics | `ActorState.counters`, auto-incremented from every `StateChange` reason code, plus a `"counter"` reward for flavour stats. Hidden from all projections. |
| Achievements | `AchievementDefinition` + an `achievements` system, unlocked into a profile-scoped `PlayerProfile`. |
| Wisdom | Added to `AttributeState` as a seventh attribute. |
| Weekly newspaper | `HeadlineDefinition` with a draw-without-replacement pool in `WorldState`, seeded and replayable. |
| World drift | `world.strangenessBase` rising on a curve, exposed as a derived value so events can nudge it; content gates on `minStrangeness`. |
| The goose | `ChainScope` declared per chain. Eviction is `game`; the goose is `profile` and advances on cumulative weeks played. |

The detail follows.

### 1. Hidden statistics need counters, not flags

`ActorState.flags` is `Record<string, boolean>`. "Cups of coffee consumed" and "flies
manually executed" are counts. Nothing in state can hold a number keyed by an
arbitrary string.

Needs `counters: Record<string, number>` on `ActorState`, incremented by reducers and
excluded from every projection — the player must not be able to see the coffee count,
or the joke dies.

### 2. Achievements do not exist

§17 lists "achievement checks" as a use of history, and that is the only mention in
the entire specification. There is no `AchievementDefinition`, no unlock evaluation,
no unlocked set in state.

*Predator of the Air* — kill 100 flies — is a condition over a counter, evaluated
somewhere in the weekly pass, that fires exactly once. All three of those pieces are
missing.

### 3. "+1 Wisdom" refers to an attribute that isn't there

`AttributeState` is intelligence, discipline, charisma, creativity, resilience, luck.
There is no wisdom. Either the attribute gets added or the example changes — but a
narrative document promising a stat the engine doesn't have is exactly the kind of
drift that gets discovered during implementation.

### 4. The weekly newspaper has no mechanism

A headline with no mechanical effect isn't an event — events roll on weights and
cooldowns, which would repeat headlines and fight the pool. It wants its own flavour
content type with draw-without-replacement semantics: one per week, no repeats until
the pool is exhausted.

Small feature, but it fires 52+ times per playthrough, so it is the single most
frequently seen piece of writing in the game.

### 5. World drift has no state behind it

"Reality should slowly become stranger over time. Never suddenly. Never randomly."

That is a progression curve, and nothing tracks it. It needs something like
`world.strangeness`, rising on a defined schedule, with event and headline content
declaring a minimum threshold — so early weeks draw from the mundane pool and week 90
draws from the pool where the mold has opinions.

Without it, "slowly becomes stranger" is unimplementable and the absurdity arrives
uniformly distributed from week 1, which is precisely the failure this document warns
against.

### 6. The goose outlives the scenario

The gag runs to week 183. The first scenario is 52 weeks. A long-arc callback only
lands in Open Life Mode, which has no end date.

So: are running gags scenario-scoped, or do they persist across a longer profile? This
is a design decision with save-format consequences, and it should be made before the
first chain is authored rather than after.
