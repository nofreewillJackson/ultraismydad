import { describe, expect, it } from "vitest";

import { createLogEntry, dedupeLogSlugs } from "../src/domain/log-entry";

describe("log entry", () => {
  it("rejects a log entry with no id", () => {
    expect(() => createLogEntry({ id: "", title: "Anything" })).toThrow(/id/i);
  });

  it("defaults visibility to private when omitted", () => {
    const logEntry = createLogEntry({ id: "log-005", title: "Draft note" });

    expect(logEntry.visibility).toBe("private");
  });

  it("titles an untitled log entry 'untitled entry'", () => {
    const logEntry = createLogEntry({
      id: "log-001",
      title: "",
    });

    expect(logEntry.title).toBe("untitled entry");
  });

  it("derives a slug from day and title when no slug is provided", () => {
    const logEntry = createLogEntry({
      id: "log-002",
      title: "First Build",
      day: 5,
    });

    expect(logEntry.slug).toBe("day-5-first-build");
  });

  it("slugs a day-less log entry without a literal 'undefined'", () => {
    const logEntry = createLogEntry({
      id: "log-003",
      title: "First Build",
    });

    expect(logEntry.slug).toBe("day-first-build");
  });

  it("preserves an explicitly provided slug", () => {
    const logEntry = createLogEntry({
      id: "log-004",
      title: "First Build",
      day: 5,
      slug: "pinned-log-key",
    });

    expect(logEntry.slug).toBe("pinned-log-key");
  });
});

describe("dedupeLogSlugs", () => {
  it("keeps the first colliding slug and suffixes a later one with a short id", () => {
    const first = createLogEntry({ id: "AAAAAAAA", title: "First Build", day: 1 });
    const second = createLogEntry({ id: "BBBBBB99", title: "First Build", day: 1 });

    const [a, b] = dedupeLogSlugs([first, second]);

    expect(a.slug).toBe("day-1-first-build");
    expect(b.slug).toBe("day-1-first-build-bbbbbb");
  });
});
