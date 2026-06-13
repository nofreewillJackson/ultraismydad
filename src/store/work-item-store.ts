import type { WorkItem } from "../domain/work-item";

export interface WorkItemStore {
  save(workItem: WorkItem): Promise<void>;
  list(): Promise<WorkItem[]>;
}
