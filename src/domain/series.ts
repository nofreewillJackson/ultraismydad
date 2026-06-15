export type CreateSeriesInput = {
  id: string;
  name?: string;
};

export type Series = {
  id: string;
  name: string;
};

export function createSeries(input: CreateSeriesInput): Series {
  if (!input.id) {
    throw new Error("series requires an id");
  }
  return { ...input, name: input.name ?? "" };
}
