import type { WorkItem } from "../domain/work-item";
import type { WorkItemStore } from "./work-item-store";

export class InMemoryWorkItemStore implements WorkItemStore {
  private readonly workItems: WorkItem[] = [];

  async save(workItem: WorkItem): Promise<void> {
    this.workItems.push(workItem);
  }

  async list(): Promise<WorkItem[]> {
    return [...this.workItems];
  }
}
