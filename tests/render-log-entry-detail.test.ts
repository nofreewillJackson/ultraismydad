import { describe, expect, it } from "vitest";

import { createLogEntry } from "../src/domain/log-entry";
import { renderLogEntryDetail } from "../src/render/log-entry-detail";

describe("render log entry detail", () => {
  it("renders the log entry title in a heading", () => {
    const logEntry = createLogEntry({
      id: "log-001",
      title: "First Note",
      day: 1,
      visibility: "public",
    });

    const html = renderLogEntryDetail(logEntry);

    expect(html).toContain("<h1>First Note</h1>");
  });
});
