import type { LogEntry } from "../domain/log-entry";

// Pure log-entry → HTML, mirroring renderWorkItemDetail. HTML-escaping is
// deliberately deferred to a shared XSS trust-boundary cycle (same parked debt
// noted for the work-item renderer) — when it lands, both renderers adopt it.
export function renderLogEntryDetail(logEntry: LogEntry): string {
  return `<h1>${logEntry.title}</h1>`;
}
