# AGENTS.md — how to work on this project (read this first)

This is the portable, checked-in onboarding for any AI agent (any CLI, any machine). It exists so
work continues in the **same manner** regardless of which tool picks it up. If something here
conflicts with an agent's own memory or a knowledge base, **this file and the `docs/` artifacts
win** — they are the shared source of truth.

> Keep this file current. After each batch of work, update the **Current State** and **Next Step**
> sections (and add a dev-log entry). That is the anti-drift mechanism.

---

## 0. What this is

A clean-room **rebuild** of a personal "build-in-public" archive site: one author ships work items
(projects, videos, research, dated log entries) over time; the site catalogs them and serves them
as a fast, crawlable static website. We are rebuilding it cleanly, behavior by behavior, via TDD.

It is a **rebuild, not a port.** We re-derive the domain and delete the legacy app's accidents; we
do not lovingly re-implement them.

**The answer key** (the finished, messy original) lives at `~/dev/projects/artluai-pre-cleanroom`.
When unsure what a behavior *should* do, read its docs or run it (`npm run dev` there). It is the
source of truth for *what the system does*; our `docs/` are the source of truth for *what to keep
vs. discard*.

---

## 1. The prime directive

**Private data must never reach the public output.** Everything is `private` by default and only
becomes public by a deliberate, explicit act. When in doubt about a default, default to hidden.
This is enforced once, at the export seam (`src/app/export-read-model.ts`), and proven *physically*
by the static build (a non-public item produces no file at all). Never add a second place that
decides visibility.

---

## 2. Source-of-truth docs (read in this order)

1. `docs/REBUILD_FOR_HUMANS.md` — the plain-language overview (good orientation).
2. `docs/ROADMAP.md` — the TDD-phased plan with the reasoning shown. **Read §2.**
3. `docs/BEHAVIOR_INVENTORY.md` — the flat checklist; **each checkbox = one TDD cycle.**
4. `docs/DOMAIN_PRIMER.md` — the business rules, with `file:line` citations into the legacy code.
5. `docs/TECH_STACK.md` — physical targets, design tokens, dead code.
6. `docs/CLEANROOM_SPEC.md` — the architectural blueprint. **Useful but opinionated — see §3.**
7. `docs/dev-log/` — the running, replayable log of every cycle done so far. Read the latest few.

---

## 3. ⚠ CLEANROOM_SPEC.md is overzealous — treat its verdicts as claims to re-derive

The spec mixes extracted *facts* with rebuild *opinions* in the same authoritative voice ("accident
— do not port", "domain law"). Its `§0.5` "would it survive a different stack?" test **proves too
much** and has produced wrong verdicts. It now carries a Correction notice at the top. **Do not
treat any "accident — do not port" as a command; re-derive it** against `DOMAIN_PRIMER.md`,
`BEHAVIOR_INVENTORY.md`, and the real workflow. Two verdicts are already overruled — see §4.

This is the single most important habit on this project: **think, don't cargo-cult the spec.**

---

## 4. Key decisions already made (these override the spec and aren't obvious from code)

- **Keep the bake.** Static materialization stays (privacy becomes a physical fact; atomic
  rollback; build-time integrity gate). The spec's "the bake is an accident" is overruled. The real
  accidents are narrower: the *manual* trigger (make it event-driven later), the five-deep fallback
  cascade, the machine-specific backup path. (ROADMAP §2.)
- **Keep the catch-all product line.** Only *inference of the line from free text* is the accident.
  Every item resolves to exactly one line (explicit, or the catch-all default) and is **never
  guessed from text**. "Required FK at creation" was overzealous; default-to-catch-all fits the
  documented fast/messy authoring. (CLEANROOM_SPEC §1.3/§2.4 #7 corrected.)
- **One visibility rule: default-deny, uniform across all collections** (legacy was inconsistent).
- **Sort by recency** (newest ship date first), not a per-record manual `sortOrder`.
- **Detail page is a curation surface, not a CMS or a second README.** Work-item data is canonical
  for *metadata only* (title, summary, dates, status, visibility, line, series, tech refs, and
  repo/demo/video/writeup links). Technical documentation is canonical in the **repo README** (or a
  linked writeup); the archive references it and may *project* it at build time (opt-in, public
  repos only), never duplicates it, never fetches it at request time. The legacy runtime "files" tab
  is **not ported**. Every delivery surface (detail, stack map, list, feeds) is a **derived read
  model over shared work-item facts — none is canonical for another;** `/project/[slug]` is never the
  source of truth for the stack map. (CLEANROOM_SPEC §1.3 correction / §3.1 #13.)
- **Ignore** any `CLEANROOM_TDD_ONBOARDING_ROADMAP.md`-style stale roadmap; drive from the docs
  above + the TDD method in §5.

---

## 5. How we work (the method — embedded so it travels without a knowledge base)

**TDD, one behavior at a time. Macro-architecture is fixed; micro-design emerges.**

The loop, strictly:
1. **RED** — pick ONE behavior (from `BEHAVIOR_INVENTORY.md`). Write exactly one test. **Run it and
   show it fail.** Confirm it fails for the *right reason* (missing behavior — a missing module is
   acceptable; a typo/bad-import is not).
2. **GREEN** — write the *smallest* code that passes. No speculative structure, no adjacent
   behavior. Run targeted test, then the full suite. Show passing output.
3. **REFACTOR** — tidy under green (names, duplication, correct placement). Re-run full suite.

Hard rules: never write test + implementation in one step; never skip the failing run; never weaken
or `.skip` a test to go green; never hardcode to satisfy an assertion; never put business rules in
framework/adapter/glue code; trust-boundary (rejection) tests come *before* happy-path tests.

**Architecture (fixed):** Clean Architecture dependency direction — `domain → nothing`,
`use-cases → domain`, `adapters/UI → use-cases`. Build in **vertical slices** (prove the thinnest
path through the *whole* system, including the real framework boundary, before broadening a layer —
this avoids "glass invariants"). **Own infrastructure is tested for real** (ephemeral temp dir / db),
never mocked when it is the thing under test; only third-party services are faked.

**The cross-cutting rule:** *store relationships, derive presentation.* Relationships (line, series,
video↔item) are stored, explicit, never inferred. Numbers/labels (slugs, day counts, heatmap, sort)
are derived pure functions.

**The working rhythm with the user:** the agent **drives** each cycle (writes + runs the test, shows
real output) and **logs every iteration** to `docs/dev-log/`. The user is learning; surface the
*reasoning and heuristics*, don't just hand over conclusions. Do not make the user type code.

**Dev-log format:** one file per cycle, named `docs/dev-log/<YYYY-MM-DD-HHMMSS>-<slug>.md`, written
so a beginner can replay it: state the behavior, show the RED test + real failure output, the GREEN
diff + passing output, the REFACTOR, design notes/decisions, and the next candidate behaviors.
Match the style of existing entries.

**Commits:** one per cycle (code + test + dev-log together). Conventional-commit style
(`feat(domain): …`, `feat(store): …`). 

---

## 6. Commands

```sh
npm test            # the real gate — Vitest. MUST be green before committing.
npm run test:watch  # auto-rerun while iterating
npm run build       # astro build -> dist/ (the static site; framework-edge proof)
npm run dev         # run the rebuild locally

# the answer key (finished legacy app, read-only reference)
cd ~/dev/projects/artluai-pre-cleanroom && npm run dev
```

Note: `npx tsc --noEmit` currently reports `TS2835` extensionless-import warnings across all files
— a latent `tsconfig` (`moduleResolution: nodenext`) mismatch, **not** a code error. `npm test` is
the gate. Fixing the tsconfig (likely `moduleResolution: "bundler"`) is a separate, pending cleanup.

---

## 7. Current state  (last updated: 2026-06-16, after the detail-page/CMS spec correction)

**Tests: 42 passing (14 files). Suite is green. Build is green: 18 static pages. Sections A and C
complete; prime-directive privacy breadth done. Log-entry read-path terminus is now wired to Astro
and physically proven. Digital garden is ported, not TDD-derived: legacy visual shell, index/detail
pages, Obsidian markdown, wikilinks, backlinks, transclusion, tag filtering, graph analytics/canvas,
local graphs, and unified visibility gate are in place. The shared visibility vocabulary is now only
`"public" | "private"`; the old third value had no live behavior beyond being withheld like private,
so it was removed from source, parser allow-lists, current docs, tests, content/data, and build output.
A docs-only spec correction then reframed the project detail page: it is a curation surface (metadata +
links + optional demo), the repo README is canonical for technical docs, and every surface (detail,
stack map, list, feeds) is a derived read model — none canonical for another. The built `WorkItem` stays
a six-field atom, so the correction is a forward fence against re-importing the legacy CMS, not a refactor.**

The **first vertical slice is complete (5/5)** (ROADMAP Phase 2): a persisted JSON snapshot →
`list()` → export (privacy gate) → render → real Astro page. Proven by a real `astro build`: the
public item produces `dist/project/<slug>/index.html`; the private item — *which is physically
present in the source file `data/work-items.json`* — produces no file at all. Privacy is now a
physical fact flowing from a real persisted source, end to end with nothing faked.

Cycles completed:
- 1–3 — work-item defaults (visibility→private, line→catch-all), privacy gate. (first dev-log)
- 4 — untitled work item defaults to "untitled project".
- 5 — `InMemoryWorkItemStore` (async port shape).
- 6 — `exportReadModel` + `WorkItemStore` port (the privacy seam; `{ workItems }` snapshot).
- 7 — `renderWorkItemDetail` (pure item→HTML; **HTML-escaping deliberately deferred** to a future
  cycle).
- 8 — `getWorkItemPaths` + the project route page (`[id].astro`, *renamed `[slug].astro` in Cycle
  17*) + Astro 6 setup; proven by real build.
- 9 — `FilesystemWorkItemStore` (real temp-dir tests: missing-file→empty, then save/list round-trip
  across fresh instances); wired the page to `data/work-items.json`; deleted the `sample-data.ts`
  scaffold. Slice is real top-to-bottom.
- 10–13 — **Section A slugs** (broadening the domain). `slugify` built by triangulation across its
  own cycles (lowercase+hyphenate → trim ends → cap 80); `createWorkItem` derives a slug from the
  (defaulted) title and preserves an explicit one. Slug is **identity** (pinned URL key), stored on
  the item, not recomputed at render.
- 14 — **read-path normalization** (a fix). The FS store cast parsed JSON `as WorkItem[]` — a lie
  (rows have no slug → `slug: undefined` behind a `string` type; a glass invariant the suite couldn't
  see). `list()` now reconstitutes each row via `createWorkItem` (tolerant reader / strict writer;
  rules stay in the domain). Cast is now the honest `as CreateWorkItemInput[]`.
- 15–16 — **trust-boundary hardening** (rejection-first). 15: `createWorkItem` throws on missing/empty
  `id` (domain invariant — guard at the one front door; makes a corrupt row fail the build loudly =
  bake-as-integrity-gate). 16: FS store throws a clear `snapshot … must be a JSON array` on a
  non-array file (file-format concern → store), and the `try` was scoped to the read so `ENOENT`
  no longer spans parse/normalize.
- 17 — **route by slug** (retired the id-routing scaffold from Cycle 8). `getWorkItemPaths` now keys
  on `workItem.slug`; route file renamed `[id].astro` → `[slug].astro`. Proven by build: public item
  (opaque id `wi-001`) is served at `/project/shipped-build/` — its slug, not its id; private item
  still produces no page.
- 18–23 — **Section A log entries** (second domain entity, `src/domain/log-entry.ts`). 18:
  `createLogEntry` rejects an id-less entry (rejection-first; a new front door guards its boundary
  before happy-path, same reasoning as Cycle 15). 19: untitled entry → "untitled entry". 20:
  slug = `slugify("day-{day}-{title}")`, reusing the one shared `slugify` (no second algorithm). 21:
  a day-less entry coalesces day to `""` so the slug has no literal `"undefined"` (closed a glass
  invariant left deliberately by 20, triangulated under its own test). 22: an explicit slug is
  preserved (`createLogEntry` now mirrors `createWorkItem` for slug handling). 23: `dedupeLogSlugs` —
  a pure, order-dependent pass over the *collection* (first claimant keeps the base slug; later
  collisions get `-{first 6 of id, lowercased}`); keys on each entry's already-derived slug, dropping
  legacy's dead re-derivation branch.
- 24–26 — **Section A series** (third domain entity, `src/domain/series.ts`); **finishes Section A**.
  24: `createSeries` rejects an id-less series (rejection-first). 25: `seriesNameFromId` title-cases a
  name from the id when none is given (separators→spaces, title-case; legacy's `series-` prefix strip
  *not* ported — no real id uses it). 26: `resolveSeriesId(value, series)` folds an alias onto the
  canonical id — **derived from the `aliases` each record declares, not legacy's hardcoded
  `seriesAliases` map** (that map duplicated the records = the accident; deleted it). Also dropped
  legacy's circular self-canonicalization of a record's own id.
- 27–31 — **Section C series inference** (all in `src/domain/series.ts`); **finishes Section C**.
  27: `inferSeries({title, stack})` — an ordered keyword table → series id | undefined (a *derived*
  read-time guess, never stored). 28: `resolveWorkItemSeriesId(item, series)` — explicit `seriesId`
  wins, alias-resolved (added `seriesId?` to `WorkItem` as the stored relationship). 29: fall back to
  inference when none explicit (left *unfenced* on purpose). 30: fence inference to the spoolcast line
  (`SPOOLCAST_PRODUCT_LINE_ID`) — drove out the over-permissive 29 via a real RED; off-line items get
  a series only if explicit. 31: guard test locking "explicit wins on any line" (passed without new
  code — the explicit branch sits above the fence; no faked RED). Note: I had over-billed Section C as
  "hard" — the genuinely fiddly token-overlap/fuzzy-match logic is **Section D** (video matching), not
  this. Series inference is a keyword table + one fence.
- 32–34 — **prime-directive privacy breadth.** 32: a log entry is private by default; introduced one
  shared `src/domain/visibility.ts` (`Visibility` type + `DEFAULT_VISIBILITY = "private"`) and
  refactored `work-item.ts` onto it (deleted the duplicate `WorkItemVisibility`). 33: a series is
  private by default — **deliberately overrides legacy's default-public for series** (DOMAIN_PRIMER
  §4.3); one uniform default-deny rule can't leak by omission. 34: generalized the gate to
  `selectPublic<T extends { visibility }>` and **deleted `selectPublicWorkItems`** — there is now
  exactly one place in the codebase that decides visibility (`=== "public"`), per the prime directive.
  Build still emits only the public work item.
- 35–39 — **log-entry read-path vertical slice (built, not yet wired to Astro).** Mirrors the
  work-item slice (5-9) deliberately. 35: `LogEntryStore` port + `InMemoryLogEntryStore`. 36: extended
  `exportReadModel` to take a `{ workItems, logEntries }` **stores object** and return both collections
  filtered through the *same* `selectPublic` (the seam now assembles the whole public read model; page
  builders go through it, so `getWorkItemPaths` widened to take the stores object). 37:
  `renderLogEntryDetail` (pure, no escaping yet — same deferred debt as the work-item renderer). 38:
  `getLogEntryPaths` (only public entries become pages, keyed by derived slug). 39:
  `FilesystemLogEntryStore` (full adapter contract in one cycle — a port of the vetted work-item FS
  adapter, not a re-discovery).
- 40 / garden port — **author-approved method deviation.** The legacy garden was deliberately
  ported instead of re-derived via one-test RED/GREEN cycles. No new tests were added by author choice;
  proof is the existing suite plus a real `npm run build`. What landed:
  - Log-entry terminus: `src/pages/log/[slug].astro`, `data/log-entries.json`, and `/project` now uses
    `FilesystemLogEntryStore`. Build emits `/log/day-40-published-log-entry/` and omits
    `/log/day-40-private-log-entry/`.
  - Garden note domain/store/app/render route: `GardenNote` defaults to private; `FilesystemGardenNoteStore`
    reads `content/garden/*.md` through `createGardenNote`; `exportReadModel` now takes
    `{ workItems, logEntries, gardenNotes }` and gates all three with the one `selectPublic`.
  - Markdown renderer: legacy `garden/render.ts` and `garden/plugins.ts` were ported to
    `src/render/garden-markdown.ts` / `garden-plugins.ts`, with resolver injection from the app layer
    and shared `src/render/escape.ts`; legacy transclusion resolution was ported to
    `src/render/garden-embeds.ts`.
  - Visual shell: legacy `BaseLayout`, `Header`, `ActivityStrip`, `GardenGraph`, global CSS, favicon,
    graph analytics, tag filter UI, local graph, latent links, co-tag lens, and theme re-theming were
    ported/re-seated into cleanroom paths.
  - Content: copied the 14 legacy garden notes and stamped `visibility: "public"`; added one private
    fixture (`private-garden-seed.md`) and one public no-backlinks/orphan fixture (`unlinked-leaf.md`).
  - Build proof: 15 public garden detail pages + `/garden/` index are emitted; the private garden note
    produces no file; a public wikilink to the private note renders unresolved; private note body text
    is absent from `dist/`; backlinks, empty backlink state, local graphs, tag filtering, graph data,
    orphan/hub markers, and transcluded embeds are present.
- 41 — **retired the old third visibility value.** Deep scan showed no live branch that treated it
  differently from private: source accepted it only in the shared type and garden frontmatter parser,
  then the single `selectPublic` gate withheld it like every non-public value. The only documented
  distinct behavior belongs to legacy work-item files (visible-but-locked content), which this rebuild
  has not modeled; if rebuilt, it should be file-specific rather than a global entity visibility state.
  The shared `Visibility` type is now `"public" | "private"`, the garden parser only accepts those
  values, current docs no longer carry the old status, and scans confirmed no current source/content/
  data/build-output occurrence. Historical dev-log/transcript mentions were left as audit history.
- 42 / spec correction (docs only) — **detail page is curation, not a CMS.** Re-derived from the canon:
  legacy `data.ts` is a 30+ field CMS (`longDesc`, `files`, runtime GitHub "files" browser), but the
  built `WorkItem` is a six-field atom and `renderWorkItemDetail` is a `<h1>` stub, and no map/list/home
  surface exists yet — so the CMS lives only in legacy + the docs that describe it. Reframed
  BEHAVIOR_INVENTORY §H/§N, added the §G stack-map browsing-vs-focus behaviors; added CLEANROOM_SPEC §1.3
  correction + §3.3 #7 + §3.1 #13; rewrote ROADMAP Phase 4 / §6; annotated DOMAIN_PRIMER; recorded the
  decision in §4. No source/tests changed; suite still 42 green. The repo README is canonical for
  technical docs; surfaces are derived read models, none canonical for another; the legacy runtime
  "files" tab is dropped (read-path external fetch). See the dev-log entry of the same date.

Source layout:
- `src/domain/` — pure rules (`work-item.ts`, `log-entry.ts`, `garden-note.ts`, `series.ts`, `visibility.ts`,
  `privacy-gate.ts`, `slug.ts`).
  `visibility.ts` holds the one `Visibility` type (`"public" | "private"`) +
  `DEFAULT_VISIBILITY = "private"`; `privacy-gate.ts`
  is the single gate, `selectPublic<T extends { visibility }>` — the *only* place that decides
  visibility. Work items, log entries, series, and garden notes default to private and pass through
  this one gate.
  `log-entry.ts` exports `createLogEntry` (per-entry factory: id guard, title default, slug) and
  `dedupeLogSlugs` (collection-level collision resolution). `series.ts` exports `createSeries`
  (id guard, name-from-id default, aliases→[]), `seriesNameFromId`, `resolveSeriesId`
  (alias→canonical, sourced from records), `inferSeries` (keyword table), and
  `resolveWorkItemSeriesId` (read-time effective series: explicit → fenced inference → none).
  `work-item.ts` now carries `seriesId?` (the stored explicit assignment). `garden-note.ts` exports
  `createGardenNote`, `buildNoteIndex`, `resolveWikilink`, and `deriveBacklinks`.
- `src/store/` — `work-item-store.ts` / `log-entry-store.ts` / `garden-note-store.ts` (ports);
  `in-memory-*` adapters (used in tests); filesystem adapters for work items, log entries, and garden
  notes. Garden notes are read-only hand-authored files under `content/garden/`.
- `src/app/` — `export-read-model.ts` (the seam:
  `exportReadModel(stores: { workItems, logEntries, gardenNotes })` → public-only
  `{ workItems, logEntries, gardenNotes }`), `work-item-pages.ts`, `log-entry-pages.ts`,
  `garden-note-pages.ts` (each takes the stores object and views its slice). `garden-note-pages.ts`
  also builds the public-only garden graph/tag/backlink/transclusion read model.
- `src/render/` — `work-item-detail.ts`, `log-entry-detail.ts`; garden renderers live in
  `garden-markdown.ts`, `garden-plugins.ts`, `garden-embeds.ts`, `garden-index.ts`,
  `garden-note-detail.ts`, plus `escape.ts` and `date.ts`. Work/log detail renderers still do not
  escape HTML; garden code does escape its own surrounding text and plugin-generated HTML.
- `src/layouts/`, `src/components/`, `src/styles/`, `public/favicon.svg` — legacy garden visual shell
  port: `BaseLayout`, `Header`, `ActivityStrip`, `GardenGraph`, and global CSS.
- `src/pages/project/[slug].astro`, `src/pages/log/[slug].astro`, `src/pages/garden/index.astro`,
  `src/pages/garden/[slug].astro` — thin framework glue. Each constructs real filesystem stores
  inside the Astro boundary; the export seam decides visibility.
- `data/work-items.json` — the single snapshot source for this environment (contains all items,
  including private; ids are opaque, the URL is the derived slug; the export gate omits private ones).
- `data/log-entries.json` — one public + one private log fixture proving the log read path physically.
- `content/garden/*.md` — 14 legacy public notes, one private garden fixture, and one public
  empty-backlinks/orphan fixture.

**Known shortcuts to unwind (do not mistake for finished work):**
- **Garden was ported, not TDD-built.** The dev-log records the author-approved deviation. Do not
  backfill fake RED/GREEN claims.
- The garden visual shell is intentionally scoped to the garden pages. The rest of the cleanroom site
  still has only the rebuilt slices that exist so far.
- `renderWorkItemDetail` **and** `renderLogEntryDetail` do **no HTML-escaping** yet (deferred XSS
  trust-boundary cycle — should land as a shared escape in both renderers).
- **Read boundary** now: missing file → `[]`; non-array JSON → clear error (16); rows normalized
  through the domain (14), which rejects an id-less row (15). Remaining nicety (not a hole):
  malformed JSON still propagates as a stock `SyntaxError` — wrap it with the path only if a real
  need shows up.
- `FilesystemWorkItemStore.list()` returns `[]` on a *missing* file by design (archive starts
  empty; safe direction). A build-integrity gate for the "unexpectedly zero pages" case is a later
  phase, not the adapter's job.
- `dedupeLogSlugs` is still not called by a read path; fold it in when sorting/listing log entries
  arrives. `resolveSeriesId` / `resolveWorkItemSeriesId` likewise await a consumer.

---

## 8. Next step

The garden port is now the reference for how to re-seat a legacy self-contained subsystem without
violating the export privacy seam. Next high-value moves outside the garden remain a series read path
(makes the series privacy behavior physically checkable) or **Section D (video detection / matching)** —
the genuinely fiddly area (title-token overlap thresholds, fuzzy duplicate matching); budget
accordingly. Section D also unblocks the stack-map focus layout, which needs explicit video↔item
edges rather than inference.

When the project detail page is built, it is a **curation surface**: a lean `WorkItem` atom + links +
optional demo, with the repo README as the canonical home for technical docs (a later, opt-in,
build-time projection — never a runtime fetch). Detail page, stack map, list, and feeds are all derived
read models over the same facts; none is canonical for another. (AGENTS §4 / ROADMAP Phase 4 /
CLEANROOM_SPEC §1.3 correction.)

Drive rejection-first as usual.

(Parked, pick up when natural: shared HTML-escaping in work/log renderers; wrap malformed-JSON parse
errors with the snapshot path; build-integrity gate for "unexpectedly zero pages". Then Phases 3→7.)
