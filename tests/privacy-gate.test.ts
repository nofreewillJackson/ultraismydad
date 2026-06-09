import { describe, expect, it } from "vitest";

import { createWorkItem } from "../src/domain/work-item";
import { selectPublicWorkItems } from "../src/domain/privacy-gate";

describe("privacy gate", () => {
  it("excludes non-public work items from the read model", () => {
    const publicWorkItem = createWorkItem({
      id: "work-public",
      title: "Published Build",
      productLineId: "line-001",
      visibility: "public",
    });
    const privateWorkItem = createWorkItem({
      id: "work-private",
      title: "Draft Build",
      productLineId: "line-001",
      visibility: "private",
    });
    const gatedWorkItem = createWorkItem({
      id: "work-gated",
      title: "Reserved Build",
      productLineId: "line-001",
      visibility: "gated",
    });

    const readModelItems = selectPublicWorkItems([
      publicWorkItem,
      privateWorkItem,
      gatedWorkItem,
    ]);

    expect(readModelItems).toEqual([publicWorkItem]);
  });
});
