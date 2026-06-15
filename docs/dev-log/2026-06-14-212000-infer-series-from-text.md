# 2026-06-14 21:20:00 - Cycle 27: Infer a Series From Text (keyword table)

Section C, box 2. A best-effort series guess from a work item's free text (legacy `inferSeries`,
`data.ts:746-755`). Concatenate the text fields, lowercase, and match a small ordered keyword table.

## Right-sizing this (a correction)

I had described Section C as "the hardest case." It isn't. The genuinely fiddly logic — title-token
overlap scores, fuzzy-duplicate thresholds (`data.ts:829-861`) — is **video↔project matching
(Section D)**, which I had mentally bundled in. Series inference itself is a handful of `includes()`
checks. Calling it hard was overcomplication; the user was right to push back. Recording the
correction so the next reader doesn't inherit the inflated framing.

## What's a relationship vs. a derivation here

The cross-cutting rule says relationships are *stored, explicit, never inferred*; labels are *derived*.
Series sits on the line between: the **explicit `seriesId` is the stored relationship**; the
**inferred series is a derived, read-time convenience** that is never written back. So `inferSeries`
is a pure function, and the fence that decides whether to *use* its output (only under spoolcast)
lives in the read-time resolver (next cycles), not in storage. This is how we keep inference without
violating "never infer a stored relationship" — we simply never store the inferred value.

## Cycle 27

### RED

```ts
expect(inferSeries({ title: "Aninews Episode 12" })).toBe("aninews");
expect(inferSeries({ title: "Weekly Dev Log" })).toBe("spoolcast-dev-log");
expect(inferSeries({ title: "session to video pipeline" })).toBe("videos");
expect(inferSeries({ title: "Spoolcast feature drop" })).toBe("spoolcast-features");
expect(inferSeries({ title: "An unrelated side project" })).toBeUndefined();
```

One test, five assertions — it's one behavior (a keyword table), so the cases read as the table's rows
rather than five separate cycles of identical `includes` logic.

```text
× infers a series from keywords in the text, else undefined
  → (0 , inferSeries) is not a function
```

### GREEN

The ordered table (specific matches before the broad `spoolcast` catch). **Order is load-bearing**: a
title like "spoolcast dev log" contains both `dev log` and `spoolcast`; `dev-log` is checked first, so
it correctly resolves to `spoolcast-dev-log` rather than the generic `spoolcast-features`.

```text
 Tests  27 passed (27)
```

### A smell noted, not fixed

The `videos` rule keys on very content-specific phrases (`"chat to video workflow"`,
`"session to video"`). That's brittle — it reads like it was reverse-engineered from two specific
posts, not a general rule. I ported it faithfully (the inventory lists `videos` inference as a kept
behavior) but flag it: if it proves to misfire or never fire on real data, it's a candidate to drop.
Not changing documented behavior on a hunch.

### REFACTOR

None.

## State after this cycle

- Tests: **27 passing (10 files)**. Suite green.
- Inference exists as a pure function; the next cycles fence *when* it's allowed to apply.

## Next candidate behaviors

- [ ] keep an explicit (alias-resolved) series assignment (box 1).
- [ ] infer a series under the spoolcast line when none is explicit (box 3).
- [ ] discard an inferred series off the spoolcast line (box 4).
- [ ] honor an explicit series even off the spoolcast line (box 5).
