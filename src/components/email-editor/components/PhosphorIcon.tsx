"use client";

import { Sparkle } from "@phosphor-icons/react/dist/ssr";
import { ICON_COMPONENTS } from "../lib/constants";

interface PhosphorIconProps {
  name: string;
  size?: number;
  weight?: "thin" | "light" | "regular" | "bold" | "fill" | "duotone";
  color?: string;
}

export default function PhosphorIcon({ name, size = 24, weight = "duotone", color }: PhosphorIconProps) {
  const C = ICON_COMPONENTS[name] ?? Sparkle;
  return <C size={size} weight={weight} color={color} />;
}

