# 2026-06-13 22:20:00 - Cycle 15: Reject a Work Item With No id (Domain Trust Boundary)

First of the trust-boundary cycles surfaced by Cycle 14. The playbook is explicit: **rejection tests
come before happy-path.** We have happy-path reads working; now we make the boundary refuse bad data.

## The decision: where does this invariant live?

A row with no `id` must not become a work item. The question is *where* to enforce it.

- **Not the store.** `id` is a domain invariant — an entity with no identity can't be routed,
  referenced, or de-duplicated; that's corruption, not a draft. Enforcing it in the adapter would
  scatter a domain rule into infrastructure (forbidden by AGENTS §5) and every other creation path
  (tests, future admin) would miss the guard.
- **The domain factory.** `createWorkItem` is the single front door for making a work item. Put the
  guard there and *every* path inherits it — including the store's `list()`, which maps rows through
  it.

## Re-derivation: does requiring id break "fast/messy authoring"?

`DOMAIN_PRIMER §0` values fast authoring with blank fields — so we must be careful not to reject
things authors legitimately leave empty. We don't here, and the reason is precise:

- Blank *content* (title) is normal fast authoring → it defaults ("untitled project").
- Blank *id* is not. In legacy the id is the **Firestore document id — infrastructure-assigned,
  never user-typed**. A row without one isn't a half-finished draft; it's a corrupt record.

So requiring `id` is correct and leaves the authoring ergonomics untouched. (This is the kind of
verdict the project says to re-derive, not assume.)

## Consequence at the build (a feature, not a bug)

Because the store does `rows.map(createWorkItem)`, a corrupt row now makes the **build fail loudly**
rather than silently dropping someone's work. That is exactly the "bake as a build-time integrity
gate" value we chose to keep (ROADMAP §2). Loud-fail-on-corruption beats silent data loss.

## Cycle 15

### RED

Behavior:

```text
createWorkItem throws when given no id.
```

```ts
expect(() => createWorkItem({ id: "", title: "Anything" })).toThrow(/id/i);
```

The `/id/i` matcher asserts not just *that* it throws but that the failure is *about the id* — a
clear, intentional error, not an incidental crash three layers down.

```text
× rejects a work item with no id
  → expected [Function] to throw an error
 Tests  1 failed | 5 passed (6)
```

Good RED: today an empty id is silently accepted (`id: ""` flows straight through `...input`).

### GREEN

```ts
export function createWorkItem(input: CreateWorkItemInput): WorkItem {
  if (!input.id) {
    throw new Error("work item requires an id");
  }
  // …
```

`!input.id` rejects both `""` and a missing/`undefined` id (the runtime shapes raw JSON can take,
even though the type says `id: string`). Message names the field → matches `/id/i`.

```text
 Tests  16 passed (16)
```

### REFACTOR

None. One guard clause at the top of the factory.

## State after this cycle

- Tests: **16 passing (8 files)**. Suite green.
- The domain now refuses an identity-less work item, at the one place all items are born.

## Next candidate behaviors

- [ ] (trust boundary) FS store rejects a snapshot whose top-level JSON is **not an array**, with a
      clear error (today: cryptic `rows.map is not a function`).
- [ ] (optional) wrap malformed-JSON parse errors with the snapshot path for a clearer build failure.
- [ ] then Section A log entries, or `/project/<slug>` routing (unblocked since Cycle 14).
