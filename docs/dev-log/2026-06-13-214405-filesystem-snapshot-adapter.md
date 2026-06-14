# 2026-06-13 21:44:05 - Cycle 9: Filesystem Snapshot Adapter (Slice Made Real)

This is the last step of the first vertical slice. Cycle 8 proved the path through the framework
edge with a **temporary in-memory scaffold** (`sample-data.ts`). This cycle replaces that scaffold
with a real `WorkItemStore` backed by a JSON file on disk, tested for real against a temp directory.
After this, the slice is real top-to-bottom: **a persisted file → built page**, with nothing faked.

## Why this finishes the slice

The walking skeleton was alive but eating fake food: data was hand-built in memory at build time.
A slice isn't "real" until the data it carries comes from where real data will live. The store is
**owned infrastructure** (we wrote it; it's not a third-party service), so the playbook says test it
**for real** — against an actual ephemeral temp directory, never mocked. A mocked filesystem proves
nothing about the filesystem.

## How I sliced it (and why into two micro-cycles)

A filesystem adapter has two halves — read (`list`) and write (`save`) — and `save` is
read-modify-write: load the snapshot, append, write it back. So `save` *depends on* `list`
tolerating a missing file the very first time it writes into a fresh environment. That dependency
decides the order. Playbook: one behavior per cycle, edge/trust cases first.

- **9a** — `list()` returns `[]` when the snapshot file does not exist.
- **9b** — `save()` persists to disk so a **fresh instance** reads it back.

Doing 9a first isn't bookkeeping — 9b literally cannot work until the missing-file path exists,
because the first `save` reads an absent file.

### A decision I'm owning: missing snapshot → empty, not throw

When the single source file is absent, `list()` returns `[]`. Reasoning:

- An archive genuinely **starts empty** — before the author ships anything, there are zero items.
  "No file yet" and "no items yet" are the same state.
- Empty is the **safe direction** under the prime directive. Returning nothing can never leak a
  private item; throwing-vs-empty is not a privacy question.
- This is *not* the legacy five-deep fallback cascade we deleted. There is still exactly **one**
  path. We do not go hunting elsewhere when it's missing — we just report "empty."
- Detecting a *misconfigured* path ("you expected pages and got zero") is a deploy/build-integrity
  concern for a later phase, not something to bury inside the storage adapter.

I only swallow `ENOENT`. A corrupt file or a permissions error is re-thrown — absence means empty,
but a *broken* source must stay loud rather than masquerade as "no items."

## Cycle 9a

### RED

Behavior (one sentence):

```text
A filesystem store pointed at a path with no file returns an empty list.
```

`tests/filesystem-work-item-store.test.ts` — `beforeEach` makes a fresh `mkdtemp` dir, `afterEach`
removes it. The test points a store at a non-existent file in that dir and expects `[]`.

```sh
npm test -- tests/filesystem-work-item-store.test.ts
```

```text
Error: Cannot find module '../src/store/filesystem-work-item-store'
 Test Files  1 failed (1)
      Tests  no tests
```

Good RED: the module doesn't exist.

### GREEN

`src/store/filesystem-work-item-store.ts` — `list()` only (no `save`, no `implements WorkItemStore`
yet; nothing in this test needs them — I refuse to write code a test isn't asking for):

```ts
async list(): Promise<WorkItem[]> {
  try {
    return JSON.parse(await readFile(this.filePath, "utf8")) as WorkItem[];
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return [];
    throw error;
  }
}
```

```text
 ✓ tests/filesystem-work-item-store.test.ts (1 test)
 Test Files  1 passed (1)
```

## Cycle 9b

### RED

Behavior (one sentence):

```text
A work item saved through one store instance is read back by a fresh instance on the same path.
```

The **fresh instance** is the entire point: a second `new FilesystemWorkItemStore(path)` can only
see the item if it truly hit disk. An in-memory field would silently fail this — which is exactly
the false-positive we're guarding against.

```text
TypeError: (intermediate value).save is not a function
 Tests  1 failed | 1 passed (2)
```

Good RED: `save` doesn't exist.

### GREEN

Added `save` (read-modify-write, leaning on 9a's missing-file tolerance for the first write) and
formalized the port with `implements WorkItemStore` — the round-trip is the test that finally
*forces* both into existence:

```ts
async save(workItem: WorkItem): Promise<void> {
  const workItems = await this.list();
  workItems.push(workItem);
  await mkdir(dirname(this.filePath), { recursive: true });
  await writeFile(this.filePath, JSON.stringify(workItems, null, 2), "utf8");
}
```

```text
 ✓ tests/filesystem-work-item-store.test.ts (2 tests)
 Tests  10 passed (10)        # full suite
```

## Wiring (glue — proven by the build, not a unit cycle)

Same treatment as the Astro setup in Cycle 8: mechanical wiring is verified by the build itself.

1. Created `data/work-items.json` — the **single source** for this environment. It deliberately
   contains *both* items, including the **private** one. This makes the privacy proof airtight: the
   private item is physically present in the source and must still produce no page.
2. Pointed `src/pages/project/[id].astro` at `new FilesystemWorkItemStore("data/work-items.json")`.
3. **Deleted `src/app/sample-data.ts`** — the scaffold is gone, no dangling references.

A gotcha worth recording: Astro extracts `getStaticPaths` into an isolated scope, so a module-level
`const store` in the frontmatter is **not visible** inside it (`store is not defined` at build).
Construct the store **inside** `getStaticPaths`.

### The real build (the proof)

```sh
npx astro build
#   ├─ /project/shipped-build/index.html
#   1 page(s) built

find dist/project -type f          -> dist/project/shipped-build/index.html
grep "<h1>" .../shipped-build/...   -> <h1>Shipped Build</h1>
grep -c draft-build data/work-items.json   -> 1   (private item IS in the source)
test ! -e dist/project/draft-build  -> NO PAGE (correct)
```

The private item lives in the source file and produces **no output file**. Privacy is a physical
fact of the build, now flowing from a real persisted snapshot.

## State after this cycle

- Tests: **10 passing (7 files)**. Full suite green.
- The first vertical slice is **complete (5/5)**: persisted JSON file → list → export (privacy gate)
  → render → built Astro page, with the private item proven absent from output.
- Scaffolding removed: `sample-data.ts` deleted. Remaining known shortcut: routing is by **`id`,
  not `slug`** (a later cycle), and `renderWorkItemDetail` still does **no HTML-escaping** (deferred
  trust-boundary cycle).

## Next candidate behaviors

- [ ] Section A of `BEHAVIOR_INVENTORY.md`: **slug generation** (then route `/project/<slug>`),
      "untitled entry" naming, slug formatting rules. (Now that the slice is real, broaden the
      domain.)
- [ ] HTML-escaping in `renderWorkItemDetail` (XSS trust boundary, deferred since Cycle 7).
- [ ] Build-integrity gate: warn/fail when the snapshot resolves to zero pages unexpectedly
      (the "misconfigured path" concern parked in this cycle's empty-vs-throw decision).
