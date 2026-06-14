# APP_FLOW.md - how the rebuild currently loads and publishes content

This doc explains the current rebuild as a moving data flow, not as architecture jargon.
Read it when words like "snapshot", "bake", "slug", or "route" start sounding abstract.

The app is a static archive site. That means visitors do not ask a database for project data
when they open a page. Instead, the site is built ahead of time. The build reads source data,
filters it, renders HTML files, and puts those files in `dist/`.

## The shortest version

Today the current vertical slice works like this:

```txt
data/work-items.json
  -> FilesystemWorkItemStore.list()
  -> exportReadModel()
  -> privacy gate
  -> getWorkItemPaths()
  -> Astro getStaticPaths()
  -> dist/project/<id>/index.html
```

The JSON file is build input. It is not the final website.

The final website is the static output in `dist/`.

## What exists right now

The current rebuild has one real content source:

```txt
data/work-items.json
```

That file contains work items for this local environment. It can contain both public and
private records. That is intentional: the source data is allowed to know private things.
The public output is not.

Example shape:

```json
[
  {
    "id": "shipped-build",
    "title": "Shipped Build",
    "productLineId": "catch-all",
    "visibility": "public"
  },
  {
    "id": "draft-build",
    "title": "Draft Build",
    "productLineId": "catch-all",
    "visibility": "private"
  }
]
```

When `npm run build` runs, Astro asks the project route which pages exist. That starts here:

```ts
// src/pages/project/[id].astro
export async function getStaticPaths() {
  return getWorkItemPaths(new FilesystemWorkItemStore("data/work-items.json"));
}
```

The page file does not decide privacy. It only connects Astro to the tested app code.

## Step 1: the filesystem store reads JSON

`FilesystemWorkItemStore` is the adapter that knows how to read and write a JSON file.

```ts
// src/store/filesystem-work-item-store.ts
async list(): Promise<WorkItem[]> {
  return JSON.parse(await readFile(this.filePath, "utf8")) as WorkItem[];
}
```

The important part is the cast:

```ts
as WorkItem[]
```

That cast tells TypeScript, "trust me, this JSON is already valid work-item data."

It does not actually validate or repair the data at runtime. If the file is missing a field,
the loaded object is missing that field too.

This is why read-time normalization is a known upcoming need.

## Step 2: the export read model applies privacy

The store returns all work items it loaded. Then `exportReadModel()` applies the privacy gate:

```ts
// src/app/export-read-model.ts
export async function exportReadModel(store: WorkItemStore): Promise<ReadModel> {
  const all = await store.list();
  return { workItems: selectPublicWorkItems(all) };
}
```

The privacy gate keeps only explicitly public work items.

That is the prime directive in code: private source records may exist, but they must not cross
into the public build output.

So the private row can exist in `data/work-items.json`, while no corresponding private page
exists in `dist/`.

## Step 3: page paths are created

After privacy filtering, `getWorkItemPaths()` turns each public work item into an Astro page
definition:

```ts
// src/app/work-item-pages.ts
return workItems.map((workItem) => ({
  params: { id: workItem.id },
  props: { html: renderWorkItemDetail(workItem) },
}));
```

Right now the URL key is `id`.

So a public item with:

```json
{ "id": "shipped-build" }
```

becomes:

```txt
/project/shipped-build/
```

That page is physically written during the static build.

## Step 4: Astro writes static files

Astro takes the paths from `getStaticPaths()` and renders one HTML file per path.

The important thing is that the output is just files:

```txt
dist/project/shipped-build/index.html
```

When a visitor opens the site, they receive that already-built HTML file. The visitor does
not read `data/work-items.json`, does not call `FilesystemWorkItemStore`, and does not run
the privacy gate.

All of that happened earlier, at build time.

## What "the bake" means

"Bake" is this project's word for static materialization.

It means:

```txt
mutable/private-ish source data -> filtered public static output
```

The bake is kept on purpose because it makes privacy physical. If an item is not public, the
build does not create a public page for it. There is no runtime query that might accidentally
forget a privacy filter.

In the future, the source data might come from a real operational store or authoring system.
But the public site should still be built from a sanitized read model, not from live private
data during visitor requests.

## Where slugs fit

A slug is the human-readable URL key.

For example, this title:

```txt
My First Shipped Build!
```

might produce this slug:

```txt
my-first-shipped-build
```

The project recently added slug behavior to the domain:

```ts
// src/domain/work-item.ts
slug: input.slug || slugify(title)
```

That means a newly created work item gets a `slug`.

But existing rows in `data/work-items.json` do not currently have `slug`.

That creates an important difference:

```txt
new item made through createWorkItem()
  -> has slug

old item loaded from data/work-items.json
  -> may not have slug
```

Right now the app still routes by `id`, so this does not break the build:

```ts
params: { id: workItem.id }
```

But when the route changes from:

```txt
/project/<id>/
```

to:

```txt
/project/<slug>/
```

then every loaded public work item must have a real runtime `slug`.

## The read-normalization problem

The risk is not just "the sample JSON forgot a slug."

The real issue is:

```txt
raw persisted JSON is being trusted as if it already matches the current WorkItem domain type
```

That is fragile because the domain can evolve. Fields like `slug`, `productLineId`, `title`,
or `visibility` may have defaults in `createWorkItem()`, but rows loaded directly from JSON
do not receive those defaults unless the store applies them.

The durable fix is read-time normalization:

```txt
raw JSON row
  -> apply domain defaults and validation
  -> valid WorkItem
```

In practical terms, `FilesystemWorkItemStore.list()` should eventually parse raw rows and
convert each one through the same domain rules used when creating a work item.

That would let old-shaped persisted JSON keep working as the domain grows.

## Why this was not immediately added

The project is using strict TDD: one behavior per cycle.

The slug cycle proved:

```txt
createWorkItem derives a slug when none is provided
```

It did not prove:

```txt
FilesystemWorkItemStore normalizes old JSON rows on read
```

Those are related, but they are different behaviors. The second behavior deserves its own
RED -> GREEN -> REFACTOR cycle before slug routing depends on it.

A good upcoming cycle would be:

```txt
FilesystemWorkItemStore.list() derives a missing slug for an old-shaped JSON row
```

Then later cycles can decide what to do with missing titles, missing visibility, invalid
visibility, explicit stored slugs, malformed JSON, and unknown fields.

## The mental model to keep

Think in boundaries:

```txt
Domain creation boundary:
  createWorkItem(input) -> valid WorkItem

Persistence read boundary:
  JSON on disk -> FilesystemWorkItemStore.list() -> should also become valid WorkItem

Public export boundary:
  all WorkItems -> exportReadModel() -> only public read model

Static rendering boundary:
  public read model -> Astro build -> dist/ files
```

The slug issue lives at the persistence read boundary.

The privacy rule lives at the public export boundary.

The generated pages live at the static rendering boundary.

Keeping those boundaries separate is what makes the rebuild understandable.
