import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { createLogEntry } from "../src/domain/log-entry";
import { FilesystemLogEntryStore } from "../src/store/filesystem-log-entry-store";

describe("filesystem log entry store", () => {
  let dir: string;

  beforeEach(async () => {
    dir = await mkdtemp(join(tmpdir(), "les-"));
  });

  afterEach(async () => {
    await rm(dir, { recursive: true, force: true });
  });

  it("returns an empty list when the snapshot file does not exist", async () => {
    const store = new FilesystemLogEntryStore(join(dir, "missing.json"));

    expect(await store.list()).toEqual([]);
  });

  it("persists a saved log entry so a fresh instance reads it back", async () => {
    const path = join(dir, "log-entries.json");
    const logEntry = createLogEntry({
      id: "log-001",
      title: "First Note",
      day: 1,
      visibility: "public",
    });

    await new FilesystemLogEntryStore(path).save(logEntry);

    const reopened = new FilesystemLogEntryStore(path);
    expect(await reopened.list()).toEqual([logEntry]);
  });

  it("normalizes a loaded row with no slug by deriving one from day and title", async () => {
    const path = join(dir, "log-entries.json");
    // A hand-authored row — exactly the shape of data/log-entries.json: no slug.
    await writeFile(
      path,
      JSON.stringify([
        { id: "loaded-001", title: "Loaded Note", day: 7, visibility: "public" },
      ]),
      "utf8",
    );

    const [entry] = await new FilesystemLogEntryStore(path).list();

    expect(entry.slug).toBe("day-7-loaded-note");
  });

  it("rejects a snapshot whose top-level JSON is not an array", async () => {
    const path = join(dir, "log-entries.json");
    await writeFile(path, JSON.stringify({ not: "an array" }), "utf8");

    const store = new FilesystemLogEntryStore(path);

    await expect(store.list()).rejects.toThrow(/array/i);
  });
});
