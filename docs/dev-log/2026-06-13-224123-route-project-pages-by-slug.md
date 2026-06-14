# 2026-06-13 22:41:23 - Cycle 17: Route Project Pages by Slug (Retire the id-Routing Scaffold)

This cycle retires a deliberately-labelled placeholder. Since Cycle 8 the project route keyed on
`id`, flagged in three places as temporary ("Routing is by `id`, not `slug` — a later cycle"). Its
only purpose was to let the vertical slice prove the architecture without first depending on slugs.
Slugs now exist (Cycles 10–13) and every loaded item carries one (Cycle 14), so the placeholder's
value is fully spent — keeping it is just carrying dead scaffold. We swap to slug routing, the
destination the finished app always had (legacy + `TECH_STACK.md §routes` both say `/project/[slug]`).

## Why now, and why it's one small cycle (the conversation that led here)

A fair challenge was raised: if slug was always the destination and `slugify` is tiny, then routing
by `id` first was just an extra placeholder that adds a cycle and a drift risk. That's largely
right. The honest tiebreaker: **placeholder-first earns its keep only when the real thing is
expensive or risky to build; for something cheap and known-shaped, just build it.** `slugify` was
cheap, so id-first slightly over-applied the slice-purity rule. The cost was exactly one swap cycle
— this one — and the placeholder *was* tracked, so it's deliberate debt, not drift. We pay it off now.

(Slug **collisions** — two items with the same title → same slug — are explicitly out of scope: a
non-issue at this stage and irrelevant to the routing mechanic. Legacy ships slug routing without
work-item slug dedup too.)

## Cycle 17

### RED

Behavior (one sentence):

```text
getWorkItemPaths keys each public page on the item's slug (not its id).
```

The test (`tests/work-item-pages.test.ts`) now uses an item whose **id differs from its slug** — id
`wi-001`, title "Shipped Build" → slug `shipped-build` — so asserting on `slug` genuinely proves
slug-keying rather than a coincidence where id and slug happen to match:

```ts
createWorkItem({ id: "wi-001", title: "Shipped Build", visibility: "public" });
// ...
expect(paths[0].params.slug).toBe("shipped-build");
```

```sh
npm test -- tests/work-item-pages.test.ts
```

```text
× builds a page only for each public work item, keyed by slug, carrying its rendered html
  → expected undefined to be 'shipped-build'
 Tests  1 failed (1)
```

Good RED: `getWorkItemPaths` still returns `params: { id }`, so `params.slug` is `undefined`.

### GREEN

`src/app/work-item-pages.ts` — change the contract from id to slug:

```ts
export type WorkItemPage = {
  params: { slug: string };   // was: { id: string }
  props: { html: string };
};

// ...
params: { slug: workItem.slug },   // was: { id: workItem.id }
```

Privacy is still inherited from `exportReadModel` (paths come from the public set), unchanged.

```text
 Tests  17 passed (17)   # full suite
```

(Test count is unchanged — this modified an existing test to the new contract; it did not add one.)

### Framework glue (proven by the build, not a unit cycle)

1. `git mv src/pages/project/[id].astro src/pages/project/[slug].astro`. Astro binds the `[slug]`
   filename to `params.slug` returned by `getWorkItemPaths`; the page's logic is otherwise
   unchanged (still thin glue, still no business logic). Updated the in-file comment to say the URL
   key is the slug.
2. Made the sample `data/work-items.json` ids **opaque** (`wi-001`, `wi-002`) so the build *visibly*
   proves slug-keying: if it still routed by id, pages would land at `/project/wi-001/`.

### The real build (the proof)

```sh
npx astro build
#   ├─ /project/shipped-build/index.html
#   1 page(s) built
```

```text
dist/project/shipped-build/index.html   EXISTS   # slug of the public item (id = wi-001)
dist/project/wi-001                      ABSENT   # the opaque id is NOT the route  -> routed by SLUG ✔
dist/project/draft-build                 ABSENT   # private item -> no page (privacy intact)
dist/project/wi-002                      ABSENT
<h1>Shipped Build</h1>                            # rendered content present
```

The public item lives at its **slug** (`shipped-build`), never at its id (`wi-001`), and the private
item still produces nothing. Slug routing is now a physical fact of the built output.

### REFACTOR

None. The page is still thin glue; `getWorkItemPaths` is unchanged except the key name.

## State after this cycle

- Tests: **17 passing (8 files)**. Suite green. Real build re-proven.
- **The id-routing scaffold is gone.** Routes are `/project/<slug>/`. The "Routing is by `id`"
  shortcut is removed from `AGENTS.md`; `docs/APP_FLOW.md` updated to describe slug routing as the
  current state (no stale id-routing references remain in living docs).
- Source layout: `src/pages/project/[slug].astro` (was `[id].astro`).

## Next candidate behaviors

- [ ] Section A — **log entries**: log-entry slug from `day-{day}-{title}` when none provided;
      untitled log entry → "untitled entry"; log-slug de-duplication (`-{first 6 chars of id}`).
- [ ] Series name title-cased from id; series alias resolution.
- [ ] (optional/parked) wrap malformed-JSON parse errors with the snapshot path.
