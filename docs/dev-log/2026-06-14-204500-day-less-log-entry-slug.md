# 2026-06-14 20:45:00 - Cycle 21: A Day-less Log Entry Slugs Without "undefined"

Closes the deliberate gap left by Cycle 20. The legacy rule is `day-${day || ""}-${title}`
(`data.ts:386`); we had written `day-${input.day}`, which interpolates the literal string
`"undefined"` when no day is set.

## Why this earned its own cycle

A day is *optional* (`DOMAIN_PRIMER §1.3` — "usually echoes date math but stored too"). Plenty of log
entries won't carry one. A URL key reading `/log/day-undefined-first-build` is broken in a way no
test could see while every test happened to pass a day — the exact "glass invariant" class of bug
Cycle 14 was about. Triangulating with a second, day-less example forces the general rule instead of
hard-coding to the one happy example.

## Cycle 21

### RED

```ts
const logEntry = createLogEntry({ id: "log-003", title: "First Build" }); // no day
expect(logEntry.slug).toBe("day-first-build");
```

```text
× slugs a day-less log entry without a literal 'undefined'
  → expected 'day-undefined-first-build' to be 'day-first-build'
```

Good RED, and it shows the bug verbatim: `day-undefined-first-build`.

### GREEN

```ts
slug: slugify(`day-${input.day || ""}-${title}`),
```

With no day the template is `day--First Build`; `slugify` collapses the `--` run (its
`[^a-z0-9]+ → -` rule already handles consecutive separators) to give `day-first-build`. No new slug
logic — the shared normalizer absorbs the empty segment for free, which is *why* a single slugify is
worth keeping.

`|| ""` (not `?? ""`) matches legacy and also treats a nonsensical `day: 0` as absent — day numbering
is 1-based, so 0 should not appear in a URL.

```text
 Tests  21 passed (21)
```

### REFACTOR

None.

## State after this cycle

- Tests: **21 passing (9 files)**. Suite green.
- Log-entry slug derivation is complete for both day-present and day-less inputs.

## Next candidate behaviors

- [ ] preserve an explicitly provided log-entry slug (mirror the work-item rule).
- [ ] de-duplicate colliding log slugs (later ones get a `-{first 6 of id}` suffix).
- [ ] then series: title-case a name from its id; resolve a series alias to its canonical id.
