# 2026-06-14 21:55:00 - Cycle 34: One Entity-Agnostic Privacy Gate

The other half of the prime directive: not just "private by default" (Cycles 32-33) but **enforced in
exactly one place**. AGENTS' prime directive is explicit: *"Never add a second place that decides
visibility."* This cycle makes the gate generic so every entity passes through the same single
decision.

## Cycle 34

### RED

The new behavior: the gate works on *any* entity, proven on log entries (not just work items).

```ts
const publicEntry = createLogEntry({ id: "log-public", title: "Published Note", visibility: "public" });
const privateEntry = createLogEntry({ id: "log-private", title: "Draft Note", visibility: "private" });
expect(selectPublic([publicEntry, privateEntry])).toEqual([publicEntry]);
```

```text
× excludes non-public items of any entity (the one gate, on log entries)
  → (0 , selectPublic) is not a function
```

### GREEN

A generic gate keyed only on the shared `visibility` field:

```ts
export function selectPublic<T extends { visibility: Visibility }>(items: T[]): T[] {
  return items.filter((item) => item.visibility === "public");
}
```

Suite green at 34 — **but now two functions decide visibility** (`selectPublic` and the old
`selectPublicWorkItems`, each with its own `=== "public"`). That is precisely the "second place" the
prime directive forbids. GREEN passed; the directive is not yet satisfied. The refactor is mandatory.

### REFACTOR (the part that actually satisfies the directive)

- Repointed `export-read-model.ts` from `selectPublicWorkItems` to `selectPublic`.
- Repointed the work-item test onto `selectPublic` (same coverage: public kept, private/gated dropped).
- **Deleted `selectPublicWorkItems`.** grep confirms zero remaining references.

Now there is exactly **one** function in the codebase containing `visibility === "public"`. Every
collection — work items today, log entries and series when their read paths arrive — flows through it.
The type bound `T extends { visibility: Visibility }` makes "publishable" mean precisely "has the
shared visibility field," so a future entity is gated correctly the moment it has one, and a type that
*lacks* visibility can't be passed to the gate at all.

Full suite green (34); `npm run build` still emits only the public work item — privacy remains a
physical fact, now flowing through a single, generic seam.

## State after this cycle

- Tests: **34 passing (10 files)**. Suite green. Build green; privacy physical.
- **Prime-directive breadth complete**: all entities private-by-default (32-33) + one enforcement
  point (34). The invariant is ready ahead of the log-entry/series export wiring that will use it.

## Next candidate behaviors

- A **read path** that actually exports log entries / series through `selectPublic` (turn the
  now-uniform gate into a working slice; would also exercise `dedupeLogSlugs` / `resolveWorkItemSeriesId`).
- Or **Section D** (video detection / matching) — the genuinely fiddly token-overlap logic.
- Parked: HTML-escaping in `renderWorkItemDetail`; build-integrity gate for "unexpectedly zero pages".
