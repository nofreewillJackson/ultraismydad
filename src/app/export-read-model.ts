import type { WorkItem } from "../domain/work-item";
import { selectPublicWorkItems } from "../domain/privacy-gate";
import type { WorkItemStore } from "../store/work-item-store";

export type ReadModel = {
  workItems: WorkItem[];
};

export async function exportReadModel(store: WorkItemStore): Promise<ReadModel> {
  const all = await store.list();
  return { workItems: selectPublicWorkItems(all) };
}
