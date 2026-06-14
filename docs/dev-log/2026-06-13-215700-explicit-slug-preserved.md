# 2026-06-13 21:57:00 - Cycle 13: createWorkItem Preserves an Explicit Slug

Closes the loop on Section A.1. Cycle 10 derived a slug "when none is provided"; this cycle handles
the other half — when one *is* provided, keep it. This is the identity-stability behavior I argued
for in Cycle 10's design note: a slug is a pinned URL key, not a recomputed-from-title value.

## Cycle 13

### RED

Behavior:

```text
createWorkItem keeps an explicitly provided slug instead of deriving one.
```

```ts
const workItem = createWorkItem({
  id: "work-005",
  title: "Hello World",
  slug: "pinned-url-key",
});
expect(workItem.slug).toBe("pinned-url-key");
```

```text
Expected: "pinned-url-key"
Received: "hello-world"
```

Good RED: `createWorkItem` currently *always* derives, so the explicit slug was overwritten by
`slugify(title)`. Behavior missing, not a typo.

### GREEN

Added `slug?: string` to `CreateWorkItemInput` and made the default conditional:

```ts
slug: input.slug || slugify(title),
```

Three small decisions, each deliberate:

- **`||`, not `??`.** Matches the `title` default right above it and legacy's `slug ||= slugify(name)`.
  Consequence: an *empty* explicit slug (`""`) is treated as "not provided" and falls back to
  derivation. That's the right call — an empty string is not a usable URL key.
- **Explicit slug taken verbatim** (not re-slugified). Legacy stores the provided slug as-is; the
  author owns their chosen URL key. The test uses an already-clean slug, so it does *not* force the
  question "should we sanitize a messy explicit slug?" — and I refuse to answer an undocumented
  question no test is asking. If that behavior is ever needed, it gets its own cycle.
- **Identity over recomputation.** This is the concrete payoff of Cycle 10's reasoning: rename the
  title later and the URL stays put, because the slug was pinned at creation.

```text
 Tests  14 passed (14)
```

### REFACTOR

None.

## State after this cycle

- Tests: **14 passing (8 files)**. Suite green.
- **Section A's work-item slug behaviors are complete**: derive-from-title, the full slugify rule
  (lowercase/hyphenate/trim/truncate-80), untitled→"untitled project"→"untitled-project" (composed),
  and explicit-slug preservation.

## Next candidate behaviors (Section A, remaining)

- [ ] log-entry slug from `day-{day}-{title}` when none provided
- [ ] untitled log entry → title "untitled entry"
- [ ] log-slug de-duplication (later collisions get a `-{first 6 of id}` suffix)
- [ ] series name title-cased from id; series alias resolution (`news-anime-bot` → `aninews`)
- [ ] (infra, before slug routing) store read-path normalizes loaded JSON items
