import { describe, expect, it } from "vitest";

import { createSeries } from "../src/domain/series";

describe("series", () => {
  it("rejects a series with no id", () => {
    expect(() => createSeries({ id: "" })).toThrow(/id/i);
  });
});
