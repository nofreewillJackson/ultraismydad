import { describe, expect, it } from "vitest";

import { createLogEntry } from "../src/domain/log-entry";
import { InMemoryWorkItemStore } from "../src/store/in-memory-work-item-store";
import { InMemoryLogEntryStore } from "../src/store/in-memory-log-entry-store";
import { InMemoryGardenNoteStore } from "../src/store/in-memory-garden-note-store";
import { getLogEntryPaths } from "../src/app/log-entry-pages";

describe("log entry pages", () => {
  it("builds a page only for each public log entry, keyed by slug, carrying its rendered html", async () => {
    const logEntries = new InMemoryLogEntryStore();
    // id and slug deliberately differ: id is an opaque key, slug is derived from
    // day + title. Asserting on slug proves the route keys on the derived slug.
    await logEntries.save(
      createLogEntry({ id: "log-001", title: "Shipped Note", day: 3, visibility: "public" }),
    );
    await logEntries.save(
      createLogEntry({ id: "log-002", title: "Draft Note", day: 4, visibility: "private" }),
    );

    const paths = await getLogEntryPaths({
      workItems: new InMemoryWorkItemStore(),
      logEntries,
      gardenNotes: new InMemoryGardenNoteStore(),
    });

    expect(paths).toHaveLength(1);
    expect(paths[0].params.slug).toBe("day-3-shipped-note");
    expect(paths[0].props.html).toContain("<h1>Shipped Note</h1>");
  });
});
