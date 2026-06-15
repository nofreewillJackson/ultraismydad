import { describe, expect, it } from "vitest";

import { createLogEntry } from "../src/domain/log-entry";
import { InMemoryLogEntryStore } from "../src/store/in-memory-log-entry-store";

describe("in-memory log entry store", () => {
  it("returns a saved log entry when listing", async () => {
    const store = new InMemoryLogEntryStore();
    const logEntry = createLogEntry({
      id: "log-001",
      title: "First Note",
      day: 1,
      visibility: "public",
    });

    await store.save(logEntry);

    expect(await store.list()).toEqual([logEntry]);
  });
});
