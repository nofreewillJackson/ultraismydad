import type { WorkItem } from "../domain/work-item";

export class InMemoryWorkItemStore {
  private readonly workItems: WorkItem[] = [];

  async save(workItem: WorkItem): Promise<void> {
    this.workItems.push(workItem);
  }

  async list(): Promise<WorkItem[]> {
    return [...this.workItems];
  }
}
