import type { LogEntry } from "../domain/log-entry";
import type { LogEntryStore } from "./log-entry-store";

export class InMemoryLogEntryStore implements LogEntryStore {
  private readonly logEntries: LogEntry[] = [];

  async save(logEntry: LogEntry): Promise<void> {
    this.logEntries.push(logEntry);
  }

  async list(): Promise<LogEntry[]> {
    return [...this.logEntries];
  }
}
