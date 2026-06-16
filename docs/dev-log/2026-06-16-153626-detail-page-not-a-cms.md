# Detail Page Is Curation, Not a CMS (spec correction)

## Behavior

This is a **docs-only spec correction**, not a code cycle. The trigger: a premise review asked
whether the legacy "project detail page as a mini-CMS" model was good UX/domain intent or just an
accident we were about to port by inheritance.

The corrected rule the docs must now encode:

- **Work-item data is canonical for curation *metadata only*** (title, summary, shipped date,
  status, visibility, product line, series, technology refs, and repo/demo/video/writeup links).
- **Technical documentation is canonical in the repo README** (or a linked writeup). The archive
  references it; it may *project* it at build time (opt-in, public repos only), but never stores a
  doc body and never fetches repo data at request time.
- **Every delivery surface — detail page, stack map, list, feeds — is a derived read model over the
  same facts. None is canonical for another.** In particular, `/project/[slug]` is never the source
  of truth for the stack map.
- The legacy runtime **"files" tab** (a client-side GitHub repo browser) is **not ported**: it is a
  read-path external fetch, exactly what the bake forbids.

## RED

No test. This cycle changes planning docs, not behavior. The first pass got the *framing* wrong by
reading the docs' description of the legacy app instead of the code; the correction was to re-derive
from the canon:

- **Legacy canon** (`~/dev/projects/artluai-pre-cleanroom/src/lib/data.ts`): the `Project` type is a
  30+ field kitchen sink (`longDesc`, `stack`, `stackRefs`, `screenshots`, `files: ProjectFile[]`
  with a `"gated"` locked state, `repo`, `artifactHtml`, …). The page chain
  `pages/project/[slug].astro → ProjectDetail.astro → FileBrowser.astro` renders a markdown body, a
  screenshots grid, pasted files, and a runtime GitHub file browser. The "mini-CMS" reading of
  *legacy* is accurate.
- **Rebuild canon** (`src/`): the built `WorkItem` is a **six-field atom**
  (`id, title, slug, productLineId, seriesId?, visibility`); `renderWorkItemDetail` is literally
  `` return `<h1>${workItem.title}</h1>` ``; and there is **no `list`, `map`, home/index, or `video`
  surface** — the only graph code is the garden's `GardenGraph`.

So the CMS exists only in legacy + in the docs that *describe* legacy. The rebuild has not grown it.
That makes this a **forward fence** (stop the next implementer re-importing the CMS when the detail
page and stack map get built), not a refactor of anything built.

## GREEN

Doc edits (no source/tests touched):

- `BEHAVIOR_INVENTORY.md` — §H reframed to curated-metadata + links + optional demo; the GitHub
  "files" tab behavior removed with a do-not-re-add note; §N file attachments demoted to
  deferred/editorial + a private-repo/no-runtime-fetch guard; new **§G stack-map browsing-vs-focus**
  block (default + focused states, derived purely from stored relationships, keyboard +
  reduced-motion).
- `CLEANROOM_SPEC.md` — §1.3 correction callout (detail page = curation, not CMS; `long_desc` and
  `FILE_ATTACHMENT` flagged as the second-README accident; surfaces derived, none canonical for
  another); §3.3 new principle #7; §3.1 new anti-pattern #13 (runtime repo file-browser).
- `ROADMAP.md` — Phase 4 rewritten (drops files-tab / three-state file gating; adds the focus-layout
  sub-bullet, tied to retiring §D title-overlap inference in favor of stored IDs); §6 records two
  resolved decisions + the open "one map canvas or two?" question.
- `DOMAIN_PRIMER.md` — `longDesc`, `repo→files tab`, and §4.4 annotated with rebuild pointers (facts
  kept intact, since it's an extraction artifact).
- `AGENTS.md` — §4 records the decision where agents look first; §7/§8 updated.

Proof is review + the existing gate (no behavior changed):

```sh
npm test
```

```txt
Test Files  14 passed (14)
Tests       42 passed (42)
```

## REFACTOR

Nothing to refactor — docs only. The new behaviors (stack-map focus layout) are written as a
testable *promotion/emphasis function* (focused node + relationship graph → ordered, emphasis-tagged
node set) so that when Phase 4 builds them they fit "test the logic, not the pixels," and so the
focus layout reads stored relationships rather than inferring edges.

The method lesson worth keeping: **the codebase is the canon.** Written artifacts (these docs, any
README) go stale; verify a premise against `data.ts` (legacy behavior) and `src/` (what's actually
built) before correcting a spec — which, fittingly, is the same source-of-truth discipline this very
correction is about.

## Next

- Series read path (makes series privacy physically checkable), or Section D video detection/matching
  (the genuinely fiddly title-token overlap area — and a prerequisite for the stack-map focus layout's
  explicit video↔item edges).
- When the detail page is built: lean atom + links + optional demo; README projection is a later,
  opt-in, build-time concern, not on the critical path.
- Open product call: one relationship canvas or two (home graph vs `/map`).
