import { slugify } from "./slug";

export type WorkItemVisibility = "public" | "private" | "gated";

export const CATCH_ALL_PRODUCT_LINE_ID = "catch-all";

export const DEFAULT_WORK_ITEM_TITLE = "untitled project";

export type CreateWorkItemInput = {
  id: string;
  title: string;
  productLineId?: string;
  visibility?: WorkItemVisibility;
};

export type WorkItem = {
  id: string;
  title: string;
  slug: string;
  productLineId: string;
  visibility: WorkItemVisibility;
};

export function createWorkItem(input: CreateWorkItemInput): WorkItem {
  const title = input.title || DEFAULT_WORK_ITEM_TITLE;
  return {
    ...input,
    title,
    slug: slugify(title),
    productLineId: input.productLineId ?? CATCH_ALL_PRODUCT_LINE_ID,
    visibility: input.visibility ?? "private",
  };
}
