import type { WorkItem } from "../domain/work-item";

export function renderWorkItemDetail(workItem: WorkItem): string {
  return `<h1>${workItem.title}</h1>`;
}
