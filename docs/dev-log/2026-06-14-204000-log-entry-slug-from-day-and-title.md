# 2026-06-14 20:40:00 - Cycle 20: Log-Entry Slug from day + title

Inventory line 17, the core of log-entry identity (`DOMAIN_PRIMER §2.2`, legacy `data.ts:386`
`slug ||= slugify(`day-${day||""}-${title}`)`). A log entry's URL key is `day-{day}-{title}`,
slugified — distinct from a work item's `slugify(title)` because a daily log is addressed by *when*
as well as *what*.

## The cross-cutting rule in action

We do **not** write a second slug algorithm. The same pure `slugify` (built across Cycles 10-13)
lowercases / hyphenates / trims / truncates. Log entries only differ in the *string they feed it*
(`day-{day}-{title}` vs `title`). "Store relationships, derive presentation; one slug rule" — the
derivation differs, the normalization is shared.

Like the work item, the slug is **identity**: derived once at creation and stored on the entity, not
recomputed at render. Same reasoning as Cycle 13 — a URL key must be stable.

## Cycle 20

### RED

```ts
const logEntry = createLogEntry({ id: "log-002", title: "First Build", day: 5 });
expect(logEntry.slug).toBe("day-5-first-build");
```

```text
× derives a slug from day and title when no slug is provided
  → expected undefined to be 'day-5-first-build'
 Tests  1 failed | 2 passed (3)
```

Good RED: no slug is produced today (`undefined`).

### GREEN

```ts
import { slugify } from "./slug";
// …
slug: slugify(`day-${input.day}-${title}`),
```

`slugify("day-5-First Build")` → `day-5-first-build`. The output type gains `slug: string`, and
`day?: number` is added to **both** input and output — the entity genuinely has a day, and since we
`...input`, the type must not under-report what's on the object (the honesty lesson from Cycle 14).

```text
 Tests  20 passed (20)
```

### A deliberate gap (triangulation, not an oversight)

I wrote `day-${input.day}`, **not** the legacy's `day-${input.day || ""}`. With no day, that yields
`"day-undefined-…"` — a latent glass invariant the current single test can't see (it always passes a
day). Per AGENTS §5 (smallest code, no untested/adjacent behavior) I am **not** handling missing-day
here. The very next cycle writes the failing test for a day-less entry and drives the `|| ""` fix —
the same triangulation that grew `slugify` one rule at a time. Recording it here so it reads as
intentional, not forgotten.

### REFACTOR

None. One derivation expression, delegating to the shared slugify.

## State after this cycle

- Tests: **20 passing (9 files)**. Suite green.
- Log entries with a day now have a stable, derived URL key.

## Next candidate behaviors

- [ ] a day-less log entry slugs as `day-{title}` (no literal "undefined") — drives `|| ""`.
- [ ] preserve an explicitly provided log-entry slug.
- [ ] de-duplicate colliding log slugs (later ones get a `-{first 6 of id}` suffix).
