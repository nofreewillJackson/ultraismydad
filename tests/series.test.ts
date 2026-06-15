import { describe, expect, it } from "vitest";

import { createSeries, inferSeries, resolveSeriesId } from "../src/domain/series";

describe("series", () => {
  it("rejects a series with no id", () => {
    expect(() => createSeries({ id: "" })).toThrow(/id/i);
  });

  it("title-cases a name from the id when no name is given", () => {
    const series = createSeries({ id: "spoolcast-dev-log" });

    expect(series.name).toBe("Spoolcast Dev Log");
  });
});

describe("resolveSeriesId", () => {
  it("resolves a declared alias to its canonical series id", () => {
    const all = [
      createSeries({ id: "aninews", aliases: ["news-anime-bot", "faux7"] }),
      createSeries({ id: "videos", aliases: ["spoolcast-core"] }),
    ];

    expect(resolveSeriesId("news-anime-bot", all)).toBe("aninews");
  });
});

describe("inferSeries", () => {
  it("infers a series from keywords in the text, else undefined", () => {
    expect(inferSeries({ title: "Aninews Episode 12" })).toBe("aninews");
    expect(inferSeries({ title: "Weekly Dev Log" })).toBe("spoolcast-dev-log");
    expect(inferSeries({ title: "session to video pipeline" })).toBe("videos");
    expect(inferSeries({ title: "Spoolcast feature drop" })).toBe("spoolcast-features");
    expect(inferSeries({ title: "An unrelated side project" })).toBeUndefined();
  });
});
