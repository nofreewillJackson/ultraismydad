# 2026-06-15 17:21:56 - Cycle 40 follow-up: finish the garden port

The previous pass landed the garden read path but left the user looking at skeleton pages. The user
clarified that "whole port" meant the pre-cleanroom garden experience, not just the core data path.
This follow-up ports the remaining self-contained garden surface.

This is still the same author-approved method deviation as the prior garden log: no new tests, no
fake RED/GREEN narrative. The proof is the existing suite plus `astro build` and direct checks of the
static output.

## What changed

Ported/re-seated from legacy:
- `BaseLayout.astro`, stripped of legacy Firebase analytics.
- `Header.astro` and `ActivityStrip.astro`.
- `GardenGraph.astro`, with its import moved to cleanroom `src/domain/garden-analytics.ts`.
- `src/styles/global.css` and `public/favicon.svg`.
- `src/lib/garden/analytics.ts` → `src/domain/garden-analytics.ts`.
- Legacy transclusion resolver → `src/render/garden-embeds.ts`.
- A tiny `fmtDateFull` helper → `src/render/date.ts`.

The garden pages now use the legacy page structure:
- `/garden` renders the topbar, intro, full interactive graph, tag filter bar, and styled note cards.
- `/garden/[slug]` renders the topbar, styled markdown, backlinks, local graph, KaTeX CSS, JSON-LD,
  collapsible callouts, and mermaid re-theme behavior.

The app layer now builds the full public garden read model:
- `exportReadModel` gates notes first.
- `buildNoteIndex` and wikilink resolution see only public notes.
- markdown is rendered;
- transclusions are resolved from the public rendered-note map;
- backlinks, tag index, and graph analytics are derived;
- notes are sorted by recency.

## Verification

Existing suite:

```text
Test Files  14 passed (14)
Tests  42 passed (42)
```

Build:

```text
18 page(s) built
```

Static output checks:
- `/garden/index.html` contains `topbar`, `data-garden-graph`, `gg-toolbar`, tag filter controls, and
  styled `g-card` note cards.
- `/garden/markdown-feature-tour/index.html` contains resolved `<figure class="gm-embed gm-embed-note">`
  transclusions for a whole note and a heading section.
- detail pages contain `gm-localgraph` and the graph JSON payload.
- graph JSON contains communities, tag edges, latent-link suggestions, and a hub marker.
- `/garden/unlinked-leaf/index.html` renders the no-backlinks empty state and gives the graph an
  orphan note to mark.
- theme toggling code and mermaid re-render observer are present.
- `dist/garden/private-garden-seed/` and `dist/log/day-40-private-log-entry/` are absent.
- private note body text and Obsidian comments are absent from `dist/`.

## Inventory

The remaining Section L garden boxes are now checked: transclusion, tag filter UI, all-note graph,
local graph, communities, hub/orphan marking support, latent links, co-tag lens, and theme re-theming.

## Next

No garden-specific "except" remains from the legacy garden slot. The next work should move back to
the broader roadmap: series read path, Section D video matching, or the parked shared escaping pass for
work/log renderers.
