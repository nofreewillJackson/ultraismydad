import { describe, expect, it } from "vitest";

import { createWorkItem } from "../src/domain/work-item";

describe("work item", () => {
  it("defaults visibility to private when omitted", () => {
    const workItem = createWorkItem({
      id: "work-001",
      title: "First Build",
      productLineId: "line-001",
    });

    expect(workItem.visibility).toBe("private");
  });

  it("uses the catch-all product line when product line is omitted", () => {
    const workItem = createWorkItem({
      id: "work-002",
      title: "Unsorted Build",
    });

    expect(workItem.productLineId).toBe("catch-all");
  });

  it("titles an untitled work item 'untitled project'", () => {
    const workItem = createWorkItem({
      id: "work-003",
      title: "",
    });

    expect(workItem.title).toBe("untitled project");
  });
});
