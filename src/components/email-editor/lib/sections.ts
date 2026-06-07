import {
  DEFAULT_BUTTON, DEFAULT_HIGHLIGHT_ICONS, DEFAULT_HIGHLIGHT_LABELS, DEFAULT_TITLE,
} from "./templateTags";
import { stripEmoji } from "./templateHelpers";

function uid() {
  return Math.random().toString(36).slice(2, 9);
}

// ─── Discriminated union for all section types ────────────────────────────────
export type EmailSection =
  | { id: string; type: "hero"; image: string }
  | { id: string; type: "image"; image: string }
  | { id: string; type: "title"; content: string }
  | { id: string; type: "text"; content: string }
  | { id: string; type: "details" }
  | { id: string; type: "highlights"; icons: string[]; labels: string[] }
  | { id: string; type: "gallery"; images: string[] }
  | { id: string; type: "validity" }
  | { id: string; type: "cta"; content: string }
  | { id: string; type: "divider" };

export type SectionType = EmailSection["type"];

export const SECTION_LABELS: Record<SectionType, string> = {
  hero: "Zdjęcie hero",
  image: "Zdjęcie",
  title: "Nagłówek",
  text: "Akapit",
  details: "Kiedy / Gdzie",
  highlights: "Highlights",
  gallery: "Galeria",
  validity: "Ważność",
  cta: "Przycisk",
  divider: "Linia",
};

// ─── Defaults ─────────────────────────────────────────────────────────────────
export function createDefaultSections(): EmailSection[] {
  return [
    { id: uid(), type: "hero", image: "" },
    { id: uid(), type: "title", content: DEFAULT_TITLE },
    { id: uid(), type: "text", content: "Cześć {inviteeName}," },
    {
      id: uid(),
      type: "text",
      content:
        "Twoja znajoma {inviterName} serdecznie zaprasza Cię do wspólnego udziału w wyjeździe {campName}. Czeka na Was wspaniały czas, relaks, świetne jedzenie i niezapomniane wspomnienia!",
    },
    { id: uid(), type: "details" },
    {
      id: uid(),
      type: "highlights",
      icons: [...DEFAULT_HIGHLIGHT_ICONS],
      labels: [...DEFAULT_HIGHLIGHT_LABELS],
    },
    { id: uid(), type: "gallery", images: ["", "", ""] },
    { id: uid(), type: "validity" },
    { id: uid(), type: "cta", content: DEFAULT_BUTTON },
  ];
}

// ─── Migrate from old flat fields ─────────────────────────────────────────────
export function migrateToSections(data: {
  invitationEmailTitle?: string | null;
  invitationEmailBody?: string | null;
  invitationEmailButtonText?: string | null;
  invitationEmailHeroImage?: string | null;
  invitationEmailHighlights?: Array<{ emoji: string; label: string }> | null;
  invitationEmailGallery?: string[] | null;
}): EmailSection[] {
  const textBlocks = data.invitationEmailBody
    ? data.invitationEmailBody.split(/\n\n+/).filter(Boolean)
    : ["Cześć {inviteeName},", "Twoja znajoma {inviterName} serdecznie zaprasza Cię..."];

  const highlights = data.invitationEmailHighlights?.length
    ? data.invitationEmailHighlights
    : DEFAULT_HIGHLIGHT_ICONS.map((icon, i) => ({ emoji: icon, label: DEFAULT_HIGHLIGHT_LABELS[i] }));

  const images: string[] = [...(data.invitationEmailGallery ?? [])];
  while (images.length < 3) images.push("");

  return [
    { id: uid(), type: "hero", image: data.invitationEmailHeroImage ?? "" },
    { id: uid(), type: "title", content: data.invitationEmailTitle ?? DEFAULT_TITLE },
    ...textBlocks.map((content): EmailSection => ({ id: uid(), type: "text", content })),
    { id: uid(), type: "details" },
    {
      id: uid(),
      type: "highlights",
      icons: highlights.map((h) => h.emoji),
      labels: highlights.map((h) => h.label),
    },
    { id: uid(), type: "gallery", images: images.slice(0, 3) },
    { id: uid(), type: "validity" },
    { id: uid(), type: "cta", content: data.invitationEmailButtonText ?? DEFAULT_BUTTON },
  ];
}

// ─── Build sections from AI output ────────────────────────────────────────────
export function aiToSections(result: {
  emailTitle?: string;
  textBlocks?: string[];
  buttonText?: string;
  highlights?: Array<{ icon: string; label: string }>;
}, heroImage: string): EmailSection[] {
  // E-maile mają być czyste, bez emoji — czyścimy treść z AI niezależnie od instrukcji promptu.
  const textBlocks = (result.textBlocks?.length
    ? result.textBlocks
    : ["Cześć {inviteeName},", "Twoja znajoma {inviterName} zaprasza Cię..."]
  ).map(stripEmoji);

  const highlights = result.highlights?.length === 3
    ? result.highlights
    : DEFAULT_HIGHLIGHT_ICONS.map((icon, i) => ({ icon, label: DEFAULT_HIGHLIGHT_LABELS[i] }));

  return [
    { id: uid(), type: "hero", image: heroImage },
    { id: uid(), type: "title", content: stripEmoji(result.emailTitle ?? DEFAULT_TITLE) },
    ...textBlocks.map((content): EmailSection => ({ id: uid(), type: "text", content })),
    { id: uid(), type: "details" },
    {
      id: uid(),
      type: "highlights",
      icons: highlights.map((h) => h.icon),
      labels: highlights.map((h) => stripEmoji(h.label)),
    },
    { id: uid(), type: "gallery", images: ["", "", ""] },
    { id: uid(), type: "validity" },
    { id: uid(), type: "cta", content: stripEmoji(result.buttonText ?? DEFAULT_BUTTON) },
  ];
}

// ─── Derive legacy fields from sections (for backward compat in API) ──────────
export function sectionsToLegacy(sections: EmailSection[], subject: string) {
  const hero = sections.find((s) => s.type === "hero") as Extract<EmailSection, { type: "hero" }> | undefined;
  const title = sections.find((s) => s.type === "title") as Extract<EmailSection, { type: "title" }> | undefined;
  const texts = sections.filter((s) => s.type === "text") as Extract<EmailSection, { type: "text" }>[];
  const cta = sections.find((s) => s.type === "cta") as Extract<EmailSection, { type: "cta" }> | undefined;
  const hi = sections.find((s) => s.type === "highlights") as Extract<EmailSection, { type: "highlights" }> | undefined;
  const gallery = sections.find((s) => s.type === "gallery") as Extract<EmailSection, { type: "gallery" }> | undefined;

  return {
    invitationEmailTitle: title?.content ?? DEFAULT_TITLE,
    invitationEmailSubject: subject,
    invitationEmailBody: texts.map((s) => s.content).join("\n\n"),
    invitationEmailButtonText: cta?.content ?? DEFAULT_BUTTON,
    invitationEmailHeroImage: hero?.image || undefined,
    invitationEmailHighlights: (hi?.icons ?? DEFAULT_HIGHLIGHT_ICONS).map((icon, i) => ({
      emoji: icon,
      label: hi?.labels[i] ?? DEFAULT_HIGHLIGHT_LABELS[i],
    })),
    invitationEmailGallery: (gallery?.images ?? []).filter(Boolean),
    invitationEmailSections: sections,
  };
}

// ─── Add a new section after a given index ────────────────────────────────────
export function addSectionAfter(
  sections: EmailSection[],
  afterIdx: number,
  type: SectionType,
): EmailSection[] {
  const newSection = buildEmptySection(type);
  const next = [...sections];
  next.splice(afterIdx + 1, 0, newSection);
  return next;
}

function buildEmptySection(type: SectionType): EmailSection {
  const id = uid();
  switch (type) {
    case "hero":     return { id, type, image: "" };
    case "image":    return { id, type, image: "" };
    case "title":    return { id, type, content: "Nagłówek" };
    case "text":     return { id, type, content: "" };
    case "details":  return { id, type };
    case "highlights": return { id, type, icons: [...DEFAULT_HIGHLIGHT_ICONS], labels: [...DEFAULT_HIGHLIGHT_LABELS] };
    case "gallery":  return { id, type, images: ["", "", ""] };
    case "validity": return { id, type };
    case "cta":      return { id, type, content: DEFAULT_BUTTON };
    case "divider":  return { id, type };
  }
}
