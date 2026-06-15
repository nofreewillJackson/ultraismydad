import { describe, expect, it } from "vitest";

import { createWorkItem } from "../src/domain/work-item";
import {
  createSeries,
  inferSeries,
  resolveSeriesId,
  resolveWorkItemSeriesId,
} from "../src/domain/series";

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

describe("resolveWorkItemSeriesId", () => {
  const all = [createSeries({ id: "aninews", aliases: ["news-anime-bot"] })];

  it("keeps an explicit series assignment, resolved through aliases", () => {
    const item = createWorkItem({
      id: "wi-1",
      title: "Anything",
      productLineId: "spoolcast",
      seriesId: "news-anime-bot",
    });

    expect(resolveWorkItemSeriesId(item, all)).toBe("aninews");
  });

  it("infers a series under the spoolcast line when none is explicit", () => {
    const item = createWorkItem({
      id: "wi-2",
      title: "Aninews weekly drop",
      productLineId: "spoolcast",
    });

    expect(resolveWorkItemSeriesId(item, all)).toBe("aninews");
  });

  it("discards an inferred series off the spoolcast line", () => {
    const item = createWorkItem({
      id: "wi-3",
      title: "Aninews weekly drop",
      productLineId: "research",
    });

    expect(resolveWorkItemSeriesId(item, all)).toBeUndefined();
  });
});
