import type { GardenNote } from "../domain/garden-note";
import { escapeHtml } from "./escape";

type GardenIndexNote = GardenNote & {
  backlinks: string[];
};

export function renderGardenIndex(notes: GardenIndexNote[]): string {
  const cards = notes.map(renderCard).join("");
  return `<main>
  <h1>the garden</h1>
  <p>A small, interlinked set of notes rendered with Obsidian-flavored markdown.</p>
  <section class="garden-grid">${cards}</section>
</main>`;
}

function renderCard(note: GardenIndexNote): string {
  const meta = [
    note.date ? `<span>${escapeHtml(note.date)}</span>` : "",
    note.tags.length ? `<span>${escapeHtml(note.tags.map((tag) => `#${tag}`).join(" · "))}</span>` : "",
    note.backlinks.length ? `<span>linked mentions ${note.backlinks.length}</span>` : "",
  ]
    .filter(Boolean)
    .join(" · ");

  return `<article class="garden-card">
  <h2><a href="/garden/${escapeHtml(note.slug)}">${escapeHtml(note.title)}</a></h2>
  ${note.description ? `<p>${escapeHtml(note.description)}</p>` : ""}
  ${meta ? `<p class="garden-card-meta">${meta}</p>` : ""}
</article>`;
}
