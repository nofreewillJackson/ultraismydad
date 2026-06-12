# 2026-06-09 18:48:26 - Phase 1 TDD Core Start

This log records the first cleanroom TDD work done in this repository. It is written so a beginner can replay the same steps and understand why each step happened.

## Starting Point

The repository contained only documentation:

- `AGENTS.md`
- `CLAUDE.md`
- `CLEANROOM_SPEC.md`
- `TECH_STACK.md`

There was no `package.json`, no test runner, no `src/`, and no `tests/`.

The project instructions said Phase 1 is pure domain logic TDD using Vitest. The first job was therefore to create the smallest possible TypeScript/Vitest harness before writing domain code.

## TDD Playbook Loaded

The TDD playbook was loaded from the knowledge base:

```text
playbooks/TDD-playbook.md
```

The important rules applied here were:

- Write one failing test before implementation.
- Run the test and observe the failure.
- Confirm the failure is for the right reason.
- Write the minimum code to pass.
- Run tests again.
- Refactor only after tests are green.

## Test Harness Setup

Created `package.json`:

```json
{
  "name": "ultraismydad",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest"
  },
  "devDependencies": {
    "typescript": "^5.8.3",
    "vitest": "^3.2.4"
  }
}
```

Created `tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "strict": true,
    "esModuleInterop": true,
    "forceConsistentCasingInFileNames": true,
    "skipLibCheck": true,
    "types": ["vitest/globals"]
  },
  "include": ["src/**/*.ts", "tests/**/*.ts", "vitest.config.ts"]
}
```

Created `vitest.config.ts`:

```ts
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
  },
});
```

Installed dependencies:

```sh
npm install
```

Observed output:

```text
added 101 packages, and audited 102 packages in 6s
found 0 vulnerabilities
```

Added `.gitignore` so generated dependencies and build artifacts are not treated as source:

```text
node_modules/
coverage/
dist/
```

## Behavior Inventory

Before writing domain code, the first slice of observable behaviors was listed:

- **creating a work item without visibility defaults to `private`** — the system separates authoring from delivery; a newly created item is unreviewed and possibly incomplete, so the safest default is invisible rather than published.
- **every work item resolves to exactly one product line** — taxonomy assignment is often deferred during authoring, so the domain cannot hard-require it at creation time; a catch-all placeholder keeps the authoring flow unblocked without abandoning the invariant.
- **public export excludes non-public work items** — every future read-side consumer (Astro site, API, etc.) must see the same filtered view; encoding this as a named domain function makes it impossible to accidentally bypass.

This is not an architecture plan. It is only a list of externally observable business rules from the spec.

## Cycle 1: Work Item Visibility Defaults To Private

### RED

Behavior:

```text
Creating a work item without visibility defaults to private.
```

Rationale: at creation time a work item is unreviewed and likely incomplete. If the default were `public`, any draft — including one written by an AI agent or created accidentally — would appear on the public site at the next materialization bake. `private` is the fail-safe: the worst outcome is that content is invisible, not that broken or unintended content is published. Nothing should cross the authoring-to-delivery boundary without a deliberate, explicit act.

Added `tests/work-item.test.ts`:

```ts
import { describe, expect, it } from "vitest";

import { createWorkItem } from "../src/domain/work-item";

describe("work item", () => {
  it("defaults visibility to private when omitted", () => {
    const workItem = createWorkItem({
      id: "work-001",
      title: "First Build",
      productLineId: "line-001",
    });

    expect(workItem.visibility).toBe("private");
  });
});
```

Ran the single test:

```sh
npm test -- tests/work-item.test.ts -t "defaults visibility to private when omitted"
```

Observed failure:

```text
FAIL  tests/work-item.test.ts [ tests/work-item.test.ts ]
Error: Cannot find module '../src/domain/work-item'
```

This was a valid RED failure because the test demanded a domain module that did not exist yet.

### GREEN

Added the minimum implementation in `src/domain/work-item.ts`:

```ts
export type WorkItemVisibility = "public" | "private" | "gated";

export type CreateWorkItemInput = {
  id: string;
  title: string;
  productLineId: string;
  visibility?: WorkItemVisibility;
};

export type WorkItem = {
  id: string;
  title: string;
  productLineId: string;
  visibility: WorkItemVisibility;
};

export function createWorkItem(input: CreateWorkItemInput): WorkItem {
  return {
    ...input,
    visibility: input.visibility ?? "private",
  };
}
```

Ran the targeted test:

```sh
npm test -- tests/work-item.test.ts -t "defaults visibility to private when omitted"
```

Observed pass:

```text
Test Files  1 passed (1)
Tests       1 passed (1)
```

Ran the full suite:

```sh
npm test
```

Observed pass:

```text
Test Files  1 passed (1)
Tests       1 passed (1)
```

### REFACTOR

No refactor was needed. The code was already minimal.

## Cycle 2: Missing Product Line Resolves To Catch-All

### RED

Behavior:

```text
A work item with no explicit product line resolves to the catch-all product line.
```

Rationale: the spec requires every work item to belong to a product line, but taxonomy assignment is often deferred — you may know what you built before you know which category it belongs to. Making `productLineId` mandatory at creation time would force that decision immediately, blocking drafts from being saved. The catch-all is a holding category: the domain never rejects a work item for missing taxonomy, and the item can be re-categorized later. This keeps authoring frictionless without abandoning the invariant that every work item always has a product line.

Added one new test to `tests/work-item.test.ts`:

```ts
it("uses the catch-all product line when product line is omitted", () => {
  const workItem = createWorkItem({
    id: "work-002",
    title: "Unsorted Build",
  });

  expect(workItem.productLineId).toBe("catch-all");
});
```

Ran the single new test:

```sh
npm test -- tests/work-item.test.ts -t "uses the catch-all product line when product line is omitted"
```

Observed failure:

```text
AssertionError: expected undefined to be 'catch-all'
```

This was a valid RED failure because the domain function existed, but it did not yet implement the catch-all rule.

### GREEN

Updated `src/domain/work-item.ts` minimally:

```ts
export type CreateWorkItemInput = {
  id: string;
  title: string;
  productLineId?: string;
  visibility?: WorkItemVisibility;
};

export function createWorkItem(input: CreateWorkItemInput): WorkItem {
  return {
    ...input,
    productLineId: input.productLineId ?? "catch-all",
    visibility: input.visibility ?? "private",
  };
}
```

Ran the targeted test:

```sh
npm test -- tests/work-item.test.ts -t "uses the catch-all product line when product line is omitted"
```

Observed pass:

```text
Test Files  1 passed (1)
Tests       1 passed | 1 skipped (2)
```

Ran the full suite:

```sh
npm test
```

Observed pass:

```text
Test Files  1 passed (1)
Tests       2 passed (2)
```

### REFACTOR

Extracted the literal catch-all ID to a named domain constant:

```ts
export const CATCH_ALL_PRODUCT_LINE_ID = "catch-all";
```

Then used it in `createWorkItem`:

```ts
productLineId: input.productLineId ?? CATCH_ALL_PRODUCT_LINE_ID,
```

Ran the full suite:

```sh
npm test
```

Observed pass:

```text
Test Files  1 passed (1)
Tests       2 passed (2)
```

## Cycle 3: Privacy Gate Excludes Non-Public Work Items

### RED

Behavior:

```text
Only public work items cross into the read model.
```

Rationale: without this rule encoded in the domain, every adapter that consumes work items — the Astro site, any future API, any reporting tool — would need to independently remember to filter by visibility. One forgotten filter anywhere exposes private content. Naming the filter as a domain function (`selectPublicWorkItems`) centralizes the rule so it cannot be accidentally bypassed. This is what makes the separation between the mutable authoring plane and the immutable delivery plane a guarantee rather than a convention that adapters are trusted to follow.

Added `tests/privacy-gate.test.ts`:

```ts
import { describe, expect, it } from "vitest";

import { createWorkItem } from "../src/domain/work-item";
import { selectPublicWorkItems } from "../src/domain/privacy-gate";

describe("privacy gate", () => {
  it("excludes non-public work items from the read model", () => {
    const publicWorkItem = createWorkItem({
      id: "work-public",
      title: "Published Build",
      productLineId: "line-001",
      visibility: "public",
    });
    const privateWorkItem = createWorkItem({
      id: "work-private",
      title: "Draft Build",
      productLineId: "line-001",
      visibility: "private",
    });
    const gatedWorkItem = createWorkItem({
      id: "work-gated",
      title: "Reserved Build",
      productLineId: "line-001",
      visibility: "gated",
    });

    const readModelItems = selectPublicWorkItems([
      publicWorkItem,
      privateWorkItem,
      gatedWorkItem,
    ]);

    expect(readModelItems).toEqual([publicWorkItem]);
  });
});
```

Ran the single new test:

```sh
npm test -- tests/privacy-gate.test.ts -t "excludes non-public work items from the read model"
```

Observed failure:

```text
FAIL  tests/privacy-gate.test.ts [ tests/privacy-gate.test.ts ]
Error: Cannot find module '../src/domain/privacy-gate'
```

This was a valid RED failure because the test demanded a privacy gate module that did not exist yet.

### GREEN

Added the minimum implementation in `src/domain/privacy-gate.ts`:

```ts
import type { WorkItem } from "./work-item";

export function selectPublicWorkItems(workItems: WorkItem[]): WorkItem[] {
  return workItems.filter((workItem) => workItem.visibility === "public");
}
```

Ran the targeted test:

```sh
npm test -- tests/privacy-gate.test.ts -t "excludes non-public work items from the read model"
```

Observed pass:

```text
Test Files  1 passed (1)
Tests       1 passed (1)
```

Ran the full suite:

```sh
npm test
```

Observed pass:

```text
Test Files  2 passed (2)
Tests       3 passed (3)
```

### REFACTOR

No refactor was needed. The selector was already simple and directly expressed the rule.

## Final Files Created

```text
.gitignore
package-lock.json
package.json
src/domain/privacy-gate.ts
src/domain/work-item.ts
tests/privacy-gate.test.ts
tests/work-item.test.ts
tsconfig.json
vitest.config.ts
```

## Final Verification

Command:

```sh
npm test
```

Observed output:

```text
RUN  v3.2.6 /home/temp/dev/projects/ultraismydad

✓ tests/work-item.test.ts (2 tests) 2ms
✓ tests/privacy-gate.test.ts (1 test) 2ms

Test Files  2 passed (2)
Tests       3 passed (3)
```

## Beginner Notes

The important thing is not just that the tests pass. The important thing is the order:

1. A test described one business rule.
2. The test was run and seen failing.
3. The failure was checked to make sure it matched the missing behavior.
4. Only then was production code written.
5. The test was run again and seen passing.
6. The full suite was run to make sure nothing regressed.

That sequence is what makes this TDD instead of just writing tests after the fact.
