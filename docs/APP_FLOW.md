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

## Step 1: the filesystem store reads JSON and turns it into real work items

`FilesystemWorkItemStore` is the adapter that knows how to read and write a JSON file.

```ts
// src/store/filesystem-work-item-store.ts
async list(): Promise<WorkItem[]> {
  const parsed = JSON.parse(await readFile(this.filePath, "utf8"));
  return (parsed as CreateWorkItemInput[]).map(createWorkItem);
}
```

The important part is that the store no longer says:

```ts
as WorkItem[]
```

That old cast told TypeScript, "trust me, this JSON is already valid work-item data."

That was false. A cast does not repair data at runtime. If the file was missing a field, the
loaded object was still missing that field.

The store now treats JSON rows as raw input and runs each row through `createWorkItem()`.
That means normal domain defaults apply when old or hand-authored rows are loaded.

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

## What got fixed, in normal words

The original problem was not "one JSON file forgot one field."

The real problem was this:

```txt
the app said "these loaded rows are valid WorkItems"
but it had not actually made them valid WorkItems
```

That matters because the public build depends on loaded rows. If the source file has old or
partial records, the build still needs to know what to do with them.

Before the fix:

```txt
data/work-items.json row with no slug
  -> FilesystemWorkItemStore.list()
  -> object still has slug: undefined
  -> TypeScript pretends slug is a string
```

After the fix:

```txt
data/work-items.json row with no slug
  -> FilesystemWorkItemStore.list()
  -> createWorkItem(row)
  -> object has slug: "loaded-item"
```

So this was a boundary fix. The filesystem boundary now converts loose JSON into proper
domain objects before the rest of the app uses them.

That is the same idea as checking your groceries at the door before you cook with them. The
kitchen can stay simple because the bad or incomplete stuff gets handled at the entrance.

## Why this matters in the grand picture

This fix matters because the app is moving toward URLs based on slugs:

```txt
/project/<slug>/
```

Right now pages still use ids:

```txt
/project/<id>/
```

So the missing-slug problem was not breaking the current public site yet. But it would have
broken the next obvious step: slug routing.

The fix also matters beyond slugs. It sets a rule for the whole rebuild:

```txt
raw storage data is not automatically trusted
```

That rule is worth keeping. The source data will keep changing shape as the rebuild grows.
The app should not silently pretend old rows are valid just because TypeScript was told to
believe it.

## Was this busywork?

No, this one was not busywork.

It did not add a shiny feature, but it protected the build path that every public page depends
on:

```txt
source JSON -> valid work items -> privacy gate -> public pages
```

If that first arrow lies, everything after it can look clean while being wrong.

That is why this mattered before `/project/<slug>` routing.

At the same time, this should not turn into endless "harden everything" work. Each hardening
step should earn its keep by protecting a real boundary:

- Missing `slug`: worth fixing because slug URLs are coming next.
- Missing `id`: worth rejecting because an item without identity cannot become a stable page.
- Top-level JSON not being an array: worth rejecting because the store cannot list items from
  a non-list.
- Hypothetical edge cases with no current consequence: write them down, but do not disappear
  into them.

The point is not to make the JSON reader fancy. The point is to make sure the build either
gets real work items or fails clearly before publishing.

## The mental model to keep

Think in boundaries:

```txt
Domain creation boundary:
  createWorkItem(input) -> valid WorkItem

Persistence read boundary:
  JSON on disk -> FilesystemWorkItemStore.list() -> valid WorkItem[]

Public export boundary:
  all WorkItems -> exportReadModel() -> only public read model

Static rendering boundary:
  public read model -> Astro build -> dist/ files
```

The slug fix lives at the persistence read boundary.

The privacy rule lives at the public export boundary.

The generated pages live at the static rendering boundary.

Keeping those boundaries separate is what makes the rebuild understandable.

## How to decide if a future fix matters

Ask these questions before letting the work expand:

1. Does this protect private data from reaching public output?
2. Does this prevent the static build from producing broken pages?
3. Does this make a future near-term behavior possible, like slug routes?
4. Does this replace a lie at a boundary with a real checked behavior?

If the answer is yes, it is probably worth a focused TDD cycle.

If the answer is "maybe someday," park it and keep building visible behavior.
