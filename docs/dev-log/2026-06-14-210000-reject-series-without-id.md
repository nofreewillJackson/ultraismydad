# 2026-06-14 21:00:00 - Cycle 24: Reject a Series With No id (Third Domain Front Door)

Starting the last two Section-A behaviors (series). A series is a sub-grouping inside a product line
(`DOMAIN_PRIMER §1.5`, legacy `data.ts:135-146`, defaults `series-defaults.json`). Same opening move
as work items (15) and log entries (18): **a new front door guards its trust boundary first.**

## Why id is the invariant here too

A series `id` is its **key** — what work items reference (`seriesId`), what counts bucket by, what
aliases fold into. A series with no id can't be referenced or resolved; it's corruption, not a draft.
Reject at the one factory so every path inherits the guard and a corrupt record fails the build loudly
(bake-as-integrity-gate, ROADMAP §2). This is now a consistent rule across all three entities.

## A design decision flagged for the next two cycles

Reading `series-defaults.json` confirmed something important for Cycle 26: each canonical series record
**declares its own `aliases`** (`aninews` → `["news-anime-bot", "faux7"]`; `videos` →
`["spoolcast-core"]`). The legacy *also* keeps a hardcoded `seriesAliases` map in `data.ts` that
duplicates exactly this. That duplication is the **accident** — two sources of truth for the same
relationship. The rebuild will derive alias resolution from the records (one source of truth) and drop
the hardcoded map. Recording the reasoning now so Cycle 26 reads as a deliberate re-derivation, not a
gap.

## Cycle 24

### RED

```ts
expect(() => createSeries({ id: "" })).toThrow(/id/i);
```

```text
Error: Failed to load url ../src/domain/series … Does the file exist?
 Test Files  1 failed (1)
```

Canonical missing-module RED.

### GREEN

```ts
export function createSeries(input: CreateSeriesInput): Series {
  if (!input.id) throw new Error("series requires an id");
  return { ...input, name: input.name ?? "" };
}
```

Type stays minimal — `{ id, name }`. `name` is coerced to a `string` (rather than left possibly
`undefined`) so the output type doesn't lie about its own shape (Cycle 14 honesty); the next cycle
replaces the `""` fallback with a derived name. No `desc`/`meta`/`kind`/`visibility`/`aliases` yet —
no test forces them.

```text
 Tests  24 passed (24)
```

### REFACTOR

None. Third factory, same shape as its two siblings.

## State after this cycle

- Tests: **24 passing (10 files)**. Suite green.
- Three domain entities now exist, each refusing to be born without identity.

## Next candidate behaviors

- [ ] title-case a series name from its id when none is given (box 1).
- [ ] resolve a series alias to its canonical id, derived from the records' declared aliases (box 2).
