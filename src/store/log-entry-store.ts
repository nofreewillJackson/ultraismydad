import type { LogEntry } from "../domain/log-entry";

export interface LogEntryStore {
  save(logEntry: LogEntry): Promise<void>;
  list(): Promise<LogEntry[]>;
}
