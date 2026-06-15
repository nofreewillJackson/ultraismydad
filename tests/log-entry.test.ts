import { describe, expect, it } from "vitest";

import { createLogEntry } from "../src/domain/log-entry";

describe("log entry", () => {
  it("rejects a log entry with no id", () => {
    expect(() => createLogEntry({ id: "", title: "Anything" })).toThrow(/id/i);
  });

  it("titles an untitled log entry 'untitled entry'", () => {
    const logEntry = createLogEntry({
      id: "log-001",
      title: "",
    });

    expect(logEntry.title).toBe("untitled entry");
  });
});
