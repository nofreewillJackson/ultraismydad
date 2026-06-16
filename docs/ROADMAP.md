# ROADMAP.md — Building the tracker, with the reasoning shown

> A build plan for the clean-room rebuild, written so a junior can reproduce the
> *problem-solving*, not just the steps. Every phase states **what** to build, **why it
> is here and now** (the inference), and **the first behaviors** to test. Where this
> document overrules a sibling doc, it says so and explains why.
>
> Companions: `DOMAIN_PRIMER.md` (the rules), `TECH_STACK.md` (physical facts/dead code),
> `BEHAVIOR_INVENTORY.md` (the testable checklist), `CLEANROOM_SPEC.md` (the agnostic
> blueprint). The TDD method is `playbooks/TDD-playbook.md` in the knowledge base.

---

## 0. How to derive a roadmap (the method, not just the result)

A roadmap is **derived**, not invented. The transferable skill is the order you read in:

1. **Check the canonical entry point first** (`CLAUDE.md` → `AGENTS.md`). Here they are empty
   stubs — knowing that is information: the truth lives in `docs/`.
2. **Let the file tree tell you the shape.** Four large docs, a tiny `src/`. That mismatch
   *is* the story: a documentation-first rebuild that has barely started.
3. **Read the docs in dependency order, not alphabetical:** the *what* (DOMAIN_PRIMER), the
   *physical facts* (TECH_STACK), the *testable checklist* (BEHAVIOR_INVENTORY), then the
   synthesis (CLEANROOM_SPEC) **last** — it only makes sense once you've seen the raw rules
   it reacts to.
4. **Find the current frontier** in the dev-log. Three TDD cycles are done; the roadmap
   continues from there.
5. **Adopt the project's stated method** (the TDD playbook), not generic best practice.

> **Meta-lesson:** most "decisions" below are me applying a rule the docs already state. The
> skill is knowing *which* rule applies *where* — and noticing when a doc's conclusion does
> not follow from its own rule (see §2).

---

## 1. The lens: domain vs. accident

CLEANROOM_SPEC §0.5 gives one test: **would this survive if the author had picked a
different stack on day one?** Yes → domain, build it. No → accident, *delete* it (a rebuild
is not a port). This is the single most important habit: do not lovingly re-implement
machinery that only existed to work around the old stack.

| Survives the test → **build it** | Fails the test → **delete it** |
|---|---|
| The **privacy boundary** (default-deny, enforced once) | The **inference cascades** (line, series, video↔item title-matching) |
| **Explicit relationships** (line is set or defaults to catch-all — never *inferred* from text) | The **inference cascade** that guesses a line, **dual stack lists**, name `aliases`, third visibility state, `snapshotHtml` |
| **Path-free public contracts** (read snapshot, video bundle) | **Per-record patch maps** hardcoded in code (thumbnails, stack remaps, ref aliases) |
| **Derived presentation** (slugs, day math, heatmap, counts, sort, embeddability) | The **five-deep fallback cascade** + the **machine-specific absolute path** |
| The **media-ingestion ETL** as a content-prep concern | The **manual** publish trigger; the **unwired dirty-flag** |

The 100-day campaign is **presentation, not domain** — a configurable counter, never a fixed
limit or end date.

---

## 2. On the bake: a correction to CLEANROOM_SPEC §3.4

**CLEANROOM_SPEC §3.4 / §3.1 #7 are overzealous, and this roadmap overrules them on one
point.** The spec argues the entire materialization plane (snapshot exporter, privacy filter
as a build step, publish ledger) is an *accident* of static hosting, and that a cached server
would "dissolve" it. That conclusion does not survive scrutiny, and here is the reasoning —
because *how you spot an over-applied rule* is exactly the skill this document teaches.

**Why the argument fails:**

1. **The §0.5 test proves too much.** Almost any concrete mechanism fails "would it survive a
   different stack" — Firestore wouldn't, TypeScript wouldn't. The test separates *domain*
   from *implementation*. But bake-vs-server is not that axis; it is a choice between two
   **delivery tactics**. The spec even admits this in §3.3 #6 ("static bake, incremental
   regeneration, edge cache… is a stack choice; preserve the property, not the machine"),
   then contradicts itself by also calling the bake an accident-to-delete.

2. **For this domain, baking is the *stronger* tactic, not a workaround.** The domain's #1
   non-negotiable invariant is a hard privacy boundary. Run that invariant through each tactic:

   | Property the domain values | Bake + export-time filter | Cached server (incl. ISR) |
   |---|---|---|
   | Non-public data on the read path | **Physically absent** — no live store, nothing to leak | Present in the store; excluded only by *runtime* query logic |
   | Privacy enforcement | A **build-time physical fact** | A runtime promise — one missed filter leaks |
   | Bad/unresolved data | **Fails the build before anyone sees it** (`build:strict`) | Renders live to a real visitor |
   | Releases | **Atomic, immutable, rollback-able** | "Eventually fresh" cache state |
   | Runtime surface | **None** (no server, no DB creds on read) | A server + connection pool + runtime secrets |

3. **The steelman, and why it loses here.** ISR's pitch is "automatic freshness, no
   exporter." But ISR still runs render code against the live store on revalidation — the
   read path *does* touch the write store, just less often — and runtime DB creds are back on
   the read path. It buys **freshness latency**, a metric a personal archive that publishes a
   few times a week barely cares about, at the cost of physical privacy + atomic rollback +
   pre-publish validation, which it cares about a lot. The spec optimized the metric the
   domain is least sensitive to.

**The synthesis (what this roadmap adopts):** the spec conflated the **delivery tactic**
(baking — sound, *keep it*) with the **accidental cruft around it** (manual trigger,
five-deep fallback cascade, machine-specific backup path, unwired dirty-flag — *real debt,
fix it*). The decision:

> **Keep static materialization. Keep the privacy filter at export — that is the strong
> guarantee, not a weak one. Delete the fallback cascade (one source per environment, DI'd),
> delete the machine path, and close the one genuine gap: make the publish trigger
> event-driven** (a change-journal entry triggers rebuild+deploy and resets the flag) instead
> of a human remembering to run it.

Everything else in CLEANROOM_SPEC Part 3 stands — inference removal, explicit FKs, one shared
domain module, ID-only joins, structured media source, single visibility rule.

---

## 3. The fixed architecture frame

From the TDD playbook: **macro-architecture is fixed; micro-design emerges.** You do not get
to TDD your way out of these:

- **Dependency direction:** `domain → nothing`; `use-cases → domain`; `adapters/UI →
  use-cases`. Business rules never live in routes, components, ORM models, or scripts.
- **Vertical slices:** prove the thinnest meaningful end-to-end path early, so you don't build
  *glass invariants* — rules that look right in memory and shatter against real persistence.
- **Owned infrastructure** (your store, your filesystem) is tested against **real ephemeral**
  infra; only third-party services are faked at the boundary.

What *emerges* one failing test at a time: every signature, interface, and file split. Do not
pre-plan the class diagram.

---

## 4. The phases

Ordered by **risk reduction then dependency**: do the thing that, if wrong, invalidates the
most other work. Each phase folds in *why now*.

### Phase 1 — Pure domain core *(in progress)*
**Goal:** entities + invariants as pure, in-memory functions. No I/O, no framework.
**Done:** `createWorkItem` (visibility→private, line→catch-all) and `selectPublicWorkItems`.
**Why first:** innermost layer; everything depends on it, it depends on nothing — cheapest to
get right, costliest to get wrong. The privacy gate being the first trust boundary is correct
(playbook §10: rejection tests before happy paths).

**Behaviors still to TDD** (from BEHAVIOR_INVENTORY §A, §N):
- **Unify visibility to default-deny across every collection** (CLEANROOM_SPEC §3.1 #8).
  Legacy used `=="public"` for items but `!="private"` for lines/series/tech. Pick one:
  explicit `public`/`private`, default-deny, everywhere.
- Slug derivation (lowercase → collapse non-alphanumerics → trim → cap 80) and log-slug
  collision de-dup. **One** slugifier (legacy had three that disagreed).
- Timeline math (`dayNum`, shipped, active-days); campaign counter only when a campaign config
  supplies a target — the "100" is presentation.
- Embeddability (host allow-list AND not-deny-list; inline demo HTML beats external link).
- Sort order; technology rollups (resolve refs → count → group by category).

> **⚠ Note on the catch-all (a worked example of *not* trusting a spec verdict).** CLEANROOM_SPEC
> §1.3 / §2.4 #7 call the catch-all an "accident — do not port" and demand a required FK. That
> verdict is **overzealous and is now overruled** (see CLEANROOM_SPEC's Correction notice). The
> spec collapsed two things: *inference into* the catch-all (keyword-guessing a line from text —
> a real accident, kill it) and *the catch-all as an explicit default bucket* for fast,
> deliberately-uncategorized drafts (legitimate, given DOMAIN_PRIMER §0's "entries created fast,
> fields left blank"). **Decision:** keep `createWorkItem`'s catch-all default; the real Phase-1
> work is to ensure the line is **never inferred from free text** at read time. Requiring the
> line at creation instead is a defensible *workflow* choice, but it's a judgment call, not a
> domain fact. The lesson for juniors: a spec's confident "accident — do not port" is a *claim
> to re-derive*, not a command — re-check it against the fact docs and the real workflow.

### Phase 2 — First vertical slice, through the bake
**Goal:** one behavior end to end — *persist a public work item → run it through the export
(privacy filter) → render its static detail page.*
**Why now, before broadening the domain:** the playbook warns against glass invariants. This
slice forces minimal versions of a **store port**, one **real ephemeral adapter** (temp
SQLite or temp-dir filesystem store), the **export use case**, and one **render path**. If the
architecture is wrong you learn it with one feature, not twenty. It also exercises the §2
decision: the privacy filter lives **at export**, the strong guarantee.

### Phase 3 — Materialization: the export gate + read snapshot (Contract A)
**Goal:** one use case that turns the operational dataset into the sanitized snapshot —
privacy filter applied **once**, timestamps normalized, arrays guaranteed, slugs deduped,
**non-public records absent entirely.** Plus the **integrity validator** that *fails the
build* when a public item's tech ref doesn't resolve or uses the forbidden `other`
placeholder.
**Why here:** this is the testable embodiment of the one domain invariant — a test asserting
no non-public record ever appears downstream (CLEANROOM_SPEC §3.3). Everything the delivery
side reads comes from this contract, so it precedes readers.
**Replace, don't port:** one source per environment, DI'd (production = snapshot, fail fast;
dev = a committed fixture). No fallback cascade, no machine-specific paths.

### Phase 4 — Delivery / rendering (the public read side)
**Goal:** the pre-rendered pages and feeds — home/graph, list, map, project, video, log,
research; `rss.xml`, `llms.txt`, `robots.txt`, sitemap, 404, legacy redirects.
**Why after Contract A:** readers are pure consumers of the snapshot. **Test the logic, not
the pixels** (playbook §12): log author-filter + empty states, the embeddability rendering
decision, and the **stack-map browsing-vs-focus layout** (the promotion/emphasis function is
unit-testable; animation is manual). The **detail page renders curated metadata + links +
optional demo — not a CMS:** the work item stays a lean atom, technical docs are the linked
repo README (build-time opt-in projection) or a linked writeup, and the legacy runtime
"files" tab and three-state file gating are **dropped** (CLEANROOM_SPEC §3.1 #13). Layout is
manual/snapshot verification. Maps to BEHAVIOR_INVENTORY §G–K nearly line for line.

- **Stack-map focus layout.** Browsing mode by default (updates newest→oldest). Focusing any
  node derives — purely from *stored* relationships — which connected nodes promote toward the
  focal area and which de-emphasize; clearing restores browsing. Store no layout data. Depends
  on **explicit** video↔item / line / series relationships, so it's a second reason to retire
  the §D title-overlap inference in favor of stored IDs.

### Phase 5 — Authoring surface + identity gate
**Goal:** the admin — third-party SSO → **allow-list authz** (authenticated ≠ authorized; a
non-operator is force-signed-out), CRUD over items/lines/series/taxonomy, **new items default
private**, explicit line/series/tech selection (the FK capture that *replaces* inference).
**Why this late:** trust-boundary heavy (do those first within the phase), depends on a solid
store + domain, and it is where inference dies by making relationships explicit at capture —
which only makes sense once the read side proves what the relationships are for.

### Phase 6 — Media ingestion ETL (Contract B)
**Goal:** turn production artifacts into clean, **path-free** video bundles + index.
**Why near-last and standalone:** conceptually separate, off the main publish critical path.
**Redesign, don't port:** legacy scrapes human-edited prose with regex (§3.1 #6); make the
authored source *structured* so ingestion is a parse, not a guess.

### Phase 7 — The digital garden
**Goal:** file-based notes, wikilink resolution, backlinks, bounded transclusion, graph
analytics (communities, hubs, orphans, latent links).
**Why it floats:** self-contained (file-based, own renderer, no Contract-A dependency). Can be
built any time after Phase 1, even in parallel. Placed last only as the most isolated,
lowest-risk work.

### Cross-cutting — close the publish gap
Per §2, the one genuine accident to fix in the materialization plane: make the trigger
**event-driven** — a change-journal entry kicks off rebuild + deploy and resets the dirty
flag on success. Keep the change journal as the event log; drop it being a vestigial,
human-polled audit trail.

> **The rule that resolves most "where does this go?" questions:** *store relationships,
> derive presentation.* Need a relationship (line, series, video↔item)? It's a stored FK.
> Need a number or label (day count, heatmap, slug, sort)? It's a derived pure function.

---

## 5. Choosing the next test inside a phase

The phases are the fixed frame; the tests emerge (playbook §7–8):

1. **Trust boundaries before happy paths** — if it touches privacy/auth/integrity, the
   *rejection* test comes first.
2. **Pick the simplest unproven behavior** off BEHAVIOR_INVENTORY — that file is a ready-made
   behavior inventory; one checkbox = one TDD cycle.
3. **RED → GREEN → REFACTOR, and actually run it.** Observe the failure for the *right reason*
   (missing behavior, not a typo), write the minimum to pass, refactor under green. Never
   write test + implementation in one step; never weaken a test to pass.
4. **New edge cases get added to the list, not implemented on the spot.**

---

## 6. Open decisions

Resolved in this document (with reasoning above), recorded so they aren't re-litigated:

- **Bake vs. server → keep the bake**, event-driven, privacy filter at export (§2).
- **Catch-all line → kept** as an explicit default bucket; what dies is *inference of the line
  from text*, not the bucket. Required-at-creation is a defensible workflow alternative but not
  a domain requirement (Phase 1 note).
- **Visibility → one default-deny rule** across all collections (Phase 1).
- **Sort order → derive by recency**; if manual control is ever truly wanted it is one *view*
  setting honored by every surface, never a per-record field half the renderers override
  (CLEANROOM_SPEC §1.3).
- **Detail page → curation surface, not a CMS.** Metadata canonical in work-item data; technical
  docs canonical in the repo README (build-time, opt-in projection) or a linked writeup; the legacy
  runtime "files" tab is dropped (read-path external fetch — CLEANROOM_SPEC §3.1 #13). The built
  `WorkItem` is already a lean atom; keep it that way.
- **Delivery surfaces are derived, never canonical for each other.** `/project/[slug]` is not the
  source of truth for the stack map; both read the same facts.

Still genuinely open (needs product input, not a coin-flip):

- **One map canvas or two?** Legacy ships both `/` (home graph) and `/map`. The focus-layout UX
  should land on ONE relationship canvas, or a deliberate split — decide before building, don't
  inherit two.
- **Log-entry visibility on the legacy live path** — the snapshot already requires explicit
  `"public"`; confirm that becomes the single rule (recommended) so the permissive
  `!="private"` path is dropped entirely.
