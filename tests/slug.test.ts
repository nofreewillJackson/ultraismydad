import { describe, expect, it } from "vitest";

import { slugify } from "../src/domain/slug";

describe("slugify", () => {
  it("strips leading and trailing separators", () => {
    expect(slugify("  Hello World  ")).toBe("hello-world");
  });
});
