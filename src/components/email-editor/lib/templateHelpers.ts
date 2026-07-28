import { TEMPLATE_TAGS } from "./templateTags";
import type { TagDef } from "./types";
import { formatSingleDayOrNull } from "@/lib/trips/tripDates";

export function pillStyle(tag: TagDef): string {
  return [
    `display:inline`,
    `background:${tag.bg}`,
    `color:${tag.color}`,
    `border:1.5px solid ${tag.border}`,
    `border-radius:5px`,
    `padding:1px 7px 2px`,
    `font-size:0.88em`,
    `font-weight:700`,
    `white-space:nowrap`,
    `cursor:default`,
    `user-select:none`,
    `-webkit-user-select:none`,
    `margin:0 1px`,
    `line-height:1.5`,
    `vertical-align:baseline`,
  ].join(";");
}

/**
 * Usuwa emoji i znaki graficzne z tekstu — e-maile mają być czyste, bez emoji.
 * Zachowuje znaki nowej linii.
 */
export function stripEmoji(input: string): string {
  return input
    .replace(/\p{Extended_Pictographic}/gu, "")
    .replace(/[\u{FE0F}\u{200D}\u{20E3}]/gu, "")
    .replace(/[\u{1F1E6}-\u{1F1FF}]/gu, "")
    .replace(/[^\S\n]{2,}/g, " ")
    .replace(/[^\S\n]+([,.!?;:])/g, "$1")
    .replace(/[^\S\n]+$/gm, "");
}

export function templateToHtml(
  template: string,
  values: Record<string, string>,
  options?: { plain?: boolean },
): string {
  const src = options?.plain ? stripEmoji(template) : template;
  return src
    .replace(/\{(\w+)\}/g, (_, key) => {
      const tag = TEMPLATE_TAGS.find((t) => t.name === key);
      const display = values[key] ?? `{${key}}`;
      if (!tag) return display;
      // Tryb podglądu/wysyłki — dane dynamiczne jako pogrubiony tekst w kolorze brand-primary, bez pigułki.
      if (options?.plain) {
        return `<strong data-tag="${key}" style="color:#287d88;font-weight:700;">${display}</strong>`;
      }
      return `<span contenteditable="false" data-tag="${key}" style="${pillStyle(tag)}">${display}</span>`;
    })
    .replace(/\n/g, "<br>");
}

export function htmlToTemplate(el: HTMLElement): string {
  let out = "";
  el.childNodes.forEach((node) => {
    if (node.nodeType === Node.TEXT_NODE) {
      out += node.textContent ?? "";
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      const elem = node as HTMLElement;
      const tag = elem.dataset.tag;
      if (tag) {
        out += `{${tag}}`;
      } else if (elem.tagName === "BR") {
        out += "\n";
      } else if (elem.tagName === "DIV" || elem.tagName === "P") {
        const inner = htmlToTemplate(elem);
        if (inner) out += inner + "\n";
      } else {
        out += htmlToTemplate(elem);
      }
    }
  });
  return out.replace(/\n+$/, "");
}

export function formatDateRange(start: string, end: string): string {
  if (!start) return "Termin do ustalenia";
  const singleDay = formatSingleDayOrNull(start, end);
  if (singleDay) return singleDay;
  try {
    const fmt = new Intl.DateTimeFormat("pl-PL", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
    if (end) return `${fmt.format(new Date(start))} – ${fmt.format(new Date(end))}`;
    return fmt.format(new Date(start));
  } catch {
    return start;
  }
}

export function parseLocation(raw: unknown): string {
  if (!raw) return "";
  try {
    const obj = typeof raw === "string" ? JSON.parse(raw) : raw;
    if (typeof obj === "object" && obj !== null) {
      const parts = [
        (obj as Record<string, string>).name,
        (obj as Record<string, string>).city,
      ].filter(Boolean);
      if (parts.length) return parts.join(", ");
    }
  } catch {
    /* fall through */
  }
  return typeof raw === "string" ? raw : "";
}
