# 2026-06-13 18:37:30 - Cycle 6: Export Use Case + WorkItemStore Port (Slice Step 2)

Second step of the first vertical slice. This is the **privacy seam**: the single place where
the mutable authoring world becomes the immutable public read model. If this is correct and
everything downstream reads only from here, then private data physically cannot reach a page.

## Where We Were

5 tests passing. We had an in-memory store (`save`/`list`) and the pure privacy gate
(`selectPublicWorkItems`), but nothing connected them.

## Cycle 6

### RED

Behavior under test (one sentence):

```text
The exported read model excludes non-public work items.
```

This is deliberately a **trust-boundary test first** (playbook §10): the behavior whose
*expected outcome is exclusion*. We prove the leak can't happen before we prove the happy path.

Added `tests/export-read-model.test.ts`: save one `public` and one `private` work item, export,
expect only the public one in `snapshot.workItems`.

Ran it:

```sh
npm test -- tests/export-read-model.test.ts
```

Observed failure:

```text
Test Files  1 failed (1)
Tests       no tests
```

A **good RED**: collection failed because `../src/app/export-read-model` does not exist yet.

### GREEN

This cycle is where the **port** is finally justified. Up to now the in-memory store was a bare
class. The export use case must depend on *something it can swap* (in-memory now, filesystem in
step 5), so the abstraction is demanded now — not before.

`src/store/work-item-store.ts` (the port):

```ts
import type { WorkItem } from "../domain/work-item";

export interface WorkItemStore {
  save(workItem: WorkItem): Promise<void>;
  list(): Promise<WorkItem[]>;
}
```

`src/app/export-read-model.ts` (the use case):

```ts
import type { WorkItem } from "../domain/work-item";
import { selectPublicWorkItems } from "../domain/privacy-gate";
import type { WorkItemStore } from "../store/work-item-store";

export type ReadModel = {
  workItems: WorkItem[];
};

export async function exportReadModel(store: WorkItemStore): Promise<ReadModel> {
  const all = await store.list();
  return { workItems: selectPublicWorkItems(all) };
}
```

Design notes (deliberate):

- **Dependency direction is correct.** The use case depends on the domain (`selectPublicWorkItems`)
  and on the *port interface* — never on the concrete `InMemoryWorkItemStore`. The concrete store
  is passed in (dependency injection). That is what lets us swap it for a filesystem store later
  without touching this file.
- **Why a `{ workItems }` envelope, not a bare `WorkItem[]`.** Contract A in the specs is "a map
  of collections" (work items, log entries, lines, …). The export is the one producer of that
  contract, so the snapshot is modeled as an object from the start. This is justified by a named,
  documented boundary — not speculative ceremony — and it avoids a rename when the next collection
  is added.

Targeted then full suite:

```text
Test Files  1 passed (1)        # targeted
Tests       1 passed (1)

Test Files  4 passed (4)        # full
Tests       6 passed (6)
```

### REFACTOR

Made the in-memory store explicitly implement the port so the compiler enforces the contract:

```ts
export class InMemoryWorkItemStore implements WorkItemStore { ... }
```

Full suite still green (6/6). A `tsc --noEmit` check confirmed no "incorrectly implements" error
(it did surface pre-existing `TS2835` extensionless-import warnings affecting *all* files equally
— a latent `tsconfig` mismatch unrelated to this change, to be cleaned up separately; the project
gate is `npm test`).

## State After This Cycle

- Tests: **6 passing** (was 5).
- Slice progress: **step 2/5 done** (export / privacy seam).

## Next In The Slice

- [ ] Cycle 7 — pure **render function**: a work item -> its detail HTML string.
- [ ] Cycle 8 — **Astro page** wired to export + render + a **real `astro build`** proving a
      public item produces a page and a private item does not (the slice terminus).
