import { describe, expect, it } from "vitest";

import { createLogEntry } from "../src/domain/log-entry";

describe("log entry", () => {
  it("rejects a log entry with no id", () => {
    expect(() => createLogEntry({ id: "", title: "Anything" })).toThrow(/id/i);
  });
});
