import { describe, expect, it } from "vitest";

import { createWorkItem } from "../src/domain/work-item";
import { renderWorkItemDetail } from "../src/render/work-item-detail";

describe("render work item detail", () => {
  it("renders the work item title in a heading", () => {
    const workItem = createWorkItem({
      id: "shipped-build",
      title: "Shipped Build",
      visibility: "public",
    });

    const html = renderWorkItemDetail(workItem);

    expect(html).toContain("<h1>Shipped Build</h1>");
  });
});
