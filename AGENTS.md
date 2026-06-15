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

## 7. Current state  (last updated: 2026-06-14, after Cycle 31)

**Tests: 31 passing (10 files). Suite is green. Working tree clean. Sections A and C complete.**

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

Source layout:
- `src/domain/` — pure rules (`work-item.ts`, `log-entry.ts`, `series.ts`, `privacy-gate.ts`,
  `slug.ts`).
  `log-entry.ts` exports `createLogEntry` (per-entry factory: id guard, title default, slug) and
  `dedupeLogSlugs` (collection-level collision resolution). `series.ts` exports `createSeries`
  (id guard, name-from-id default, aliases→[]), `seriesNameFromId`, `resolveSeriesId`
  (alias→canonical, sourced from records), `inferSeries` (keyword table), and
  `resolveWorkItemSeriesId` (read-time effective series: explicit → fenced inference → none).
  `work-item.ts` now carries `seriesId?` (the stored explicit assignment). No log-entry/series
  store/page/route yet — the domain is being broadened ahead of wiring, the same way the slug rules
  were.
- `src/store/` — `work-item-store.ts` (port), `in-memory-work-item-store.ts` (adapter, used in
  tests), `filesystem-work-item-store.ts` (adapter, the build's real data source).
- `src/app/` — `export-read-model.ts`, `work-item-pages.ts`.
- `src/render/` — `work-item-detail.ts`.
- `src/pages/project/[slug].astro` — thin framework glue, routes by slug (constructs the FS store
  *inside* `getStaticPaths`; Astro isolates that scope, so a module-level const is invisible to it).
- `data/work-items.json` — the single snapshot source for this environment (contains all items,
  including private; ids are opaque, the URL is the derived slug; the export gate omits private ones).

**Known shortcuts to unwind (do not mistake for finished work):**
- `renderWorkItemDetail` does **no HTML-escaping** yet (deferred XSS trust-boundary cycle).
- **Read boundary** now: missing file → `[]`; non-array JSON → clear error (16); rows normalized
  through the domain (14), which rejects an id-less row (15). Remaining nicety (not a hole):
  malformed JSON still propagates as a stock `SyntaxError` — wrap it with the path only if a real
  need shows up.
- `FilesystemWorkItemStore.list()` returns `[]` on a *missing* file by design (archive starts
  empty; safe direction). A build-integrity gate for the "unexpectedly zero pages" case is a later
  phase, not the adapter's job.

---

## 8. Next step

**Sections A (identity & naming) and C (series inference) are COMPLETE.** The domain now has three
entities (work item, log entry, series) plus the series resolver. Good next moves, roughly in order of
value:

1. **Privacy-gate breadth** (closest to the prime directive). The default-deny rule currently lives
   only for work items. Extend it to the new entities: hide a private log entry / series / line at the
   export seam — *the one seam*, never a second visibility check. (Inventory §L lines 175-176.) This
   keeps the privacy invariant ahead of the data it must protect.
2. **A read path that uses what we built.** Nothing yet calls `resolveWorkItemSeriesId`,
   `dedupeLogSlugs`, or `inferSeries` against real data. Wiring one (e.g. a log read path, or
   surfacing a work item's series on its page) turns broadened domain into a working slice and would
   catch any glass invariants.
3. Then **Section D (video detection / matching)** — this is the genuinely fiddly area (title-token
   overlap thresholds, fuzzy duplicate matching). Budget for it accordingly.

Drive rejection-first as usual.

(Parked, pick up when natural: wire `dedupeLogSlugs`/`resolveSeriesId` into real read paths once
log/series stores exist (mirror the FS store's `rows.map(createWorkItem)` normalization); HTML-escaping
in `renderWorkItemDetail`; wrap malformed-JSON parse errors with the snapshot path; build-integrity
gate for "unexpectedly zero pages". Then Phases 3→7.)

Other parked behaviors to pick up when natural: HTML-escaping in `renderWorkItemDetail` (XSS), and a
build-integrity gate (warn/fail on unexpectedly-zero pages). Then ROADMAP Phases 3→7.
