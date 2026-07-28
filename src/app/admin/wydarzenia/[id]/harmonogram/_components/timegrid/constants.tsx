import React from "react";
import type { TripEventType } from "@/generated/prisma";
import {
  ForkKnife,
  Lightning,
  Leaf,
  Megaphone,
  CalendarBlank,
  Sparkle,
  Coffee,
  Barbell,
  Sun,
} from "@phosphor-icons/react/dist/ssr";

export const HOUR_HEIGHT = 80;
export const HOURS = Array.from({ length: 24 }, (_, i) => i);
export const DAYS_TO_SHOW = 3;

export const TYPE_STYLE: Record<
  TripEventType,
  { bg: string; border: string; text: string; defaultIcon: React.ReactNode }
> = {
  GENERAL: {
    bg: "bg-white hover:bg-gray-50",
    border: "border-l-gray-400 border-y-gray-200 border-r-gray-200",
    text: "text-brand-secondary",
    defaultIcon: <CalendarBlank size={14} weight="bold" />,
  },
  MEAL: {
    bg: "bg-orange-50 hover:bg-orange-100",
    border: "border-l-orange-500 border-y-orange-200/50 border-r-orange-200/50",
    text: "text-orange-900",
    defaultIcon: <ForkKnife size={14} weight="bold" />,
  },
  ACTIVITY: {
    bg: "bg-brand-primary/5 hover:bg-brand-primary/10",
    border:
      "border-l-brand-primary border-y-brand-primary/20 border-r-brand-primary/20",
    text: "text-brand-secondary",
    defaultIcon: <Lightning size={14} weight="bold" />,
  },
  WELLNESS_FREE: {
    bg: "bg-emerald-50 hover:bg-emerald-100",
    border:
      "border-l-emerald-500 border-y-emerald-200/50 border-r-emerald-200/50",
    text: "text-emerald-900",
    defaultIcon: <Leaf size={14} weight="bold" />,
  },
  ANNOUNCEMENT: {
    bg: "bg-amber-50 hover:bg-amber-100",
    border: "border-l-amber-500 border-y-amber-200/50 border-r-amber-200/50",
    text: "text-amber-900",
    defaultIcon: <Megaphone size={14} weight="bold" />,
  },
};

export const ICON_OPTIONS: {
  value: string;
  label: string;
  node: React.ReactNode;
}[] = [
  {
    value: "ForkKnife",
    label: "Posiłek",
    node: <ForkKnife size={20} weight="duotone" />,
  },
  {
    value: "Coffee",
    label: "Kawa",
    node: <Coffee size={20} weight="duotone" />,
  },
  {
    value: "Barbell",
    label: "Sport",
    node: <Barbell size={20} weight="duotone" />,
  },
  {
    value: "Lightning",
    label: "Energia",
    node: <Lightning size={20} weight="duotone" />,
  },
  { value: "Leaf", label: "Relaks", node: <Leaf size={20} weight="duotone" /> },
  {
    value: "Sparkle",
    label: "Spa",
    node: <Sparkle size={20} weight="duotone" />,
  },
  { value: "Sun", label: "Plener", node: <Sun size={20} weight="duotone" /> },
  {
    value: "Megaphone",
    label: "Ogłoszenie",
    node: <Megaphone size={20} weight="duotone" />,
  },
  {
    value: "CalendarBlank",
    label: "Ogólne",
    node: <CalendarBlank size={20} weight="duotone" />,
  },
];

export function iconNodeFor(name: string | null): React.ReactNode | null {
  if (!name) return null;
  return ICON_OPTIONS.find((i) => i.value === name)?.node ?? null;
}
