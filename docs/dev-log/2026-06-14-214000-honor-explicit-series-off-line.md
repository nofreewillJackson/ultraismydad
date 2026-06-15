# 2026-06-14 21:40:00 - Cycle 31: Honor an Explicit Series Even Off the Spoolcast Line (box 5)

Section C, box 5 — the last one. An explicit `seriesId` must be honored regardless of product line.
The spoolcast fence (Cycle 30) constrains only *inference*; it must never override what the author
explicitly set.

## An honest non-RED

This test **passed the moment I wrote it** — no production change. That's not a failure of method;
it's the method working. The explicit-assignment branch sits *above* the fence in the resolver:

```ts
if (item.seriesId) return resolveSeriesId(item.seriesId, series);   // returns here, line irrelevant
if (item.productLineId !== SPOOLCAST_PRODUCT_LINE_ID) return undefined;
// …inference…
```

So "explicit wins on any line" already falls out of the precedence we built in Cycles 28 + 30. The
right move is **not** to fake a failure by temporarily breaking the code (that would be cargo-cult
TDD). Instead: write the test, run it, watch it pass, and keep it as a **guard** that locks the
precedence. It is not vacuous — if someone reordered the fence check *above* the explicit branch, this
test would go red (a research item would return `undefined` instead of `aninews`). That regression is
exactly what it now prevents.

## Cycle 31

### Test (passes green immediately)

```ts
const item = createWorkItem({ id: "wi-4", title: "Plain research note", productLineId: "research", seriesId: "news-anime-bot" });
expect(resolveWorkItemSeriesId(item, all)).toBe("aninews");
```

```text
✓ honors an explicit series even off the spoolcast line
 Tests  31 passed (31)
```

No RED, no production diff, no refactor — a pure regression guard.

## State after this cycle

- Tests: **31 passing (10 files)**. Suite green.
- **Section C (series inference) is COMPLETE.** The resolver's precedence is: explicit (any line) →
  inferred (spoolcast only) → none. Inference is fenced; explicit always wins.

## The full Section C precedence (for reference)

```ts
resolveWorkItemSeriesId(item, series):
  explicit?  -> resolveSeriesId(seriesId)         // box 1, box 5
  off-line?  -> undefined                          // box 4
  else       -> inferSeries(text) |> resolveSeriesId  // box 2, box 3
```

## Next candidate behaviors

- Section A and Section C done. Per ROADMAP, natural next moves: the **privacy-gate breadth**
  (hide a private log entry / series / line — extend the one default-deny rule to the new entities),
  or a **read path** that exercises `resolveWorkItemSeriesId` / `dedupeLogSlugs` against real data
  (wiring the domain we've broadened into the slice). Then Section D (video detection) and beyond.
