# 2026-06-14 20:55:00 - Cycle 23: De-duplicate Colliding Log Slugs

The last Section-A log rule, and the first that can't be decided one entry at a time. Two entries on
the same day with the same title derive the *same* slug — and a slug is a permalink, so it must be
unique. Legacy `withUniqueJournalSlugs` (`data.ts:646-654`): first claimant keeps the base slug;
each later collision gets `-{first 6 of id, lowercased}` appended.

## Why this is a collection function, not a factory rule

`createLogEntry` is pure per-entry — it can't know whether *another* entry already took a slug. Uniqueness is a property of the **set**. So this is a separate pure function `dedupeLogSlugs(entries)`,
run as a pass over the collection (eventually in the log read path, the way the FS store maps work-item rows through `createWorkItem`). Keeping it separate preserves the factory's purity and matches the legacy's two-stage shape (normalize, then de-dup).

This is the cross-cutting rule applied: **store relationships, derive presentation.** Slug *identity*
is derived and stored per entry; collision *resolution* is a deterministic, order-dependent
derivation over the set. Same input set, same output — no randomness, no clock.

## Cycle 23

### RED

```ts
const first = createLogEntry({ id: "AAAAAAAA", title: "First Build", day: 1 });
const second = createLogEntry({ id: "BBBBBB99", title: "First Build", day: 1 });
const [a, b] = dedupeLogSlugs([first, second]);
expect(a.slug).toBe("day-1-first-build");
expect(b.slug).toBe("day-1-first-build-bbbbbb");
```

Both entries derive `day-1-first-build`. The first must keep it; the second must be suffixed with the
lowercased first-6 of *its own* id (`BBBBBB99` → `bbbbbb`). One test pins both halves of the rule
because they are one behavior observed on one input.

```text
× keeps the first colliding slug and suffixes a later one with a short id
  → (0 , dedupeLogSlugs) is not a function …
```

Good RED: missing behavior (the export doesn't exist yet).

### GREEN

```ts
export function dedupeLogSlugs(entries: LogEntry[]): LogEntry[] {
  const seen = new Map<string, number>();
  return entries.map((entry) => {
    const count = seen.get(entry.slug) ?? 0;
    seen.set(entry.slug, count + 1);
    if (count === 0) return entry;
    return { ...entry, slug: `${entry.slug}-${entry.id.slice(0, 6).toLowerCase()}` };
  });
}
```

`count === 0` → first occurrence, untouched (so distinct slugs are also left alone — the same branch
covers "no collision"). Otherwise suffix. Each later collision uses **its own** id, not a running
counter, so the suffix is stable if entries are reordered or one is deleted — a counter would
renumber survivors and break their permalinks. That choice is *why* legacy keys off id, and we keep
it.

**Accident dropped:** legacy recomputes `entry.slug || slugify(`day-${day||""}-${title}`)` inside the
de-dup loop. In our pipeline every entry already carries a slug from `createLogEntry`, so that
`|| slugify(...)` branch is dead. We key directly on `entry.slug`. Strict writer / single source of
truth: the slug is derived in exactly one place.

```text
 Tests  23 passed (23)
```

### REFACTOR

None.

## State after this cycle

- Tests: **23 passing (9 files)**. Suite green.
- **Section A log-entry rules are complete**: id guard (18), title default (19), slug from day+title
  (20) incl. day-less (21), explicit slug preserved (22), collision de-dup (23).

## Next candidate behaviors

- [ ] Section A series: title-case a series name from its id when none is given.
- [ ] Section A series: resolve a series alias to its canonical id (`news-anime-bot` → `aninews`).
- [ ] (later, when a log read path exists) wire `dedupeLogSlugs` into it, mirroring the FS store's
      `rows.map(createWorkItem)` normalization.
