import { createWorkItem } from "../domain/work-item";
import { InMemoryWorkItemStore } from "../store/in-memory-work-item-store";
import type { WorkItemStore } from "../store/work-item-store";

// TEMPORARY scaffold. Gives the static build something to render while the data
// source is still in-memory. It is replaced by the real filesystem snapshot
// adapter in the next slice step (Cycle 9). This is not production data.
export async function sampleStore(): Promise<WorkItemStore> {
  const store = new InMemoryWorkItemStore();
  await store.save(
    createWorkItem({ id: "shipped-build", title: "Shipped Build", visibility: "public" }),
  );
  await store.save(
    createWorkItem({ id: "draft-build", title: "Draft Build", visibility: "private" }),
  );
  return store;
}
