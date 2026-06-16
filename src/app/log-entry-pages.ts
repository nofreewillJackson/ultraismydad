import { exportReadModel } from "./export-read-model";
import type { ExportStores } from "./export-read-model";
import { renderLogEntryDetail } from "../render/log-entry-detail";

export type LogEntryPage = {
  params: { slug: string };
  props: { html: string };
};

// A view onto the one public read model (mirror of getWorkItemPaths): assemble
// the full read model through the single export seam, then render the log-entry
// slice. The route keys on each entry's derived slug.
export async function getLogEntryPaths(stores: ExportStores): Promise<LogEntryPage[]> {
  const { logEntries } = await exportReadModel(stores);
  return logEntries.map((logEntry) => ({
    params: { slug: logEntry.slug },
    props: { html: renderLogEntryDetail(logEntry) },
  }));
}
