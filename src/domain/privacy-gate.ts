import type { Visibility } from "./visibility";

// The one visibility decision in the whole system. Any entity that can be
// published carries a `visibility`; this is the single place that decides what
// reaches public output. Default-deny: only `=== "public"` survives. Never add a
// second function that re-decides this (prime directive).
export function selectPublic<T extends { visibility: Visibility }>(items: T[]): T[] {
  return items.filter((item) => item.visibility === "public");
}
