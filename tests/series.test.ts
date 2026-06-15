import { describe, expect, it } from "vitest";

import { createSeries } from "../src/domain/series";

describe("series", () => {
  it("rejects a series with no id", () => {
    expect(() => createSeries({ id: "" })).toThrow(/id/i);
  });

  it("title-cases a name from the id when no name is given", () => {
    const series = createSeries({ id: "spoolcast-dev-log" });

    expect(series.name).toBe("Spoolcast Dev Log");
  });
});
