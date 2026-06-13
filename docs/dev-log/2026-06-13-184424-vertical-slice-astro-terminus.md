# 2026-06-13 18:44:24 - Cycle 8: Astro Page + Real Build (Slice Terminus)

The point of the whole vertical slice. Earlier cycles built a logic layer; this one drives that
layer through the **real framework boundary** and proves it with an actual `astro build`. Stopping
before this would have been horizontal slicing in disguise — a tidy core that never proved it
survives contact with the framework. (This was a course-correction; see the conversation that
preceded it.)

## Why The Framework Edge Has To Be In The Slice

The TDD playbook (§3) warns about *glass invariants*: rules that look right in memory and shatter
when attached to real I/O or a framework. A render function that returns an HTML string is exactly
such a glass invariant until a real page actually renders it during a real build. So the slice's
terminus is a page on disk, produced by `astro build`, with the privacy rule intact.

## Setup (config / glue — not a TDD cycle)

Per playbook §12, mechanical setup is not unit-TDD'd; it is verified by the build itself.

- Installed Astro 6 (`astro@^6`, resolved `6.4.6`) to match the reference app's stack.
- Added `astro.config.mjs` with `output: "static"` — we keep the bake on purpose (ROADMAP.md §2).
- Added `dev`/`build`/`preview` npm scripts.
- Ignored Astro's generated `.astro/` cache.

## Cycle 8

### RED

Behavior under test (one sentence):

```text
A page is built for each public work item (carrying its rendered html), and none for private items.
```

The logic that decides this lives in a **testable TS use case**, `getWorkItemPaths(store)`, so the
`.astro` file can stay thin. `tests/work-item-pages.test.ts`: a store with one public + one private
item; expect exactly one path, for the public id, whose `props.html` contains the title.

Ran it:

```sh
npm test -- tests/work-item-pages.test.ts
```

Observed failure:

```text
Test Files  1 failed (1)
Tests       no tests
```

A **good RED**: `../src/app/work-item-pages` does not exist yet.

### GREEN

`src/app/work-item-pages.ts` — composes the two pieces already built (export = privacy, render =
html) into Astro's `getStaticPaths` shape:

```ts
export async function getWorkItemPaths(store: WorkItemStore): Promise<WorkItemPage[]> {
  const { workItems } = await exportReadModel(store);
  return workItems.map((workItem) => ({
    params: { id: workItem.id },
    props: { html: renderWorkItemDetail(workItem) },
  }));
}
```

Note: privacy is **inherited**, not re-implemented. Because the paths come from `exportReadModel`,
a private item can never get a route. There is no second place to keep the rule in sync.

Targeted then full suite:

```text
Test Files  1 passed (1)        # targeted
Tests       1 passed (1)

Tests       8 passed (8)        # full
```

### The thin Astro page (glue)

`src/pages/project/[id].astro` contains no business logic — it calls the tested use case and
injects the produced html:

```astro
export async function getStaticPaths() {
  return getWorkItemPaths(await sampleStore());
}
const { html } = Astro.props;
...
<body set:html={html}></body>
```

### The real build (the proof)

```sh
npx astro build
```

```text
generating static routes
  ├─ /project/shipped-build/index.html
✓ Completed
1 page(s) built
```

Inspected the actual output:

```text
dist/project/shipped-build/index.html        # exists
  -> contains <h1>Shipped Build</h1>          # rendered title present
dist/project/draft-build                      # DOES NOT EXIST
```

The private work item produced **no file at all**. The privacy boundary is now proven as a
*physical fact in the built output*, not merely as a passing unit test. That is the whole game.

## Decisions / Scaffolding To Unwind

- **Routing by `id`, not `slug`.** The slice's job is to prove the path + privacy at the framework
  edge, not to have pretty URLs. Slug generation (and `/project/<slug>`) is a later cycle. Routing
  by id keeps this cycle minimal.
- **`src/app/sample-data.ts` is temporary.** The static build needs data at build time, but the
  real source (a filesystem snapshot) is the next step. The sample store is an explicit,
  clearly-labelled scaffold, removed in Cycle 9.

## State After This Cycle

- Tests: **8 passing**; plus a real `astro build` producing the correct pages.
- Slice progress: **step 4/5 done — the walking skeleton is alive end to end.**

## The One Step Left To Make The Slice "Real"

- [ ] Cycle 9 — replace `sample-data.ts` with a **filesystem snapshot adapter** implementing
      `WorkItemStore`, tested for real against a temp directory (owned infrastructure, not mocked).
      After that the slice is real from a persisted file all the way to a built page.
