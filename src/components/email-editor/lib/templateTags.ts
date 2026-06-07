// Czyste dane szablonów e-mail — BEZ "use client" i bez Reacta,
// żeby można było ich bezpiecznie używać też po stronie serwera (np. wysyłka Resend).
import type { TagDef } from "./types";

export const DEFAULT_TITLE = "Pakuj walizki!";
export const DEFAULT_SUBJECT = "Zaproszenie na wspólny wyjazd Rehability ✈️";
export const DEFAULT_BODY =
  "Cześć {inviteeName},\n\nTwoja znajoma {inviterName} serdecznie zaprasza Cię do wspólnego udziału w wyjeździe {campName}.\n\nCzeka na Was wspaniały czas, relaks, świetne jedzenie i niezapomniane wspomnienia!";
export const DEFAULT_BUTTON = "Zobacz szczegóły i dołącz";
export const DEFAULT_HIGHLIGHT_ICONS = ["FlowerLotus", "ForkKnife", "Sparkle"];
export const DEFAULT_HIGHLIGHT_LABELS = ["Relaks i SPA", "Pyszne jedzenie", "Wspólne chwile"];

export const TEMPLATE_TAGS: TagDef[] = [
  {
    name: "inviterName",
    label: "Imię zapraszającej",
    bg: "rgba(40,125,136,0.12)",
    color: "#287d88",
    border: "rgba(40,125,136,0.35)",
  },
  {
    name: "campName",
    label: "Nazwa wyjazdu",
    bg: "rgba(3,63,99,0.1)",
    color: "#033f63",
    border: "rgba(3,63,99,0.25)",
  },
  {
    name: "inviteeName",
    label: "Imię zaproszonej",
    bg: "rgba(190,24,93,0.09)",
    color: "#be185d",
    border: "rgba(190,24,93,0.28)",
  },
];
