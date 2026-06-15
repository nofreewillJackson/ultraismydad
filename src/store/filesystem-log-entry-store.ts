import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname } from "node:path";

import { createLogEntry } from "../domain/log-entry";
import type { CreateLogEntryInput, LogEntry } from "../domain/log-entry";
import type { LogEntryStore } from "./log-entry-store";

// The build's real log-entry data source. A deliberate twin of
// FilesystemWorkItemStore: same ENOENT-as-empty read, same not-an-array guard,
// same tolerant-reader / strict-writer stance (raw rows are reconstituted
// through the domain factory on read, so the port's contract holds whatever is
// on disk). Kept as a parallel class for now; if the duplication grows, the two
// are candidates to fold into one generic snapshot store.
export class FilesystemLogEntryStore implements LogEntryStore {
  constructor(private readonly filePath: string) {}

  async save(logEntry: LogEntry): Promise<void> {
    const logEntries = await this.list();
    logEntries.push(logEntry);
    await mkdir(dirname(this.filePath), { recursive: true });
    await writeFile(this.filePath, JSON.stringify(logEntries, null, 2), "utf8");
  }

  async list(): Promise<LogEntry[]> {
    // ENOENT guards only the read: a missing snapshot means "no entries yet".
    let raw: string;
    try {
      raw = await readFile(this.filePath, "utf8");
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") {
        return [];
      }
      throw error;
    }

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      throw new Error(`snapshot at ${this.filePath} must be a JSON array`);
    }

    // Persisted rows are raw, possibly-partial input — not yet domain objects.
    // Reconstitute each through createLogEntry so the rules stay in the domain
    // and the store just honors them on read.
    return (parsed as CreateLogEntryInput[]).map(createLogEntry);
  }
}
