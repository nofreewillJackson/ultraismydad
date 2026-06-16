# Retire Third Visibility State

## Behavior

The shared visibility vocabulary should contain only the states with live behavior in the rebuild:
`public` and `private`.

Deep scan result: the old third status had no active branch in source. It was accepted by the shared
type and one garden frontmatter parser, then treated exactly like private by the single export gate
because only `visibility === "public"` is published. No current content or data rows used it.

The only distinct legacy behavior was for work-item files: visible-but-locked file metadata with no
body emitted. The rebuild does not have that file model yet, so keeping the old value globally would
be drift. If that feature returns, it should be rebuilt as file-specific behavior.

## RED

No fake RED was created for this cleanup. Existing coverage already proved the relevant behavior:
the export seam only publishes records whose visibility is exactly `public`. This cycle removed an
unused vocabulary value rather than adding a new behavior.

## GREEN

Changes made:

- narrowed `Visibility` to `"public" | "private"`;
- removed the old status from the garden frontmatter parser allow-list;
- simplified the privacy-gate test to cover public vs private;
- updated current docs and comments so new work does not continue the old vocabulary;
- confirmed no current source, tests, content, data, or build output contains the retired status.

Targeted proof:

```sh
npm test
```

Result:

```txt
Test Files  14 passed (14)
Tests       42 passed (42)
```

Static proof:

```sh
npm run build
```

Result:

```txt
18 page(s) built
```

## REFACTOR

This was already a refactor under green: removing unused vocabulary and keeping the one visibility
decision at `selectPublic`.

Historical dev-log and transcript files still mention the retired value because they record earlier
cycles as they happened. Current source-of-truth docs and live code no longer use it.

## Next

- Series read path, if we want series privacy to become physically checkable.
- Section D video detection/matching.
- Shared HTML escaping for work/log detail renderers.
