import { describe, expect, it } from "vitest";

import { createWorkItem } from "../src/domain/work-item";
import { InMemoryWorkItemStore } from "../src/store/in-memory-work-item-store";
import { InMemoryLogEntryStore } from "../src/store/in-memory-log-entry-store";
import { getWorkItemPaths } from "../src/app/work-item-pages";

describe("work item pages", () => {
  it("builds a page only for each public work item, keyed by slug, carrying its rendered html", async () => {
    const store = new InMemoryWorkItemStore();
    // id and slug deliberately differ: id is an opaque key, slug is derived
    // from the title. Asserting on slug proves the route keys on slug, not id.
    await store.save(
      createWorkItem({
        id: "wi-001",
        title: "Shipped Build",
        visibility: "public",
      }),
    );
    await store.save(
      createWorkItem({
        id: "wi-002",
        title: "Draft Build",
        visibility: "private",
      }),
    );

    const paths = await getWorkItemPaths({
      workItems: store,
      logEntries: new InMemoryLogEntryStore(),
    });

    expect(paths).toHaveLength(1);
    expect(paths[0].params.slug).toBe("shipped-build");
    expect(paths[0].props.html).toContain("<h1>Shipped Build</h1>");
  });
});
