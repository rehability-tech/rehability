"use client";

import React from "react";
import {
  Heart, Heartbeat, Leaf, Sun, Sparkle, Mountains, Tree, Coffee, Waves, Star,
  Moon, Bed, Campfire, Drop, Wind, Snowflake, MusicNotes, PersonSimpleRun,
  FlowerLotus, ForkKnife, HandsPraying, Crown, Flower, SmileyWink,
} from "@phosphor-icons/react/dist/ssr";
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
