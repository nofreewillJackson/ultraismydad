import { describe, expect, it } from "vitest";

import { createWorkItem } from "../src/domain/work-item";
import { createLogEntry } from "../src/domain/log-entry";
import { selectPublic } from "../src/domain/privacy-gate";

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

    const readModelItems = selectPublic([
      publicWorkItem,
      privateWorkItem,
    ]);

    expect(readModelItems).toEqual([publicWorkItem]);
  });

  it("excludes non-public items of any entity (the one gate, on log entries)", () => {
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

    expect(selectPublic([publicEntry, privateEntry])).toEqual([publicEntry]);
  });
});
