"use client";

import Image, { type ImageProps } from "next/image";
import { useState } from "react";

/**
 * next/image z wbudowanym stanem ładowania.
 *
 * Pokazuje delikatny, pulsujący szkielet (w barwach brandu), dopóki zdjęcie się
 * nie załaduje, a potem płynnie je odsłania (fade-in). Eliminuje "puste miejsce"
 * i nagłe wskakiwanie obrazków.
 *
 * Uwaga: szkielet jest pozycjonowany absolutnie, więc używaj na elementach
 * `fill` (rodzic ma `position: relative`) — tak jak większość zdjęć w aplikacji.
 */
export default function ImageWithLoader({
  className,
  alt,
  onLoad,
  ...props
}: ImageProps) {
  const [loaded, setLoaded] = useState(false);

  return (
    <>
      {!loaded && (
        <div
          aria-hidden
          className="absolute inset-0 animate-pulse bg-gradient-to-br from-brand-primary/10 via-gray-100 to-brand-yellow/10"
        />
      )}
      <Image
        {...props}
        alt={alt}
        onLoad={(e) => {
          setLoaded(true);
          onLoad?.(e);
        }}
        className={`${className ?? ""} transition-opacity duration-500 ${
          loaded ? "opacity-100" : "opacity-0"
        }`}
      />
    </>
  );
}
