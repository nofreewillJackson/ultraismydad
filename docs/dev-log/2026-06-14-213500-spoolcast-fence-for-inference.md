# 2026-06-14 21:35:00 - Cycle 30: Discard an Inferred Series Off the Spoolcast Line (box 4)

Section C, box 4 — and the cycle that drives the **spoolcast fence**, the one genuinely interesting
rule in this section. Inference is allowed, but only inside one product line. Everywhere else, a work
item gets a series *only* if it was explicitly assigned.

## Why the fence exists

Inference is a guess. A guess that fires across the whole catalog would mislabel unrelated items (a
"research" project whose title happens to contain "spoolcast" would be dragged into a video series).
Legacy contains the blast radius to the line where these series actually live (`data.ts:1024`:
`mainProjectId === "spoolcast" ? inferred : undefined`). This is the project's stance in miniature:
**inference is a convenience, not an authority** — fence it tightly, let explicit data always win.

## Cycle 30

### RED (the payoff from Cycle 29's unfenced code)

```ts
const item = createWorkItem({ id: "wi-3", title: "Aninews weekly drop", productLineId: "research" });
expect(resolveWorkItemSeriesId(item, all)).toBeUndefined();
```

```text
× discards an inferred series off the spoolcast line
  → expected 'aninews' to be undefined
```

A real RED, not a missing-function one: the unfenced inference from Cycle 29 actively leaks `aninews`
onto a research item. The test caught exactly the over-permissiveness we left in on purpose.

### GREEN

```ts
export const SPOOLCAST_PRODUCT_LINE_ID = "spoolcast";
// …
if (item.seriesId) return resolveSeriesId(item.seriesId, series);   // explicit wins, any line
if (item.productLineId !== SPOOLCAST_PRODUCT_LINE_ID) return undefined;  // off-line: no inference
const inferred = inferSeries({ title: item.title });
return inferred ? resolveSeriesId(inferred, series) : undefined;
```

The fence is a named constant, not a bare string, so the rule reads as a rule. (When a product-line
module eventually exists, this constant and `CATCH_ALL_PRODUCT_LINE_ID` can consolidate there; not
worth a module for two strings yet.)

```text
 Tests  30 passed (30)
```

### REFACTOR

None. The resolver now reads top-to-bottom as the documented precedence: explicit → fenced inference
→ nothing.

## State after this cycle

- Tests: **30 passing (10 files)**. Suite green.
- Inference is contained to the spoolcast line. Box 5 (explicit honored off-line) is next — and the
  explicit-first branch already satisfies it, so that cycle is a *guard* that locks the behavior.

## Next candidate behaviors

- [ ] honor an explicit series even off the spoolcast line (box 5) — expected to pass without new
      code; write it to lock the precedence against regressions. Finishes Section C.
