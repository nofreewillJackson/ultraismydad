import { describe, expect, it } from "vitest";

import { createWorkItem } from "../src/domain/work-item";
import { createLogEntry } from "../src/domain/log-entry";
import { InMemoryWorkItemStore } from "../src/store/in-memory-work-item-store";
import { InMemoryLogEntryStore } from "../src/store/in-memory-log-entry-store";
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

    const snapshot = await exportReadModel({
      workItems: store,
      logEntries: new InMemoryLogEntryStore(),
    });

    expect(snapshot.workItems).toEqual([publicItem]);
  });

  it("excludes non-public log entries from the snapshot", async () => {
    const logEntries = new InMemoryLogEntryStore();
    const publicEntry = createLogEntry({
      id: "log-public",
      title: "Published Note",
      visibility: "public",
    });
    const privateEntry = createLogEntry({
      id: "log-private",
      title: "Draft Note",
      visibility: "private",
    });
    await logEntries.save(publicEntry);
    await logEntries.save(privateEntry);

    const snapshot = await exportReadModel({
      workItems: new InMemoryWorkItemStore(),
      logEntries,
    });

    expect(snapshot.logEntries).toEqual([publicEntry]);
  });
});
