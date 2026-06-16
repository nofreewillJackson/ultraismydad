// The one visibility vocabulary, shared by every entity that can be published.
// The rule is uniform default-deny (see privacy-gate): an entity reaches public
// output only when visibility === "public"; "private" or missing values are
// withheld. This overrides legacy's per-collection inconsistency, where
// product lines/series defaulted to public (DOMAIN_PRIMER §4.3, AGENTS §4).
export type Visibility = "public" | "private";

// When an author sets nothing, hide it. Privacy is the default; publishing is the
// deliberate act.
export const DEFAULT_VISIBILITY: Visibility = "private";
