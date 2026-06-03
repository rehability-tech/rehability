"use client";

import React from "react";
import { motion, useReducedMotion } from "framer-motion";

type Tag = "div" | "section" | "article" | "li" | "span" | "p" | "h1";

type RevealProps = {
  children: React.ReactNode;
  className?: string;
  /** Opóźnienie startu animacji (s) — do efektu kaskadowego. */
  delay?: number;
  /** Przesunięcie w pionie na starcie (px). */
  y?: number;
  /** Tag renderowanego elementu. */
  as?: Tag;
  /** true = animuje od razu po wejściu (hero), false = przy scrollu. */
  immediate?: boolean;
};

/**
 * Lekki wrapper animacji wejścia.
 * - Animuje WYŁĄCZNIE opacity + transform (warstwa kompozytora, brak reflow).
 * - Poniżej "folda" odpala się raz przy scrollu (whileInView + once).
 * - Szanuje prefers-reduced-motion (pomija ruch, zostaje delikatny fade).
 */
export function Reveal({
  children,
  className,
  delay = 0,
  y = 20,
  as = "div",
  immediate = false,
}: RevealProps) {
  const reduce = useReducedMotion();
  const MotionTag = motion[as];

  const hidden = reduce ? { opacity: 0 } : { opacity: 0, y };
  const shown = { opacity: 1, y: 0 };

  const trigger = immediate
    ? { initial: hidden, animate: shown }
    : {
        initial: hidden,
        whileInView: shown,
        viewport: { once: true, margin: "-80px" },
      };

  return (
    <MotionTag
      {...trigger}
      transition={{ duration: 0.55, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
      style={{ willChange: "transform, opacity" }}
    >
      {children}
    </MotionTag>
  );
}
