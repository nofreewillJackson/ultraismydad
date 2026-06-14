# 2026-06-13 21:55:00 - Cycle 11: slugify Trims Leading/Trailing Separators

Triangulating `slugify` toward the full rule, one behavior per cycle. Cycle 10 left it doing only
lowercase + hyphenate; this cycle forces it to drop boundary separators.

## Where the test lives now

Cycle 10 tested slug *through* `createWorkItem` (the wiring — does a work item get a slug). The
remaining work is about the *transformation itself*, so it gets its own file, `tests/slug.test.ts`,
hitting `slugify` directly. Right level for the rule; no work-item noise.

## Cycle 11

### RED

Behavior:

```text
slugify strips leading and trailing separators.
```

```ts
expect(slugify("  Hello World  ")).toBe("hello-world");
```

I picked an input with leading *and* trailing whitespace so one assertion proves both ends. The
internal space→hyphen is already covered by Cycle 10, so this test isolates only the new behavior.

```text
Expected: "hello-world"
Received: "-hello-world-"
```

Good RED: the boundary whitespace became `-` (via the collapse rule) and nothing removed it.

### GREEN

```ts
return value
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, "-")
  .replace(/^-|-$/g, "");      // <- added
```

`/^-|-$/g` removes a single leading and single trailing `-`. One is enough: the collapse rule
already squashed any run of separators to exactly one `-`, so there can never be `--` at a boundary.

### A bit of the legacy I deliberately did NOT port

The answer-key slugify also calls `.trim()` *before* the replace. I left it out — it is
**redundant** here. Any leading/trailing whitespace is non-alphanumeric, so the collapse turns it
into a boundary `-`, and the new end-strip removes it. `.trim()` and the end-strip converge on the
same result (verified mentally for whitespace-only, tabs/newlines, and unicode spaces — all are
`[^a-z0-9]`). Porting it would be cargo-culting a no-op. Re-derive, don't transcribe.

```text
 Tests  12 passed (12)
```

### REFACTOR

None. The function is three honest, ordered steps.

## State after this cycle

- Tests: **12 passing (8 files)**. Suite green.
- `slugify` now: lowercase → collapse runs → trim ends. Still missing **only** the 80-char cap.

## Next candidate behaviors

- [ ] slugify truncates to 80 characters (the last rule)
- [ ] createWorkItem preserves an explicitly provided slug (identity stability)
- [ ] log-entry slug from `day-{day}-{title}`; "untitled entry"; log-slug de-duplication
