import { slugify } from "./slug";
import { DEFAULT_VISIBILITY, type Visibility } from "./visibility";

export const DEFAULT_GARDEN_NOTE_TITLE = "untitled note";

export type CreateGardenNoteInput = {
  id: string;
  slug?: string;
  title?: string;
  description?: string;
  date?: string;
  tags?: unknown;
  aliases?: unknown;
  visibility?: Visibility;
  draft?: boolean;
  body?: string;
};

export type GardenNote = {
  id: string;
  slug: string;
  title: string;
  description: string;
  date: string;
  tags: string[];
  aliases: string[];
  visibility: Visibility;
  body: string;
};

export type GardenLinkResolution = {
  slug: string;
  title: string;
  exists: boolean;
};

export type GardenNoteIndex = Map<string, { slug: string; title: string }>;

export type LinkedGardenNote = {
  slug: string;
  links: string[];
  backlinks: string[];
};

export function createGardenNote(input: CreateGardenNoteInput): GardenNote {
  if (!input.id) {
    throw new Error("garden note requires an id");
  }

  const title = input.title || DEFAULT_GARDEN_NOTE_TITLE;
  return {
    id: input.id,
    slug: slugify(input.slug || input.id || title),
    title,
    description: input.description || "",
    date: input.date || "",
    tags: normalizeTags(input.tags),
    aliases: normalizeAliases(input.aliases),
    visibility: input.visibility ?? visibilityFromDraft(input.draft) ?? DEFAULT_VISIBILITY,
    body: input.body || "",
  };
}

export function buildNoteIndex(notes: GardenNote[]): GardenNoteIndex {
  const index: GardenNoteIndex = new Map();

  for (const note of notes) {
    const add = (name?: string) => {
      const key = (name || "").trim().toLowerCase();
      if (key && !index.has(key)) {
        index.set(key, { slug: note.slug, title: note.title });
      }
    };

    add(note.id);
    add(note.id.replace(/\.md$/, "").split("/").pop());
    add(note.title);
    add(note.slug);
    note.aliases.forEach(add);
  }

  return index;
}

export function resolveWikilink(name: string, index: GardenNoteIndex): GardenLinkResolution {
  const hit = index.get(name.trim().toLowerCase());
  if (hit) {
    return { ...hit, exists: true };
  }
  return { slug: slugify(name), title: name, exists: false };
}

export function deriveBacklinks<T extends LinkedGardenNote>(notes: T[]): T[] {
  const backlinksBySlug = new Map(notes.map((note) => [note.slug, new Set<string>()]));

  for (const source of notes) {
    for (const targetSlug of source.links) {
      if (targetSlug === source.slug) {
        continue;
      }
      backlinksBySlug.get(targetSlug)?.add(source.slug);
    }
  }

  return notes.map((note) => ({
    ...note,
    backlinks: [...(backlinksBySlug.get(note.slug) ?? [])],
  }));
}

function normalizeTags(value: unknown): string[] {
  return toStringArray(value)
    .map((tag) => tag.replace(/^#/, "").toLowerCase())
    .filter(Boolean);
}

function normalizeAliases(value: unknown): string[] {
  return toStringArray(value);
}

function toStringArray(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.map((item) => String(item).trim()).filter(Boolean);
  }
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed ? [trimmed] : [];
  }
  return [];
}

function visibilityFromDraft(draft: boolean | undefined): Visibility | undefined {
  if (draft === true) {
    return "private";
  }
  if (draft === false) {
    return "public";
  }
  return undefined;
}
