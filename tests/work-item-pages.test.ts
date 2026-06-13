import { describe, expect, it } from "vitest";

import { createWorkItem } from "../src/domain/work-item";
import { InMemoryWorkItemStore } from "../src/store/in-memory-work-item-store";
import { getWorkItemPaths } from "../src/app/work-item-pages";

describe("work item pages", () => {
  it("builds a page only for each public work item, carrying its rendered html", async () => {
    const store = new InMemoryWorkItemStore();
    await store.save(
      createWorkItem({
        id: "shipped-build",
        title: "Shipped Build",
        visibility: "public",
      }),
    );
    await store.save(
      createWorkItem({
        id: "draft-build",
        title: "Draft Build",
        visibility: "private",
      }),
    );

    const paths = await getWorkItemPaths(store);

    expect(paths).toHaveLength(1);
    expect(paths[0].params.id).toBe("shipped-build");
    expect(paths[0].props.html).toContain("<h1>Shipped Build</h1>");
  });
});
