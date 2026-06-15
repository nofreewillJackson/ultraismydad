import { readdir, readFile } from "node:fs/promises";
import { basename, join } from "node:path";

import matter from "gray-matter";

import { createGardenNote } from "../domain/garden-note";
import type { CreateGardenNoteInput, GardenNote } from "../domain/garden-note";
import type { Visibility } from "../domain/visibility";
import type { GardenNoteStore } from "./garden-note-store";

export class FilesystemGardenNoteStore implements GardenNoteStore {
  constructor(private readonly dirPath: string) {}

  async list(): Promise<GardenNote[]> {
    let entries;
    try {
      entries = await readdir(this.dirPath, { withFileTypes: true });
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") {
        return [];
      }
      throw error;
    }

    const files = entries
      .filter((entry) => entry.isFile() && entry.name.endsWith(".md"))
      .map((entry) => entry.name)
      .sort((a, b) => a.localeCompare(b));

    return Promise.all(files.map((file) => this.loadFile(file)));
  }

  private async loadFile(file: string): Promise<GardenNote> {
    const raw = await readFile(join(this.dirPath, file), "utf8");
    const parsed = matter(raw);
    const data = parsed.data as Record<string, unknown>;
    const id = basename(file, ".md");

    const input: CreateGardenNoteInput = {
      id,
      slug: asString(data.slug) || id,
      title: asString(data.title),
      description: asString(data.description),
      date: asDateString(data.date),
      tags: data.tags,
      aliases: data.aliases,
      visibility: asVisibility(data.visibility),
      draft: asBoolean(data.draft),
      body: parsed.content,
    };

    return createGardenNote(input);
  }
}

function asString(value: unknown): string | undefined {
  return typeof value === "string" ? value : undefined;
}

function asBoolean(value: unknown): boolean | undefined {
  return typeof value === "boolean" ? value : undefined;
}

function asVisibility(value: unknown): Visibility | undefined {
  if (value === "public" || value === "private" || value === "gated") {
    return value;
  }
  return undefined;
}

function asDateString(value: unknown): string | undefined {
  if (typeof value === "string") {
    return value;
  }
  if (value instanceof Date) {
    return value.toISOString().slice(0, 10);
  }
  return undefined;
}
