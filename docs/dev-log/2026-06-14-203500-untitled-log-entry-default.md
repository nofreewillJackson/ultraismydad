# 2026-06-14 20:35:00 - Cycle 19: Untitled Log Entry Defaults to "untitled entry"

Boundary guarded (Cycle 18); now the first happy-path behavior. This is the log-entry twin of the
work-item rule from Cycle 4 (`DOMAIN_PRIMER §2.2`, legacy `data.ts:383` `title ||= "untitled entry"`).

## Why a default and not a rejection (the contrast with id)

A blank title is *fast/messy authoring*, which the project explicitly values (`DOMAIN_PRIMER §0`): an
author jots a note and moves on. The system supplies a sensible placeholder so the entry is still
addressable and renderable. Contrast the id (Cycle 18): blank content defaults; blank identity is
rejected. Same entity, two opposite treatments, each correct for what the field *is*.

## Cycle 19

### RED

```ts
const logEntry = createLogEntry({ id: "log-001", title: "" });
expect(logEntry.title).toBe("untitled entry");
```

```text
× titles an untitled log entry 'untitled entry'
  → expected '' to be 'untitled entry'
 Tests  1 failed | 1 passed (2)
```

Good RED: the empty title flows straight through `...input` today — no default applied.

### GREEN

```ts
export const DEFAULT_LOG_ENTRY_TITLE = "untitled entry";
// …
const title = input.title || DEFAULT_LOG_ENTRY_TITLE;
return { ...input, title };
```

`||` (not `??`) so an empty string `""` also triggers the default — `""` is falsy, which is the
whole point. Named constant mirrors `DEFAULT_WORK_ITEM_TITLE`; the two factories now read in
parallel, which is the point of keeping them shaped alike.

```text
 Tests  19 passed (19)
```

### REFACTOR

None. The factory already matches its work-item sibling line for line.

## State after this cycle

- Tests: **19 passing (9 files)**. Suite green.
- A titleless log entry is now addressable ("untitled entry"); next it needs a slug.

## Next candidate behaviors

- [ ] derive a log-entry slug from `day-{day}-{title}` when none is provided.
- [ ] preserve an explicitly provided log-entry slug.
- [ ] de-duplicate colliding log slugs (later ones get a `-{first 6 of id}` suffix).
