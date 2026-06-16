import type { WorkItem } from "../domain/work-item";
import type { LogEntry } from "../domain/log-entry";
import type { GardenNote } from "../domain/garden-note";
import { selectPublic } from "../domain/privacy-gate";
import type { WorkItemStore } from "../store/work-item-store";
import type { LogEntryStore } from "../store/log-entry-store";
import type { GardenNoteStore } from "../store/garden-note-store";

// The export seam: the single place where stored data becomes the public read
// model. Every collection passes through the one `selectPublic` gate here, so
// privacy is decided once. As the archive grows, add a store + read-model field,
// never a second visibility check.
export type ExportStores = {
  workItems: WorkItemStore;
  logEntries: LogEntryStore;
  gardenNotes: GardenNoteStore;
};

export type ReadModel = {
  workItems: WorkItem[];
  logEntries: LogEntry[];
  gardenNotes: GardenNote[];
};

export async function exportReadModel(stores: ExportStores): Promise<ReadModel> {
  const [workItems, logEntries, gardenNotes] = await Promise.all([
    stores.workItems.list(),
    stores.logEntries.list(),
    stores.gardenNotes.list(),
  ]);
  return {
    workItems: selectPublic(workItems),
    logEntries: selectPublic(logEntries),
    gardenNotes: selectPublic(gardenNotes),
  };
}
