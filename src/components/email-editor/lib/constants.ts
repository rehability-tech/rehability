"use client";

import React from "react";
import {
  Heart, Heartbeat, Leaf, Sun, Sparkle, Mountains, Tree, Coffee, Waves, Star,
  Moon, Bed, Campfire, Drop, Wind, Snowflake, MusicNotes, PersonSimpleRun,
  FlowerLotus, ForkKnife, HandsPraying, Crown, Flower, SmileyWink,
} from "@phosphor-icons/react/dist/ssr";

// Czyste dane (TEMPLATE_TAGS, DEFAULT_*) żyją w osobnym module bez "use client",
// aby były bezpieczne po stronie serwera. Tu tylko re-eksport dla zgodności importów.
export {
  DEFAULT_TITLE,
  DEFAULT_SUBJECT,
  DEFAULT_BODY,
  DEFAULT_BUTTON,
  DEFAULT_HIGHLIGHT_ICONS,
  DEFAULT_HIGHLIGHT_LABELS,
  TEMPLATE_TAGS,
} from "./templateTags";

type PhosphorIconFC = React.FC<{
  size?: number;
  weight?: "thin" | "light" | "regular" | "bold" | "fill" | "duotone";
  color?: string;
}>;

export const ICON_COMPONENTS: Record<string, PhosphorIconFC> = {
  Heart, Heartbeat, Leaf, Sun, Sparkle, Mountains, Tree, Coffee, Waves, Star,
  Moon, Bed, Campfire, Drop, Wind, Snowflake, MusicNotes, PersonSimpleRun,
  FlowerLotus, ForkKnife, HandsPraying, Crown, Flower, SmileyWink,
};

export const ICON_OPTIONS: { name: string; label: string }[] = [
  { name: "Heart", label: "Serce" },
  { name: "Heartbeat", label: "Zdrowie" },
  { name: "Leaf", label: "Natura" },
  { name: "Sun", label: "Słońce" },
  { name: "Sparkle", label: "Magia" },
  { name: "Mountains", label: "Góry" },
  { name: "Tree", label: "Las" },
  { name: "Coffee", label: "Kawa" },
  { name: "Waves", label: "Morze" },
  { name: "Star", label: "Gwiazda" },
  { name: "Moon", label: "Wieczór" },
  { name: "Bed", label: "Nocleg" },
  { name: "Campfire", label: "Ognisko" },
  { name: "Drop", label: "Woda" },
  { name: "Wind", label: "Powietrze" },
  { name: "Snowflake", label: "Zima" },
  { name: "MusicNotes", label: "Muzyka" },
  { name: "PersonSimpleRun", label: "Ruch" },
  { name: "FlowerLotus", label: "Relaks" },
  { name: "ForkKnife", label: "Jedzenie" },
  { name: "HandsPraying", label: "Medytacja" },
  { name: "Crown", label: "Premium" },
  { name: "Flower", label: "Kwiat" },
  { name: "SmileyWink", label: "Zabawa" },
];
