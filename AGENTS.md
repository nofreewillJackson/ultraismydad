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

## 7. Current state  (last updated: 2026-06-13, after Cycle 13)

**Tests: 14 passing (8 files). Suite is green. Working tree clean.**

The **first vertical slice is complete (5/5)** (ROADMAP Phase 2): a persisted JSON snapshot →
`list()` → export (privacy gate) → render → real Astro page. Proven by a real `astro build`: the
public item produces `dist/project/<id>/index.html`; the private item — *which is physically present
in the source file `data/work-items.json`* — produces no file at all. Privacy is now a physical fact
flowing from a real persisted source, end to end with nothing faked.

Cycles completed:
- 1–3 — work-item defaults (visibility→private, line→catch-all), privacy gate. (first dev-log)
- 4 — untitled work item defaults to "untitled project".
- 5 — `InMemoryWorkItemStore` (async port shape).
- 6 — `exportReadModel` + `WorkItemStore` port (the privacy seam; `{ workItems }` snapshot).
- 7 — `renderWorkItemDetail` (pure item→HTML; **HTML-escaping deliberately deferred** to a future
  cycle).
- 8 — `getWorkItemPaths` + `src/pages/project/[id].astro` + Astro 6 setup; proven by real build.
- 9 — `FilesystemWorkItemStore` (real temp-dir tests: missing-file→empty, then save/list round-trip
  across fresh instances); wired the page to `data/work-items.json`; deleted the `sample-data.ts`
  scaffold. Slice is real top-to-bottom.
- 10–13 — **Section A slugs** (broadening the domain). `slugify` built by triangulation across its
  own cycles (lowercase+hyphenate → trim ends → cap 80); `createWorkItem` derives a slug from the
  (defaulted) title and preserves an explicit one. Slug is **identity** (pinned URL key), stored on
  the item, not recomputed at render.

Source layout:
- `src/domain/` — pure rules (`work-item.ts`, `privacy-gate.ts`, `slug.ts`).
- `src/store/` — `work-item-store.ts` (port), `in-memory-work-item-store.ts` (adapter, used in
  tests), `filesystem-work-item-store.ts` (adapter, the build's real data source).
- `src/app/` — `export-read-model.ts`, `work-item-pages.ts`.
- `src/render/` — `work-item-detail.ts`.
- `src/pages/project/[id].astro` — thin framework glue (constructs the FS store *inside*
  `getStaticPaths`; Astro isolates that scope, so a module-level const is invisible to it).
- `data/work-items.json` — the single snapshot source for this environment (contains all items,
  including private; the export gate is what omits private ones).

**Known shortcuts to unwind (do not mistake for finished work):**
- Routing is by **`id`, not `slug`** — work-item slug *generation* now exists (Cycles 10–13), but
  the Astro route still keys on `id`. Switching to `/project/<slug>` also needs the store's read
  path to normalize loaded JSON (those rows have no `slug` yet).
- `renderWorkItemDetail` does **no HTML-escaping** yet (deferred XSS trust-boundary cycle).
- `FilesystemWorkItemStore.list()` returns `[]` on a *missing* file by design (archive starts
  empty; safe direction). A build-integrity gate for the "unexpectedly zero pages" case is a later
  phase, not the adapter's job.

---

## 8. Next step

Work-item slugs (Section A, top) are done. **Continue Section A** with the **log-entry** behaviors:
log-entry slug from `day-{day}-{title}` when none provided, untitled log entry → "untitled entry",
and log-slug de-duplication (later collisions get a `-{first 6 chars of id}` suffix). Then series
name title-casing + alias resolution. Drive these as normal RED→GREEN→REFACTOR cycles.

Then, to make slugs *visible*: route `/project/<slug>` instead of `id`, which first needs the store
read path to normalize loaded JSON (apply `createWorkItem`-style defaults so loaded rows get slugs).

Other parked behaviors to pick up when natural: HTML-escaping in `renderWorkItemDetail` (XSS), and a
build-integrity gate (warn/fail on unexpectedly-zero pages). Then ROADMAP Phases 3→7.
