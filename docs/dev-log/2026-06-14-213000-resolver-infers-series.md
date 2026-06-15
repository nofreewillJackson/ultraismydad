# 2026-06-14 21:30:00 - Cycle 29: Resolver Infers a Series When None Is Explicit (box 3)

Section C, box 3. When a work item has no explicit `seriesId`, fall back to `inferSeries` over its text.

## Deliberately unfenced (triangulation set-up)

Box 3 only asserts that a spoolcast item with an inferable title gets the inferred series. It says
**nothing about the line constraint**. So the minimal code adds inference with *no* line check:

```ts
if (item.seriesId) return resolveSeriesId(item.seriesId, series);
const inferred = inferSeries({ title: item.title });
return inferred ? resolveSeriesId(inferred, series) : undefined;
```

Adding a `productLineId === "spoolcast"` guard now would be speculative — no current test requires it.
The next cycle (box 4) writes the off-line case, which this unfenced version will **fail**, and *that*
failure drives the fence into existence. This is the same triangulation that grew `slugify` and the
log-entry slug: don't write the constraint until a test demands it.

## Cycle 29

### RED

```ts
const item = createWorkItem({ id: "wi-2", title: "Aninews weekly drop", productLineId: "spoolcast" });
expect(resolveWorkItemSeriesId(item, all)).toBe("aninews");
```

```text
× infers a series under the spoolcast line when none is explicit
  → expected undefined to be 'aninews'
```

### GREEN

Inference added (see above). `inferSeries("Aninews weekly drop")` → `aninews`; `resolveSeriesId`
passes it through (already canonical).

```text
 Tests  29 passed (29)
```

### REFACTOR

None.

## State after this cycle

- Tests: **29 passing (10 files)**. Suite green.
- Inference now applies — but to **any** line. That's intentionally too permissive; box 4 fences it.

## Next candidate behaviors

- [ ] discard an inferred series off the spoolcast line (box 4) — will RED against this unfenced code.
- [ ] honor an explicit series even off the spoolcast line (box 5).
