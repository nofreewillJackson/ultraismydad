export type CreateSeriesInput = {
  id: string;
  name?: string;
};

export type Series = {
  id: string;
  name: string;
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
  return { ...input, name: input.name || seriesNameFromId(input.id) };
}
