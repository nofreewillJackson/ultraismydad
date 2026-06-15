import { exportReadModel } from "./export-read-model";
import type { ExportStores } from "./export-read-model";
import { renderWorkItemDetail } from "../render/work-item-detail";

export type WorkItemPage = {
  params: { slug: string };
  props: { html: string };
};

// Each page builder is a view onto the one public read model: it assembles the
// full gated model (via the single export seam) and renders its own collection.
export async function getWorkItemPaths(stores: ExportStores): Promise<WorkItemPage[]> {
  const { workItems } = await exportReadModel(stores);
  return workItems.map((workItem) => ({
    params: { slug: workItem.slug },
    props: { html: renderWorkItemDetail(workItem) },
  }));
}
