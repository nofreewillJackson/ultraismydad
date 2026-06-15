import { slugify } from "./slug";
import { DEFAULT_VISIBILITY, type Visibility } from "./visibility";

export const DEFAULT_LOG_ENTRY_TITLE = "untitled entry";

export type CreateLogEntryInput = {
  id: string;
  title: string;
  slug?: string;
  day?: number;
  visibility?: Visibility;
};

export type LogEntry = {
  id: string;
  title: string;
  slug: string;
  day?: number;
  visibility: Visibility;
};

export function createLogEntry(input: CreateLogEntryInput): LogEntry {
  if (!input.id) {
    throw new Error("log entry requires an id");
  }
  const title = input.title || DEFAULT_LOG_ENTRY_TITLE;
  return {
    ...input,
    title,
    slug: input.slug || slugify(`day-${input.day || ""}-${title}`),
    visibility: input.visibility ?? DEFAULT_VISIBILITY,
  };
}

// Resolves slug collisions across a set of log entries: the first entry to claim
// a slug keeps it; each later collision gets a `-{first 6 of id}` suffix. A pure,
// order-dependent function over the collection — entries already carry a derived
// slug, so unlike legacy we never re-derive a base here.
export function dedupeLogSlugs(entries: LogEntry[]): LogEntry[] {
  const seen = new Map<string, number>();
  return entries.map((entry) => {
    const count = seen.get(entry.slug) ?? 0;
    seen.set(entry.slug, count + 1);
    if (count === 0) {
      return entry;
    }
    return { ...entry, slug: `${entry.slug}-${entry.id.slice(0, 6).toLowerCase()}` };
  });
}
