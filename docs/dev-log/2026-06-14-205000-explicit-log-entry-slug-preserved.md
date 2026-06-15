# 2026-06-14 20:50:00 - Cycle 22: Preserve an Explicitly Provided Log-Entry Slug

The log-entry twin of Cycle 13 (work-item explicit slug). Derivation is a *fallback*, not a mandate:
an author or migration may pin a URL key, and we must never silently rewrite it (`data.ts:386`
`slug ||= …` — assign only when absent).

## Why "explicit wins" matters here

The slug is the permalink. If a log entry was published once at `/log/launch-week`, re-deriving it on
the next build to `day-12-launch-week` would silently break every inbound link and any cross-reference.
"Explicit beats derived" is what makes the slug a *stable identity* rather than a recomputed label —
the same guarantee we gave work items.

## Cycle 22

### RED

```ts
const logEntry = createLogEntry({ id: "log-004", title: "First Build", day: 5, slug: "pinned-log-key" });
expect(logEntry.slug).toBe("pinned-log-key");
```

```text
× preserves an explicitly provided slug
  → expected 'day-5-first-build' to be 'pinned-log-key'
```

Good RED: derivation currently steamrolls the supplied slug.

### GREEN

```ts
// type: add `slug?: string` to CreateLogEntryInput
slug: input.slug || slugify(`day-${input.day || ""}-${title}`),
```

`input.slug ||` short-circuits to the explicit value; otherwise derive. `createLogEntry` now reads
identically to `createWorkItem` for slug handling — two entities, one mental model.

```text
 Tests  22 passed (22)
```

### REFACTOR

None. The factory is complete for Section A's per-entry log rules:

```ts
export function createLogEntry(input: CreateLogEntryInput): LogEntry {
  if (!input.id) throw new Error("log entry requires an id");
  const title = input.title || DEFAULT_LOG_ENTRY_TITLE;
  return {
    ...input,
    title,
    slug: input.slug || slugify(`day-${input.day || ""}-${title}`),
  };
}
```

## State after this cycle

- Tests: **22 passing (9 files)**. Suite green.
- Per-entry log-entry identity is done: id guard, title default, slug (day-present / day-less /
  explicit). The one remaining Section-A log rule is *cross-entry*: slug de-duplication.

## Next candidate behaviors

- [ ] de-duplicate colliding log slugs — a pure function over the *collection* (first keeps base,
      later ones get `-{first 6 of id, lowercased}`). This is the first log rule that needs more than
      one entry to decide.
- [ ] then series: title-case a name from its id; resolve a series alias to its canonical id.
