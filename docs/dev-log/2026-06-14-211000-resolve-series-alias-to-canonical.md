# 2026-06-14 21:10:00 - Cycle 26: Resolve a Series Alias to Its Canonical id (de-accidented)

Section A box 2 of 2, and the last Section-A behavior overall. A reference to a series may use an old
or alternate id (`news-anime-bot`, `faux7`, `spoolcast-core`); the system must fold it onto the
canonical record (`aninews`, `aninews`, `videos`) so references, counts, and grouping all agree.

## The re-derivation: one source of truth for aliases

Legacy resolves this with a **hardcoded `seriesAliases` map** in `data.ts:247-251`:

```js
const seriesAliases = { "news-anime-bot": "aninews", "faux7": "aninews", "spoolcast-core": "videos" };
```

But `series-defaults.json` *already* states the same thing on the records themselves:

```json
{ "id": "aninews", "aliases": ["news-anime-bot", "faux7"] }
{ "id": "videos",  "aliases": ["spoolcast-core"] }
```

Two sources of truth for one relationship — change a record's aliases and the map silently disagrees.
That duplication is the **accident** (AGENTS §3-4: re-derive, don't cargo-cult). The rebuild keeps the
relationship where it belongs — **on the record** — and derives resolution from it. Delete the map.

This is the cross-cutting rule in its purest form: **store the relationship (declared aliases), derive
the lookup.** It also directly serves the prime mission — fewer duplicated facts means less for a
future onboarder to keep in sync, i.e. less debt.

## Also dropped: createSeries no longer canonicalizes its own id

Legacy `normalizeSeries` does `normalizeSeriesId(data.id || id)` on the record's own id. With
record-owned aliases that's circular — a canonical record's id is canonical by definition; it isn't
its own alias. So `createSeries` stores the id as-is. One less defensive call, one less way to be
subtly wrong.

## Cycle 26

### RED

```ts
const all = [
  createSeries({ id: "aninews", aliases: ["news-anime-bot", "faux7"] }),
  createSeries({ id: "videos", aliases: ["spoolcast-core"] }),
];
expect(resolveSeriesId("news-anime-bot", all)).toBe("aninews");
```

```text
× resolves a declared alias to its canonical series id
  → (0 , resolveSeriesId) is not a function
```

Good RED: missing behavior. The test also forces `Series` to carry `aliases` (the resolver reads
them) — so it proves the whole chain: records declare aliases → resolver folds a reference onto the
canonical id.

### GREEN

```ts
// type: aliases?: string[] on input, aliases: string[] on Series
aliases: input.aliases ?? [],
// …
export function resolveSeriesId(value: string, series: Series[]): string {
  for (const record of series) {
    if (record.aliases.includes(value)) return record.id;
  }
  return value;
}
```

A non-alias value resolves to itself (`return value`) — both the "already canonical" and "unknown"
cases, which is correct: resolution is idempotent on canonical ids. Aliases default to `[]` so a
record without any is simply never a fold target.

```text
 Tests  26 passed (26)
```

### REFACTOR

None. The linear scan is fine for the handful of series; if call sites multiply (Section C wires this
into work-item series references), I'll memoize an alias→id index then — under green, when there's a
second caller to justify it.

## State after this cycle

- Tests: **26 passing (10 files)**. Suite green.
- **Section A (Slugs, identity & naming) is COMPLETE** — all 8 behaviors across work items, log
  entries, and series.

## Next candidate behaviors

- Section A done. Next per ROADMAP: **Section C (series inference)** — keep an explicit series
  assignment, infer a series from text only under the spoolcast line, discard an inferred series
  elsewhere. `resolveSeriesId` is the foundation those build on (explicit `seriesId` → run through
  alias normalization first).
- Or pick up a parked item: wire `dedupeLogSlugs`/series into a read path; HTML-escaping in
  `renderWorkItemDetail`; build-integrity gate.
