import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname } from "node:path";

import type { WorkItem } from "../domain/work-item";
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
      return JSON.parse(await readFile(this.filePath, "utf8")) as WorkItem[];
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") {
        return [];
      }
      throw error;
    }
  }
}
