import { describe, expect, it } from "vitest";

import { createWorkItem } from "../src/domain/work-item";
import { InMemoryWorkItemStore } from "../src/store/in-memory-work-item-store";

describe("in-memory work item store", () => {
  it("returns a saved work item when listing", async () => {
    const store = new InMemoryWorkItemStore();
    const workItem = createWorkItem({
      id: "work-001",
      title: "First Build",
      visibility: "public",
    });

    await store.save(workItem);

    expect(await store.list()).toEqual([workItem]);
  });
});
