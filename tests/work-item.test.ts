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

  it("derives a slug from the title when no slug is provided", () => {
    const workItem = createWorkItem({
      id: "work-004",
      title: "Hello World",
    });

    expect(workItem.slug).toBe("hello-world");
  });

  it("preserves an explicitly provided slug", () => {
    const workItem = createWorkItem({
      id: "work-005",
      title: "Hello World",
      slug: "pinned-url-key",
    });

    expect(workItem.slug).toBe("pinned-url-key");
  });

  it("rejects a work item with no id", () => {
    expect(() => createWorkItem({ id: "", title: "Anything" })).toThrow(/id/i);
  });
});
