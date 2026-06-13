# 2026-06-13 18:30:45 - Cycle 5: In-Memory Work Item Store (Vertical Slice, Step 1)

This cycle starts the **first vertical slice**. Until now every cycle was pure domain logic.
The slice exists to prove the thinnest *meaningful* path through the whole system, end to end,
before we pile on more domain rules — so we don't build "glass invariants" (rules that look
right in memory and shatter the moment they touch persistence or a framework boundary).

## The Slice We Are Building

```
PERSIST ──▶ EXPORT (privacy gate) ──▶ RENDER FN ──▶ ASTRO PAGE (real build)
                                                     public item -> page exists
                                                     private item -> no page
```

The terminus is a **real Astro page rendered during a real build**, not a render function in
isolation. Stopping before the framework edge would be horizontal slicing in disguise: a full
logic layer that never crosses the one boundary where integration bugs actually live. This cycle
is step 1 of 5: the left end, persistence.

## Where We Were

Four cycles done; **4 tests** passing (work-item defaults + privacy gate, all pure/in-memory).

## Cycle 5

### RED

Behavior under test (one sentence):

```text
A saved work item is returned when the store is listed.
```

Added `tests/in-memory-work-item-store.test.ts`:

```ts
import { describe, expect, it } from "vitest";

import { createWorkItem } from "../src/domain/work-item";
import { InMemoryWorkItemStore } from "../src/store/in-memory-work-item-store";

describe("in-memory work item store", () => {
  it("returns a saved work item when listing", async () => {
    const store = new InMemoryWorkItemStore();
    const workItem = createWorkItem({
      id: "work-001",
      title: "First Build",
      visibility: "public",
    });

    await store.save(workItem);

    expect(await store.list()).toEqual([workItem]);
  });
});
```

Ran it:

```sh
npm test -- tests/in-memory-work-item-store.test.ts
```

Observed failure:

```text
Error: Failed to load url ../src/store/in-memory-work-item-store ... Does the file exist?
Test Files  1 failed (1)
```

A **good RED**: the test demands a store module that does not exist yet. That is valid design
pressure (the playbook explicitly allows "the target file does not exist" as an acceptable RED),
not a typo or a broken assertion.

### GREEN

Smallest store that passes, `src/store/in-memory-work-item-store.ts`:

```ts
import type { WorkItem } from "../domain/work-item";

export class InMemoryWorkItemStore {
  private readonly workItems: WorkItem[] = [];

  async save(workItem: WorkItem): Promise<void> {
    this.workItems.push(workItem);
  }

  async list(): Promise<WorkItem[]> {
    return this.workItems;
  }
}
```

Two design notes (decided deliberately, not by habit):

- **Why `async`/`Promise` for an in-memory array.** Step 5 of this slice replaces this with a
  real filesystem store, which is inherently async. The store *port* must be one uniform type
  that both adapters satisfy; a sync in-memory store and an async file store cannot share a
  type. So async is the minimal choice that meets a boundary already inside this slice — not
  speculation. (Without the filesystem adapter planned, sync would have been correct.)
- **No `WorkItemStore` interface yet.** The port abstraction is introduced only when a consumer
  needs to depend on something swappable — that happens in the next cycle (the export use case).
  Creating the interface now, with no consumer, would be ceremony ahead of demand.

Ran targeted, then full suite:

```text
Test Files  1 passed (1)        # targeted
Tests       1 passed (1)

Test Files  3 passed (3)        # full
Tests       5 passed (5)
```

### REFACTOR

`list()` returned the live internal array, letting a caller mutate the store's private state.
Returned a copy instead — same behavior, safer encapsulation:

```ts
async list(): Promise<WorkItem[]> {
  return [...this.workItems];
}
```

Full suite still green:

```text
Test Files  3 passed (3)
Tests       5 passed (5)
```

## State After This Cycle

- Tests: **5 passing** (was 4).
- Slice progress: **step 1/5 done** (persistence, in-memory).

## Next In The Slice

- [ ] Cycle 6 — **export use case**: read all work items from the store (via a `WorkItemStore`
      port, born here), apply the privacy gate, emit the read snapshot. Headline test: a private
      item never appears in the output.
- [ ] Cycle 7 — pure **render function**: a work item -> its detail-page HTML.
- [ ] Cycle 8 — **Astro page** wired to the above + a real render/build test (public renders,
      private absent). The slice's true terminus.
- [ ] Cycle 9 — swap the in-memory store for the **real filesystem adapter** (integration test
      against a temp directory). Slice is now real top to bottom.
