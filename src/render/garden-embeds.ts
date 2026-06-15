import { slugify } from "../domain/slug";
import { escapeHtml } from "./escape";

type EmbedTarget = { slug: string; title: string; html: string } | null;

const EMBED_RE =
  /<div class="gm-embed[^"]*" data-embed-slug="([^"]*)" data-embed-hash="([^"]*)" data-embed-label="([^"]*)">[\s\S]*?<\/div>/g;

export function resolveEmbeds(
  html: string,
  getNote: (slug: string) => EmbedTarget,
  depth = 0,
): string {
  if (depth > 2) {
    return stripPlaceholders(html);
  }

  const resolved = html.replace(EMBED_RE, (_full, slug, hash, label) => {
    const target = slug ? getNote(slug) : null;
    if (!target) {
      return `<div class="gm-embed is-unresolved"><div class="gm-embed-head">${label} <span class="gm-embed-missing">— unresolved embed</span></div></div>`;
    }

    let inner = hash ? sliceSection(target.html, hash) ?? target.html : target.html;
    inner = resolveEmbeds(inner, getNote, depth + 1);
    const hashLabel = hash ? ` <span class="gm-embed-sub">› ${escapeHtml(hash.replace(/^\^/, ""))}</span>` : "";
    return (
      `<figure class="gm-embed gm-embed-note">` +
      `<figcaption class="gm-embed-head"><a href="/garden/${target.slug}">${escapeHtml(target.title)}</a>${hashLabel}</figcaption>` +
      `<div class="gm-embed-body">${inner}</div></figure>`
    );
  });

  return resolved.replace(/<p>(\s*<figure class="gm-embed[\s\S]*?<\/figure>\s*)<\/p>/g, "$1");
}

function stripPlaceholders(html: string): string {
  return html.replace(EMBED_RE, (_full, _slug, _hash, label) => `<span class="gm-embed-flat">${label}</span>`);
}

function sliceSection(html: string, hash: string): string | null {
  if (hash.startsWith("^")) {
    return extractById(html, hash.slice(1));
  }
  const id = slugify(hash);
  const headingRe = new RegExp(`<h([1-6])[^>]*\\bid="${escapeRe(id)}"[^>]*>`, "i");
  const match = headingRe.exec(html);
  if (!match) {
    return extractById(html, id);
  }

  const level = Number(match[1]);
  const start = match.index;
  const nextRe = /<h([1-6])[^>]*>/gi;
  nextRe.lastIndex = start + match[0].length;
  let end = html.length;
  let nextMatch: RegExpExecArray | null;
  while ((nextMatch = nextRe.exec(html))) {
    if (Number(nextMatch[1]) <= level) {
      end = nextMatch.index;
      break;
    }
  }
  return html.slice(start, end);
}

function extractById(html: string, id: string): string | null {
  const idRe = new RegExp(`\\bid="${escapeRe(id)}"`, "i");
  const idMatch = idRe.exec(html);
  if (!idMatch) {
    return null;
  }

  const start = html.lastIndexOf("<", idMatch.index);
  if (start < 0) {
    return null;
  }

  const tagMatch = /^<([a-zA-Z0-9]+)/.exec(html.slice(start));
  if (!tagMatch) {
    return null;
  }

  const tag = tagMatch[1];
  if (/^(img|hr|br|input)$/i.test(tag)) {
    const close = html.indexOf(">", start);
    return close >= 0 ? html.slice(start, close + 1) : null;
  }

  const tokenRe = new RegExp(`<${tag}\\b|</${tag}>`, "gi");
  tokenRe.lastIndex = start;
  let depth = 0;
  let tokenMatch: RegExpExecArray | null;
  while ((tokenMatch = tokenRe.exec(html))) {
    if (tokenMatch[0][1] === "/") {
      depth--;
      if (depth === 0) {
        return html.slice(start, tokenMatch.index + tokenMatch[0].length);
      }
    } else {
      depth++;
    }
  }
  return null;
}

function escapeRe(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
