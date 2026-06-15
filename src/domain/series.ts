import { DEFAULT_VISIBILITY, type Visibility } from "./visibility";
import type { WorkItem } from "./work-item";

export type CreateSeriesInput = {
  id: string;
  name?: string;
  aliases?: string[];
  visibility?: Visibility;
};

export type Series = {
  id: string;
  name: string;
  aliases: string[];
  visibility: Visibility;
};

// Derives a human display name from a series id: separators become spaces and
// each word is title-cased ("spoolcast-dev-log" → "Spoolcast Dev Log"). A pure
// presentation function — the id is the stored identity, the name is derived.
export function seriesNameFromId(id: string): string {
  return id
    .replace(/[-_]+/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export function createSeries(input: CreateSeriesInput): Series {
  if (!input.id) {
    throw new Error("series requires an id");
  }
  return {
    ...input,
    name: input.name || seriesNameFromId(input.id),
    aliases: input.aliases ?? [],
    visibility: input.visibility ?? DEFAULT_VISIBILITY,
  };
}

// Resolves a series id reference to its canonical id using the aliases each
// series record declares. One source of truth: the records own their aliases,
// unlike legacy's separate hardcoded map. A non-alias value resolves to itself.
export function resolveSeriesId(value: string, series: Series[]): string {
  for (const record of series) {
    if (record.aliases.includes(value)) {
      return record.id;
    }
  }
  return value;
}

export type InferSeriesInput = {
  title?: string;
  stack?: string[];
};

// Best-effort series guess from free text (title + stack). A read-time
// convenience, never a stored relationship — and only honored under the
// spoolcast line (see resolveWorkItemSeriesId). Order matters: the specific
// matches win before the broad "spoolcast" catch-all.
export function inferSeries(input: InferSeriesInput): string | undefined {
  const hay = [input.title, ...(input.stack ?? [])].join(" ").toLowerCase();
  if (hay.includes("aninews") || hay.includes("news-anime") || hay.includes("faux7")) {
    return "aninews";
  }
  if (hay.includes("dev-log") || hay.includes("dev log")) {
    return "spoolcast-dev-log";
  }
  if (hay.includes("chat to video workflow") || hay.includes("session to video")) {
    return "videos";
  }
  if (hay.includes("spoolcast")) {
    return "spoolcast-features";
  }
  return undefined;
}

// Inference is fenced to this one line. Outside it, only an explicit
// assignment gives a work item a series. (Legacy data.ts:1024.)
export const SPOOLCAST_PRODUCT_LINE_ID = "spoolcast";

// Derives a work item's effective series id at read time (never stored). An
// explicit assignment wins (any line) and is resolved through aliases; otherwise
// a series is inferred from text, but only under the spoolcast line.
export function resolveWorkItemSeriesId(item: WorkItem, series: Series[]): string | undefined {
  if (item.seriesId) {
    return resolveSeriesId(item.seriesId, series);
  }
  if (item.productLineId !== SPOOLCAST_PRODUCT_LINE_ID) {
    return undefined;
  }
  const inferred = inferSeries({ title: item.title });
  return inferred ? resolveSeriesId(inferred, series) : undefined;
}
