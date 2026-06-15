# 2026-06-14 22:15:00 - Cycle 38: getLogEntryPaths (page-building use case)

Mirror of Cycle 8's `getWorkItemPaths`. Turns the gated log entries into page descriptors
(`{ params: { slug }, props: { html } }`) for the framework to materialize.

## Cycle 38

### RED

```ts
const paths = await getLogEntryPaths({ workItems: new InMemoryWorkItemStore(), logEntries });
expect(paths).toHaveLength(1);                              // private entry excluded
expect(paths[0].params.slug).toBe("day-3-shipped-note");   // keyed by derived slug, not id
expect(paths[0].props.html).toContain("<h1>Shipped Note</h1>");
```

```text
Failed to load url ../src/app/log-entry-pages … Does the file exist?
```

The test pins all three slice guarantees at once: only public entries become pages (privacy), the URL
key is the *derived* slug (`day-3-shipped-note`, not `log-001`), and the HTML comes from the renderer.

### GREEN

```ts
export async function getLogEntryPaths(stores: ExportStores): Promise<LogEntryPage[]> {
  const { logEntries } = await exportReadModel(stores);
  return logEntries.map((logEntry) => ({
    params: { slug: logEntry.slug },
    props: { html: renderLogEntryDetail(logEntry) },
  }));
}
```

Line-for-line analog of `getWorkItemPaths` — same shape, through the same seam.

```text
 Tests  38 passed (38)
```

### Why no `/log/[slug].astro` yet

The work-item slice created its route page in Cycle 8 backed by a throwaway `sample-data.ts` scaffold,
then swapped to the FS store in Cycle 9. I'm folding the log route into Cycle 39 instead — created
together with `FilesystemLogEntryStore` + `data/log-entries.json`, so it's wired to real data from
birth and there's no scaffold to delete. The framework edge for this slice gets proven at its terminus
(39), where the build physically shows a private log entry produces no page.

### REFACTOR

None.

## State after this cycle

- Tests: **38 passing (13 files)**. Suite green.
- The entire log read path exists except its real persistence + framework terminus.

## Next candidate behaviors

- [ ] `FilesystemLogEntryStore` (real temp-dir tests + boundary tests, mirror Cycle 9/16).
- [ ] `/log/[slug].astro` wired to it + `data/log-entries.json` (public + private) + build proof.
- [ ] swap the `/project` page's in-memory log scaffold for the FS log store.
