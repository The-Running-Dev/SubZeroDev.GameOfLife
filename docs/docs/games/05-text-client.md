# Life in the Fast Lane — Reference Text Client

**Document status:** Initial specification
**Package:** `packages/clients/text`

> **Scope of this document**
> The first client, and the instrument that proves the engine API.
>
> - The engine it drives: [`04-engine-specification.md`](04-engine-specification.md)
> - The mechanics it renders: [`03-game-design.md`](03-game-design.md)
> - The voice it speaks in: [`02-narrative-voice.md`](02-narrative-voice.md)

---

## 1. Purpose

This client exists to answer one question: **is the engine API complete and correct?**

It is not a product. It is not a design prototype. Its success condition is that a
person can play a full 52-week game to a win or a loss, entirely through the public
`GameEngine` interface, without the client reaching into `GameState` or needing a
method the API does not expose.

Two consequences follow from that framing:

**Every API method must be exercised.** A method no client calls is a method whose
signature has never been tested against real use. §6 tracks coverage explicitly.

**The client holds no game logic.** It parses input, calls the engine, renders the
result. If the client ever needs to compute something about the game to display it,
that is a missing engine affordance and it gets fixed in the engine — not worked
around here. This is the whole point of the exercise.

Once this client can play a full game, UI beyond it is presentation.

---

## 2. Architecture

```text
stdin ──► Parser ──► GameAction ──► GameEngine ──► CommandResult
                                                        │
stdout ◄── Renderer ◄── PlayerVisibleState + OutcomeMessage[]
```

The client holds exactly two pieces of state:

```typescript
interface ClientState {
  game: GameState;               // opaque; passed back to the engine, never inspected
  plan: WeeklyActionPlan;        // the week being built
}
```

`game` is treated as a handle. The client reads through `getPlayerView(game)` and
never touches `game` directly — which is what makes the projection boundary (§6 of the
engine spec) a tested guarantee rather than a convention. If the client can't render
something from `PlayerVisibleState`, the projection is wrong.

---

## 3. Main Loop

```text
createGame(config)
  │
  ▼
┌─► getTurnContext(game)
│   │
│   ├─ pendingEventResponses non-empty?
│   │    └─► render event, read choice, respondToEvent(game, pendingResponseId, choiceId)
│   │
│   ├─ render location, status, available actions
│   │
│   ├─► read command
│   │     ├─ movement/action  → addAction / removeAction / reorderActions → previewPlan
│   │     ├─ query            → render, no state change
│   │     └─ "end week"       → validateActionPlan
│   │                             ├─ invalid → render errors, continue
│   │                             └─ valid   → executeActionPlan → endWeek
│   │
│   └─ status is "active"? ──yes──┘
│
  no
  ▼
render ending
```

`endWeek` returns state already positioned at the start of the next week
(engine spec §11.5), so the loop needs no separate advance step.

---

## 4. Command Grammar

Deliberately small. This is a test instrument; a parser with personality is a
liability when you are trying to work out whether the API is right.

### 4.1 Movement and Actions

```
go <location>              travel to an adjacent location
work                       work a shift at the current location
apply <job>                apply for a job
study                      study for an enrolled course
attend                     attend a class
enroll <course>            enrol in a course
buy <item>                 purchase an item
eat                        consume food from inventory
rest                       recover energy
exercise                   exercise
socialise <npc>            spend time with an NPC
accept <offer>             accept an open opportunity
decline <offer>            refuse one outright, on the record
pay rent                   pay outstanding rent
deposit <amount>           move cash to savings
withdraw <amount>          move savings to cash
repay <amount>             repay debt
```

Each maps to exactly one `ActionType`. Ambiguous or unknown verbs print the available
action list rather than guessing — a text client that guesses hides API gaps.

### 4.2 Plan Management

```
plan                       list queued actions with costs
undo                       remove the last queued action
move <n> <m>               reorder action n to position m
clear                      empty the plan
end week                   validate and execute
```

`undo`, `move` and `clear` map to `removeAction`, `reorderActions` and a fresh
`createActionPlan`. They exist specifically to exercise the plan-editing API added in
review item 8 — without them those methods ship untested.

### 4.3 Queries

Read-only. No engine state changes.

```
look                       current location, its connections, what can be done here
status                     needs, cash, job, housing, education
goals                      goal progress, including which clause is unmet
offers                     open opportunities with their expiry week
map                        known locations and travel costs
inventory                  items held
who                        known NPCs and relationship standing
history [n]                last n visible history entries
help                       command list
```

`goals` renders `GoalState.progressNotes`, which is the only way to prove that field
earns its place.

### 4.4 Meta

```
save <name> / load <name>  serialize / deserialize
quit
```

---

## 5. Rendering

### 5.1 Location

```
Employment Office
The queue moves at a pace best described as geological.

From here you can reach: Home (1), Community College (2), Market (1)
Available here: apply, look
```

Adjacency and costs come from `PlayerVisibleState`; nothing is computed client-side.

### 5.2 Status

```
Week 14 of 52          Time: 6 of 14 remaining
Cash $412   Savings $0   Debt $0        Rent due in 2 weeks

Health    72  ███████·
Energy    41  ████····
Happiness 55  █████···
Stress    38  ███·····      (lower is better)
Satiety   80  ████████
```

Bars honour `NEED_POLARITY` — stress renders inverted and is labelled. Getting this
right in the first client is how the polarity table proves it was worth adding.

### 5.3 Outcomes and the Voice

Every `OutcomeMessage` is rendered through the string table with its `params`
substituted. This is the seam where [`02-narrative-voice.md`](02-narrative-voice.md)
attaches: the narrator's tone lives entirely in the string table, not in client code.

```
> apply data-entry-clerk

Your interview went surprisingly well.

Unfortunately...

So did the other applicant's.

   Time -1
```

Mechanical deltas print underneath, plainly, from `StateChange` records where
`visible` is true. The narration says what happened; the numbers say what changed.
Never merge them — the moment the client starts composing prose from numbers, the
voice becomes the client's job instead of the content's.

Messages with `tone: "absurd"` are not styled differently. The narrator does not wink
([`02-narrative-voice.md`](02-narrative-voice.md), The Core Rule).

### 5.4 Weekly Summary

Rendered from `WeekResolution.summary`, plus the newspaper headline as a
zero-mechanical-effect `OutcomeMessage`.

```
── Week 14 ────────────────────────────────
Income   $340        Expenses $173
Net      +$167       Cash     $412

Health -3   Energy -8   Happiness +2   Stress +5   Satiety -25

  Pigeon elected Employee of the Month.
```

### 5.5 Errors

`ValidationError.details` carries the numbers, so the client renders the reason rather
than a bare refusal:

```
> enroll advanced-accounting

You cannot enrol in Advanced Accounting.
  Requires: Certificate or better (you have: School)
  Requires: $900 (you have: $412)
```

This is the Transparent Consequences principle reaching a screen. If a rejection can't
be explained from `details`, the engine is under-reporting.

---

## 6. API Coverage Checklist

The client is complete when every method has been driven by a real command:

| Method | Driven by | |
|---|---|:--:|
| `createGame` | startup | ☐ |
| `getTurnContext` | every loop iteration | ☐ |
| `getPlayerView` | `look`, `status`, `goals`, `inventory`, `who` | ☐ |
| `createActionPlan` | week start, `clear` | ☐ |
| `addAction` | every action command | ☐ |
| `removeAction` | `undo` | ☐ |
| `replaceAction` | `move` when target occupied | ☐ |
| `reorderActions` | `move` | ☐ |
| `previewPlan` | `plan` | ☐ |
| `validateAction` | action entry, before queueing | ☐ |
| `validateActionPlan` | `end week` | ☐ |
| `executeActionPlan` | `end week` | ☐ |
| `respondToEvent` | pending event prompt | ☐ |
| `endWeek` | `end week` | ☐ |
| `serialize` | `save` | ☐ |
| `deserialize` | `load` | ☐ |
| `migrate` | loading an older save | ☐ |

---

## 7. Non-Goals

- Colour, cursor control, or any terminal capability beyond plain text
- Save-slot management beyond named files
- Natural-language input — that is Phase 5's adapter, and mixing it in here would
  obscure whether a failure came from the engine or the parser
- Any attempt at good UX

The client should be boring. Interesting clients hide engine problems.
