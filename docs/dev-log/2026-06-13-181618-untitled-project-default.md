# 2026-06-13 18:16:18 - Cycle 4: An Untitled Work Item Defaults To "untitled project"

This entry continues the cleanroom TDD work. From this point on, the iterations are **driven by
the assistant** (it writes and runs each test and shows the real output) while the rationale is
written down here so a human can follow exactly what was produced and why. The point is
understanding, not manual typing.

## Where We Were

Three cycles were already done (see the previous dev-log):

1. a work item with no visibility defaults to `private`,
2. a work item with no product line resolves to the `catch-all` line,
3. the privacy gate keeps only `public` work items.

Full suite at the start of this session: **3 tests passing.**

## Picking The Next Behavior

The next unproven behavior was taken straight off `BEHAVIOR_INVENTORY.md`, section A:

```text
[ ] System gives an untitled work item the title "untitled project"
```

The rule it encodes lives in `DOMAIN_PRIMER.md` §2.1, where the legacy code does
`name ||= "untitled project"`. Note the `||` (not `??`): the default must trigger not only when
the title is missing, but also when it is an **empty string**. That detail decides the
implementation later, so it was decided before writing the test, not after.

## Cycle 4

### RED

Behavior under test (one sentence):

```text
Creating a work item with an empty title gives it the title "untitled project".
```

Why empty string and not a missing field: an empty string is the simplest input that exercises
the `||` falsy-default rule while still compiling against the current type (which requires a
`title`). Allowing the field to be *omitted* entirely is a separate, later bite (it would mean
making `title` optional in the input type).

Added one test to `tests/work-item.test.ts`:

```ts
it("titles an untitled work item 'untitled project'", () => {
  const workItem = createWorkItem({
    id: "work-003",
    title: "",
  });

  expect(workItem.title).toBe("untitled project");
});
```

Ran just this test:

```sh
npm test -- tests/work-item.test.ts -t "titles an untitled work item"
```

Observed failure:

```text
FAIL  tests/work-item.test.ts > work item > titles an untitled work item 'untitled project'
AssertionError: expected '' to be 'untitled project' // Object.is equality
```

This is a **good RED**: the test reached real code, the function ran, and the behavior is simply
missing — `createWorkItem` currently passes the empty title straight through (`...input`). It is
not a typo, a bad import, or a setup error. It is the absence of the behavior we are about to add.

### GREEN

Smallest change that makes it pass, in `src/domain/work-item.ts`:

```ts
return {
  ...input,
  title: input.title || "untitled project",
  productLineId: input.productLineId ?? CATCH_ALL_PRODUCT_LINE_ID,
  visibility: input.visibility ?? "private",
};
```

`input.title || "untitled project"` — `||` so that both an empty string and a missing value fall
back, matching the legacy `||=`.

Ran the targeted test, then the full suite:

```sh
npm test -- tests/work-item.test.ts -t "titles an untitled work item"
npm test
```

Observed pass:

```text
Test Files  1 passed (1)
Tests       1 passed | 2 skipped (3)
```

```text
✓ tests/work-item.test.ts (3 tests) 2ms
✓ tests/privacy-gate.test.ts (1 test) 2ms

Test Files  2 passed (2)
Tests       4 passed (4)
```

### REFACTOR

The string `"untitled project"` is a domain constant, so it was extracted to a named export to
match the existing `CATCH_ALL_PRODUCT_LINE_ID` pattern in the same file:

```ts
export const DEFAULT_WORK_ITEM_TITLE = "untitled project";
```

and used in the function:

```ts
title: input.title || DEFAULT_WORK_ITEM_TITLE,
```

Behavior is unchanged; this only names the value. Ran the full suite again to confirm:

```sh
npm test
```

```text
Test Files  2 passed (2)
Tests       4 passed (4)
```

## State After This Cycle

- Tests: **4 passing** (was 3).
- `BEHAVIOR_INVENTORY.md` section A: the "untitled project" box is now satisfied.

## Next Candidate Behaviors (section A)

Still open, smallest-first:

- [ ] generate a work-item slug from its title when none is provided
- [ ] gives an untitled log entry the title "untitled entry"
- [ ] lowercase / hyphenate / trim / truncate a slug to 80 characters

## Why This Counts As Progress

A new behavior is only "real" once a test demanded it and then passed. This cycle added exactly
one such behavior, kept the full suite green, and left the code a little tidier than it found it.
That is one full turn of the loop the whole project runs on.
