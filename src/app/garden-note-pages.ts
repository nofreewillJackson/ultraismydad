import { buildNoteIndex, deriveBacklinks, resolveWikilink } from "../domain/garden-note";
import type { GardenNote } from "../domain/garden-note";
import { buildAnalytics, type GraphAnalytics } from "../domain/garden-analytics";
import { resolveEmbeds } from "../render/garden-embeds";
import { createGardenRenderer } from "../render/garden-markdown";
import { renderGardenIndex } from "../render/garden-index";
import { renderGardenNoteDetail } from "../render/garden-note-detail";
import { exportReadModel } from "./export-read-model";
import type { ExportStores } from "./export-read-model";

export type RenderedGardenNote = GardenNote & {
  html: string;
  links: string[];
  backlinks: string[];
};

export type GardenNotePage = {
  params: { slug: string };
  props: { html: string; title: string; description: string };
};

export type GardenIndexPage = {
  html: string;
};

export type GardenData = {
  notes: RenderedGardenNote[];
  bySlug: Map<string, RenderedGardenNote>;
  tags: { tag: string; count: number }[];
  graph: GraphAnalytics;
};

export async function getGardenNotePaths(stores: ExportStores): Promise<GardenNotePage[]> {
  const { notes } = await getGardenData(stores);
  const bySlug = new Map(notes.map((note) => [note.slug, note]));

  return notes.map((note) => ({
    params: { slug: note.slug },
    props: {
      html: renderGardenNoteDetail(note, bySlug),
      title: note.title,
      description: note.description,
    },
  }));
}

export async function getGardenIndex(stores: ExportStores): Promise<GardenIndexPage> {
  const { notes } = await getGardenData(stores);
  return { html: renderGardenIndex(notes) };
}

export async function getGardenData(stores: ExportStores): Promise<GardenData> {
  const { gardenNotes } = await exportReadModel(stores);
  const index = buildNoteIndex(gardenNotes);
  const renderer = await createGardenRenderer({
    resolve: (name) => resolveWikilink(name, index),
  });

  const rendered: RenderedGardenNote[] = [];
  for (const note of gardenNotes) {
    const { code, links } = await renderer.render(note.body);
    rendered.push({
      ...note,
      html: code,
      links: [...new Set(links)].filter((slug) => slug !== note.slug),
      backlinks: [],
    });
  }

  const bySlug = new Map(rendered.map((note) => [note.slug, note]));
  const original = new Map(rendered.map((note) => [note.slug, note.html]));
  const getNote = (slug: string) => {
    const note = bySlug.get(slug);
    return note ? { slug: note.slug, title: note.title, html: original.get(slug) || "" } : null;
  };
  for (const note of rendered) {
    note.html = resolveEmbeds(original.get(note.slug) || "", getNote);
  }

  const notes = deriveBacklinks(rendered).sort(
    (a, b) => (b.date || "").localeCompare(a.date || "") || a.title.localeCompare(b.title),
  );

  const tagCount = new Map<string, number>();
  for (const note of notes) {
    for (const tag of note.tags) {
      tagCount.set(tag, (tagCount.get(tag) || 0) + 1);
    }
  }
  const tags = [...tagCount.entries()]
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag));

  const graph = buildAnalytics(
    notes.map((note) => ({ slug: note.slug, title: note.title, links: note.links, tags: note.tags })),
  );

  return { notes, bySlug: new Map(notes.map((note) => [note.slug, note])), tags, graph };
}
