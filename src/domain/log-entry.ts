export type CreateLogEntryInput = {
  id: string;
  title: string;
};

export type LogEntry = {
  id: string;
  title: string;
};

export function createLogEntry(input: CreateLogEntryInput): LogEntry {
  if (!input.id) {
    throw new Error("log entry requires an id");
  }
  return { ...input };
}
