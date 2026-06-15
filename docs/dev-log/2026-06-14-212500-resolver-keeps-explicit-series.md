# 2026-06-14 21:25:00 - Cycle 28: Resolver Keeps an Explicit Series (box 1)

Section C, box 1. Introduce `resolveWorkItemSeriesId(item, series)` — the read-time function that
decides a work item's effective series. First branch: an **explicit `seriesId` wins**, resolved
through aliases.

## Stored vs. derived, made concrete

`seriesId` is now a field on `WorkItem` — the *stored, explicit* relationship (added to both the input
and output types; `createWorkItem` already carries it through via `...input`, so no new factory
logic). The *effective* series is **derived** by this resolver and never written back. That split is
the whole design: storage holds only what the author explicitly set; the resolver computes the rest.

## Cycle 28

### RED

```ts
const all = [createSeries({ id: "aninews", aliases: ["news-anime-bot"] })];
const item = createWorkItem({ id: "wi-1", title: "Anything", productLineId: "spoolcast", seriesId: "news-anime-bot" });
expect(resolveWorkItemSeriesId(item, all)).toBe("aninews");
```

```text
× keeps an explicit series assignment, resolved through aliases
  → (0 , resolveWorkItemSeriesId) is not a function
```

### GREEN

```ts
export function resolveWorkItemSeriesId(item: WorkItem, series: Series[]): string | undefined {
  if (item.seriesId) return resolveSeriesId(item.seriesId, series);
  return undefined;
}
```

The explicit alias `news-anime-bot` folds to `aninews` via the records (Cycle 26). The `return
undefined` placeholder is where inference and the spoolcast fence land in the next three cycles.

`series.ts` now imports the `WorkItem` *type* (type-only, so no runtime coupling and no import cycle —
`work-item.ts` doesn't know about series).

```text
 Tests  28 passed (28)
```

### REFACTOR

None.

## State after this cycle

- Tests: **28 passing (10 files)**. Suite green.
- Explicit series assignments resolve; inference is still inert (placeholder `undefined`).

## Next candidate behaviors

- [ ] infer a series under the spoolcast line when none is explicit (box 3).
- [ ] discard an inferred series off the spoolcast line (box 4).
- [ ] honor an explicit series even off the spoolcast line (box 5).
