import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { createWorkItem } from "../src/domain/work-item";
import { FilesystemWorkItemStore } from "../src/store/filesystem-work-item-store";

describe("filesystem work item store", () => {
  let dir: string;

  beforeEach(async () => {
    dir = await mkdtemp(join(tmpdir(), "wis-"));
  });

  afterEach(async () => {
    await rm(dir, { recursive: true, force: true });
  });

  it("returns an empty list when the snapshot file does not exist", async () => {
    const store = new FilesystemWorkItemStore(join(dir, "missing.json"));

    expect(await store.list()).toEqual([]);
  });

  it("persists a saved work item so a fresh instance reads it back", async () => {
    const path = join(dir, "work-items.json");
    const workItem = createWorkItem({
      id: "work-001",
      title: "First Build",
      visibility: "public",
    });

    await new FilesystemWorkItemStore(path).save(workItem);

    const reopened = new FilesystemWorkItemStore(path);
    expect(await reopened.list()).toEqual([workItem]);
  });

  it("normalizes a loaded row with no slug by deriving one from its title", async () => {
    const path = join(dir, "work-items.json");
    // A hand-authored row — exactly the shape of data/work-items.json: no slug.
    await writeFile(
      path,
      JSON.stringify([
        { id: "loaded-001", title: "Loaded Item", productLineId: "catch-all", visibility: "public" },
      ]),
      "utf8",
    );

    const [item] = await new FilesystemWorkItemStore(path).list();

    expect(item.slug).toBe("loaded-item");
  });

  it("rejects a snapshot whose top-level JSON is not an array", async () => {
    const path = join(dir, "work-items.json");
    await writeFile(path, JSON.stringify({ not: "an array" }), "utf8");

    const store = new FilesystemWorkItemStore(path);

    await expect(store.list()).rejects.toThrow(/array/i);
  });
});
