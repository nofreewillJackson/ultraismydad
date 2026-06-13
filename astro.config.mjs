import { defineConfig } from "astro/config";

// Static output: the site is baked, never rendered per-request.
// (See ROADMAP.md §2 — we keep the bake on purpose.)
export default defineConfig({
  output: "static",
});
