import type { GardenNote } from "../domain/garden-note";
import { escapeHtml } from "./escape";

type GardenDetailNote = GardenNote & {
  html: string;
  backlinks: string[];
};

export function renderGardenNoteDetail(
  note: GardenDetailNote,
  bySlug: Map<string, GardenDetailNote>,
): string {
  const backlinks = note.backlinks
    .map((slug) => bySlug.get(slug))
    .filter((backlink): backlink is GardenDetailNote => Boolean(backlink))
    .sort((a, b) => (b.date || "").localeCompare(a.date || "") || a.title.localeCompare(b.title));

  return `<main>
  <article class="garden-note">
    <a href="/garden">back to garden</a>
    ${note.date || note.tags.length ? `<p class="garden-note-meta">${renderMeta(note)}</p>` : ""}
    <h1>${escapeHtml(note.title)}</h1>
    ${note.tags.length ? renderTags(note.tags) : ""}
    <div class="md gm-md">${note.html}</div>
    ${renderBacklinks(backlinks)}
  </article>
</main>`;
}

function renderMeta(note: GardenDetailNote): string {
  return [note.date, ...note.tags.map((tag) => `#${tag}`)].filter(Boolean).map(escapeHtml).join(" · ");
}

function renderTags(tags: string[]): string {
  return `<p class="garden-tags">${tags
    .map((tag) => `<a href="/garden?tag=${encodeURIComponent(tag)}">#${escapeHtml(tag)}</a>`)
    .join(" ")}</p>`;
}

function renderBacklinks(backlinks: GardenDetailNote[]): string {
  if (!backlinks.length) {
    return `<section class="gm-backlinks">
  <h2>linked mentions</h2>
  <p>No notes link here yet.</p>
</section>`;
  }

  return `<section class="gm-backlinks">
  <h2>linked mentions <span>${backlinks.length}</span></h2>
  <ul>${backlinks
    .map(
      (backlink) =>
        `<li><a href="/garden/${escapeHtml(backlink.slug)}">${escapeHtml(backlink.title)}</a>${
          backlink.description ? ` <span>${escapeHtml(backlink.description)}</span>` : ""
        }</li>`,
    )
    .join("")}</ul>
</section>`;
}
