# 2026-06-13 21:53:00 - Cycle 10: Work-Item Slug Derived From Title

The vertical slice is done; now we **broaden the domain**. First stop: `BEHAVIOR_INVENTORY.md`
Section A ("Slugs, identity & naming"), item 1 — *the system generates a work-item slug from its
title when none is provided*.

## The design decision I had to make first (not cargo-cult)

Where does the slug live — **stored on the work item**, or **derived at the page/render layer**?

Our own cross-cutting rule (AGENTS §5) literally lists "slugs" as a *derived pure function*
("store relationships, derive presentation"). Read naively, that says: don't store a slug, compute
`slugify(title)` when rendering. But the inventory phrases this behavior as "generate a slug …
**when none is provided**", which presupposes a slug *can* be provided and kept. Legacy agrees:
`data.ts:261-276` does `slug ||= slugify(name)`.

I reconciled it instead of picking a side blindly:

- The drift "derive, don't store" guards against is a **stored copy going stale** when its source
  changes. That genuinely applies to counts, day-numbers, heatmaps — recomputable aggregates.
- A **URL slug is the opposite**: you *want* it pinned even after the title changes, so inbound
  links don't break. That makes the slug **identity**, not presentation. (Section A is even titled
  "Slugs, **identity** & naming.")
- So `slugify(title)` stays a pure derived function — the rule is honored for the *transformation* —
  while the work item's `slug` is an identity field: explicit if given (stable), seeded from the
  title via slugify when absent. That is the exact shape `createWorkItem` already uses for `title`,
  `visibility`, and `productLineId`.

Verdict: slug is a field on `WorkItem`, defaulted in `createWorkItem`. Same pattern as everything
else there, and consistent with legacy — which we keep here because it's genuine domain, not one of
the spec's overzealous "accidents."

## The canonical rule (from the answer key)

`~/dev/projects/artluai-pre-cleanroom/src/lib/format.ts:3` — the slugify the *site read path* uses:

```ts
value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 80)
```

lowercase → collapse any run of non-alphanumerics to one `-` → strip leading/trailing `-` → cap at
80 chars. (Two other copies disagree on apostrophes; the read path turns `'` into `-`. We follow the
read path.) I do **not** implement all of this now — see below.

## Cycle 10

### RED

Behavior (one sentence):

```text
createWorkItem derives a slug from the title when no slug is provided.
```

Added to `tests/work-item.test.ts`:

```ts
const workItem = createWorkItem({ id: "work-004", title: "Hello World" });
expect(workItem.slug).toBe("hello-world");
```

```sh
npm test -- tests/work-item.test.ts
```

```text
expect(workItem.slug).toBe("hello-world");
                      ^
- Expected: "hello-world"
+ Received: undefined
 Tests  1 failed | 3 passed (4)
```

Good RED: `slug` is `undefined` — the behavior is missing, not a typo or bad import.

### GREEN — and a deliberate under-implementation

New module `src/domain/slug.ts`. I wrote the **smallest** slugify that passes *this* test — lowercase
and collapse non-alphanumeric runs to a hyphen. **No trim, no truncation yet.**

```ts
export function slugify(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-");
}
```

This is **triangulation** on purpose. I already know the full rule from the answer key, but writing
it all now would be speculative code no test is asking for — exactly what the playbook forbids
("smallest code that passes; no speculative structure"). The trim and the 80-char cap are *separate
behaviors* and get their own cycles, each forced by its own failing test. Writing them now would
mean shipping untested branches dressed up as tested ones.

Wired into `createWorkItem`, computing the slug from the **already-defaulted** title so the two
defaults compose:

```ts
const title = input.title || DEFAULT_WORK_ITEM_TITLE;
return { ...input, title, slug: slugify(title), /* … */ };
```

Because the title default runs first, an untitled item flows "" → "untitled project" →
`untitled-project` for free — Cycle 4 and Cycle 10 compose with no special case.

```text
 Tests  4 passed (4)        # targeted
 Tests  11 passed (11)      # full suite
```

### REFACTOR

Nothing to tidy. `slugify` is an isolated pure function; `createWorkItem` reads cleanly.

## A consistency note I'm parking (not a bug today)

`WorkItem` now has `slug: string`, but `data/work-items.json` rows have no `slug` — the filesystem
store deserializes them with a cast, so at runtime those items carry `slug: undefined`. The build is
**unaffected** because routing is still by `id`, not slug. When we switch routing to `/project/<slug>`
(a later cycle) we'll need the store's **read path to normalize loaded items** (apply the same
defaults `createWorkItem` does) — which is exactly what legacy does on read. That's a real future
behavior, noted below, not something to bolt on speculatively now.

## State after this cycle

- Tests: **11 passing (7 files)**. Suite green.
- `slugify` exists but only does lowercase + hyphenate. Trim and truncate are still missing **by
  design**, waiting for their own RED tests.

## Next candidate behaviors

- [ ] slugify trims leading/trailing separators (`"Hello World!"` → `hello-world`, not `hello-world-`)
- [ ] slugify truncates to 80 characters
- [ ] createWorkItem preserves an explicitly provided slug (identity stability)
- [ ] log-entry slug from `day-{day}-{title}`; "untitled entry"; log-slug de-duplication (Section A)
- [ ] store read-path normalization (apply defaults to loaded JSON; needed before slug routing)
