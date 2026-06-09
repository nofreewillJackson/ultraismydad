import type { WorkItem } from "./work-item";

export function selectPublicWorkItems(workItems: WorkItem[]): WorkItem[] {
  return workItems.filter((workItem) => workItem.visibility === "public");
}
