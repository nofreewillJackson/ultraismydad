import { exportReadModel } from "./export-read-model";
import { renderWorkItemDetail } from "../render/work-item-detail";
import type { WorkItemStore } from "../store/work-item-store";

export type WorkItemPage = {
  params: { slug: string };
  props: { html: string };
};

export async function getWorkItemPaths(store: WorkItemStore): Promise<WorkItemPage[]> {
  const { workItems } = await exportReadModel(store);
  return workItems.map((workItem) => ({
    params: { slug: workItem.slug },
    props: { html: renderWorkItemDetail(workItem) },
  }));
}
