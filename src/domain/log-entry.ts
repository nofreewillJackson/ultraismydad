import { slugify } from "./slug";

export const DEFAULT_LOG_ENTRY_TITLE = "untitled entry";

export type CreateLogEntryInput = {
  id: string;
  title: string;
  day?: number;
};

export type LogEntry = {
  id: string;
  title: string;
  slug: string;
  day?: number;
};

export function createLogEntry(input: CreateLogEntryInput): LogEntry {
  if (!input.id) {
    throw new Error("log entry requires an id");
  }
  const title = input.title || DEFAULT_LOG_ENTRY_TITLE;
  return {
    ...input,
    title,
    slug: slugify(`day-${input.day}-${title}`),
  };
}
