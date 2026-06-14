import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname } from "node:path";

import { createWorkItem } from "../domain/work-item";
import type { CreateWorkItemInput, WorkItem } from "../domain/work-item";
import type { WorkItemStore } from "./work-item-store";

export class FilesystemWorkItemStore implements WorkItemStore {
  constructor(private readonly filePath: string) {}

  async save(workItem: WorkItem): Promise<void> {
    const workItems = await this.list();
    workItems.push(workItem);
    await mkdir(dirname(this.filePath), { recursive: true });
    await writeFile(this.filePath, JSON.stringify(workItems, null, 2), "utf8");
  }

  async list(): Promise<WorkItem[]> {
    try {
      // Persisted rows are raw, possibly-partial input — not yet domain
      // objects. Reconstitute each through createWorkItem so the port's
      // contract (valid WorkItems) holds no matter what is on disk. The
      // rules stay in the domain; the store just honors them on read.
      const rows = JSON.parse(await readFile(this.filePath, "utf8")) as CreateWorkItemInput[];
      return rows.map(createWorkItem);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") {
        return [];
      }
      throw error;
    }
  }
}
