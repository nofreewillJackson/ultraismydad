# 2026-06-14 22:05:00 - Cycle 36: The Export Seam Gates Log Entries

The prime-directive heart of the slice. The export seam now produces the **whole** public read model —
work items *and* log entries — each passed through the single `selectPublic` gate. This is what makes
"private by default" (Cycle 32) actually exclude private log entries from output.

## Cycle 36

### RED

```ts
const snapshot = await exportReadModel({ workItems: new InMemoryWorkItemStore(), logEntries });
expect(snapshot.logEntries).toEqual([publicEntry]);   // privateEntry excluded
```

```text
× excludes non-public log entries from the snapshot → store.list is not a function
× excludes non-public work items from the snapshot   → store.list is not a function
```

Both export tests now drive the new seam signature: `exportReadModel(stores)` takes a `{ workItems,
logEntries }` object, not a bare store. RED for the right reason.

### GREEN

```ts
export async function exportReadModel(stores: ExportStores): Promise<ReadModel> {
  const [workItems, logEntries] = await Promise.all([stores.workItems.list(), stores.logEntries.list()]);
  return { workItems: selectPublic(workItems), logEntries: selectPublic(logEntries) };
}
```

The same `selectPublic` gates both. Adding a collection later = a store + a gated field here, never a
second visibility check. That's the prime directive's "enforced once, at the export seam" made literal.

### The design decision (and its cost)

The seam now needs *both* stores to assemble the full model, so the page builders that go through it
do too. `getWorkItemPaths` widened from `(store)` to `(stores)`. The architectural story:

> There is one public read model. Every page is a *view* onto it. So every page-generation entrypoint
> assembles that model (through the one seam) and renders its slice.

Cost: the `/project` page must now supply a log-entry store even though it renders no log entries. The
honest, contained price for "one seam, one gate, build goes through the seam." For now `/project` and
the work-item-pages test pass an **empty `InMemoryLogEntryStore` scaffold**; Cycle 39 swaps in the real
filesystem log store + `data/log-entries.json` for both pages (mirroring how the work-item slice
scaffolded before its FS store in Cycle 8→9).

(Considered keeping `getWorkItemPaths` single-store and gating per-collection in the page builders —
rejected: it would move gating *out* of `export-read-model.ts`, weakening "enforced at the export
seam," even though `selectPublic` would still be the one decider.)

### REFACTOR

Updated the existing work-item export test, work-item-pages test, and `/project` page to the new
signature. Full suite green (36); `npm run build` still emits only the public work item.

## State after this cycle

- Tests: **36 passing (11 files)**. Suite green. Build green.
- Privacy is now decided at the seam for *both* collections. Remaining slice: render log entries,
  route them, back them with a real FS store, and let the build physically prove a private one
  produces no page.

## Next candidate behaviors

- [ ] `renderLogEntry` (pure log entry → HTML).
- [ ] `getLogEntryPaths` + `/log/[slug]` route.
- [ ] `FilesystemLogEntryStore` + `data/log-entries.json` + build proof (removes the scaffold).
