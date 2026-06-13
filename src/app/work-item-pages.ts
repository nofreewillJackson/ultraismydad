import { exportReadModel } from "./export-read-model";
import { renderWorkItemDetail } from "../render/work-item-detail";
import type { WorkItemStore } from "../store/work-item-store";

export type WorkItemPage = {
  params: { id: string };
  props: { html: string };
};

export async function getWorkItemPaths(store: WorkItemStore): Promise<WorkItemPage[]> {
  const { workItems } = await exportReadModel(store);
  return workItems.map((workItem) => ({
    params: { id: workItem.id },
    props: { html: renderWorkItemDetail(workItem) },
  }));
}
