import { describe, expect, it } from "vitest";

import { createWorkItem } from "../src/domain/work-item";
import { InMemoryWorkItemStore } from "../src/store/in-memory-work-item-store";
import { exportReadModel } from "../src/app/export-read-model";

describe("export read model", () => {
  it("excludes non-public work items from the snapshot", async () => {
    const store = new InMemoryWorkItemStore();
    const publicItem = createWorkItem({
      id: "shipped-build",
      title: "Shipped Build",
      visibility: "public",
    });
    const privateItem = createWorkItem({
      id: "draft-build",
      title: "Draft Build",
      visibility: "private",
    });
    await store.save(publicItem);
    await store.save(privateItem);

    const snapshot = await exportReadModel(store);

    expect(snapshot.workItems).toEqual([publicItem]);
  });
});
