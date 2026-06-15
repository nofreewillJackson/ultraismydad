# 2026-06-14 20:30:00 - Cycle 18: Reject a Log Entry With No id (New Domain Front Door)

We open a **second** domain entity: the log entry (the dated build note, `DOMAIN_PRIMER §1.3`). So
far only the work item existed. A new front door means a new trust boundary — and our hard rule is
**rejection tests come before happy-path** (AGENTS §5). Before a log entry can default its title or
derive a slug, it must refuse to exist without an identity.

## Why start a brand-new entity with a rejection

Cycle 15 established the principle for work items: `id` is the **store key / infrastructure-assigned
document id**, never user-typed. A row without one is not a half-finished draft an author left blank
for speed — it's a corrupt record. The same reasoning transfers verbatim to log entries:

- Blank *content* (title) is normal fast authoring → it will default ("untitled entry", Cycle 19).
- Blank *id* is corruption → reject at the one front door so every path (tests, future store
  `list()`, future admin) inherits the guard, and so a corrupt row makes the **build fail loudly**
  instead of silently vanishing (the "bake as integrity gate" value, ROADMAP §2).

Guarding the boundary first also means the entity is *never* in a state where it can be created
invalid — we don't bolt the lock on after building the door.

## Cycle 18

### RED

Behavior:

```text
createLogEntry throws when given no id.
```

```ts
expect(() => createLogEntry({ id: "", title: "Anything" })).toThrow(/id/i);
```

The `/id/i` matcher asserts the failure is *about the id*, not an incidental crash. The module
doesn't exist yet, so this is the canonical "missing behavior" RED (a missing module is acceptable;
a typo/bad-import is not — AGENTS §5):

```text
Error: Failed to load url ../src/domain/log-entry … Does the file exist?
 Test Files  1 failed (1)
      Tests  no tests
```

### GREEN

Smallest code: a new module with one guard clause, mirroring `createWorkItem`.

```ts
export function createLogEntry(input: CreateLogEntryInput): LogEntry {
  if (!input.id) {
    throw new Error("log entry requires an id");
  }
  return { ...input };
}
```

`!input.id` rejects both `""` and a missing/`undefined` id (the runtime shapes raw JSON can take,
even though the type says `id: string`). Message names the field → matches `/id/i`. The type stays
**minimal on purpose** — `{ id, title }` only. No `slug`, `day`, or `visibility` yet: no test forces
them, and speculative fields are forbidden (AGENTS §5). The shape grows behavior by behavior.

```text
✓ tests/log-entry.test.ts (1 test)
 Test Files  9 passed (9)
      Tests  18 passed (18)
```

### REFACTOR

None. One guard clause at the top of a new factory, intentionally shaped like its work-item sibling
so the two front doors read the same.

## State after this cycle

- Tests: **18 passing (9 files)**. Suite green.
- The domain now has a second entity whose identity is guarded at birth.

## Next candidate behaviors

- [ ] (happy path) untitled log entry defaults its title to "untitled entry".
- [ ] (happy path) derive a log-entry slug from `day-{day}-{title}` when none is provided.
- [ ] preserve an explicitly provided log-entry slug.
- [ ] de-duplicate colliding log slugs (later ones get a `-{first 6 of id}` suffix).
