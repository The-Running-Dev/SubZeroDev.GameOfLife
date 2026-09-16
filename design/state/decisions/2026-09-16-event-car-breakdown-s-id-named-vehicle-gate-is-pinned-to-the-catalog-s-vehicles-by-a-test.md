# decision/2026-09-16-event-car-breakdown-s-id-named-vehicle-gate-is-pinned-to-the-catalog-s-vehicles-by-a-test
Date: 2026-09-16
Anchor: 2026-09-16 — `event-car-breakdown`'s id-named vehicle gate is pinned to the catalog's vehicles by a test
Status: accepted

## Claim
A CP10 narrowing that names items by id, because a `where` cannot read their definition, is
compliant only while a test ties the named ids to the set they stand in for. `stable-life.test.ts`
asserts `event-car-breakdown`'s named ids equal the catalog's vehicles (tag `vehicle` or category
`vehicles`), so adding a vehicle without widening the gate fails the build. The test retires when a
pin lets the gate be written on the tag.
