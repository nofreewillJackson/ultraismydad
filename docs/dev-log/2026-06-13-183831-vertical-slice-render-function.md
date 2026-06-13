# 2026-06-13 18:38:31 - Cycle 7: Pure Render Function (Slice Step 3)

Third step of the slice: turn one work item into HTML. Kept as a **plain, pure TypeScript
function** rather than Astro markup, on purpose: presentation logic stays in tested code, and
the Astro page (next cycle) becomes thin glue that just calls this. That keeps the dependency
direction clean — the framework depends on our code, never the reverse.

## Where We Were

6 tests passing: store + export/privacy seam. We could produce a public snapshot but had no way
to turn an item into something a browser shows.

## Cycle 7

### RED

Behavior under test (one sentence):

```text
Rendering a work item produces HTML containing its title in a heading.
```

Added `tests/render-work-item-detail.test.ts`:

```ts
const workItem = createWorkItem({
  id: "shipped-build",
  title: "Shipped Build",
  visibility: "public",
});

const html = renderWorkItemDetail(workItem);

expect(html).toContain("<h1>Shipped Build</h1>");
```

Ran it:

```sh
npm test -- tests/render-work-item-detail.test.ts
```

Observed failure:

```text
Test Files  1 failed (1)
Tests       no tests
```

A **good RED**: `../src/render/work-item-detail` does not exist yet.

### GREEN

Smallest renderer, `src/render/work-item-detail.ts`:

```ts
import type { WorkItem } from "../domain/work-item";

export function renderWorkItemDetail(workItem: WorkItem): string {
  return `<h1>${workItem.title}</h1>`;
}
```

Targeted then full suite:

```text
Test Files  1 passed (1)        # targeted
Tests       1 passed (1)

Tests       7 passed (7)        # full
```

### REFACTOR

None needed; the function is already minimal.

## A Deliberate Deferral (not an oversight)

The title is interpolated **raw** into the HTML, so this is **not HTML-escaped**. Escaping
untrusted text is a genuine trust-boundary behavior, but TDD says we don't add it until a test
demands it. It gets its own cycle later (the legacy app does this inside `renderMarkdownLite`).
Recording it here so it is tracked, not forgotten:

- [ ] render escapes HTML-significant characters in the title/body (XSS trust boundary)

## State After This Cycle

- Tests: **7 passing** (was 6).
- Slice progress: **step 3/5 done** (render).

## Next In The Slice

- [ ] Cycle 8 — **Astro page** wired to export + render, proven by a **real `astro build`**:
      a public item produces a page; a private item does not. The slice's terminus (the first
      time the whole pipe runs through the real framework boundary).
