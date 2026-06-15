# 2026-06-14 21:05:00 - Cycle 25: Title-Case a Series Name From Its id

Section A box 1 of 2 for series (`DOMAIN_PRIMER §2.3` / line 190, legacy `labelSeries`
`data.ts:338-344`). When a series has no display name, derive one from its id:
`spoolcast-dev-log` → `Spoolcast Dev Log`.

## The cross-cutting rule, again

This is the same shape as every label in the system: **id is stored identity; the name is a derived
presentation function.** A series record carries an opaque, stable id (the key references use); the
human label is computed, not a second field anyone has to keep in sync. `seriesNameFromId` is pure —
same id, same name, no I/O.

## Cycle 25

### RED

```ts
const series = createSeries({ id: "spoolcast-dev-log" });
expect(series.name).toBe("Spoolcast Dev Log");
```

```text
× title-cases a name from the id when no name is given
  → expected '' to be 'Spoolcast Dev Log'
```

Good RED: today `name` falls back to the empty placeholder from Cycle 24.

### GREEN

```ts
export function seriesNameFromId(id: string): string {
  return id
    .replace(/[-_]+/g, " ")                       // separators → spaces
    .replace(/\b\w/g, (letter) => letter.toUpperCase()); // title-case each word
}
// …
name: input.name || seriesNameFromId(input.id),
```

`||` (not `??`) so an empty-string name also derives — consistent with the title defaults on the
other two entities.

### A legacy rule deliberately NOT ported (yet)

`labelSeries` also does `.replace(/^series[-_]/, "")` — stripping a redundant `series-`/`series_`
prefix from ids like `series-launch`. **No test forces it and no real series id in
`series-defaults.json` uses it** (`aninews`, `spoolcast-dev-log`, `videos`). Per AGENTS §5 (smallest
code, no untested behavior) I left it out. If a `series-`-prefixed id ever appears, a failing test
will drive it back in. Recording the omission so it's a known, intentional decision rather than a
silent divergence from the primer.

### REFACTOR

None.

## State after this cycle

- Tests: **25 passing (10 files)**. Suite green.
- A nameless series now presents a readable, derived label.

## Next candidate behaviors

- [ ] resolve a series alias to its canonical id (box 2) — derived from the records' declared
      `aliases`, dropping the legacy hardcoded duplicate map. This finishes Section A.
