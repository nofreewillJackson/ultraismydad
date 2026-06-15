import { buildNoteIndex, deriveBacklinks, resolveWikilink } from "../domain/garden-note";
import type { GardenNote } from "../domain/garden-note";
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

export async function getGardenNotePaths(stores: ExportStores): Promise<GardenNotePage[]> {
  const notes = await getRenderedGardenNotes(stores);
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
  const notes = await getRenderedGardenNotes(stores);
  return { html: renderGardenIndex(notes) };
}

async function getRenderedGardenNotes(stores: ExportStores): Promise<RenderedGardenNote[]> {
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

  return deriveBacklinks(rendered).sort(
    (a, b) => (b.date || "").localeCompare(a.date || "") || a.title.localeCompare(b.title),
  );
}
