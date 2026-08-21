# decision/2026-08-22-the-8-7-housing-quality-row-s-settling-condition-is-the-simulation-harness
Date: 2026-08-22
Anchor: 2026-08-22 — The `§8.7 Housing quality` row's settling condition is the simulation harness
Status: accepted

## Claim
The cell reads "Once the simulation harness produces real housing-outcome data, the comfort/safety/damage weighting is revisited." The condition names the same instrument as the *Need drift rates* and *Scenario economics* rows, so the three balance-derived numbers settle against one artifact rather than three. The prose paragraph in `04` §22.2 that described the empty cell as intended behaviour is removed, and the test that asserted exactly one finding now asserts none — S5.1 is satisfied rather than documented as unsatisfiable.
