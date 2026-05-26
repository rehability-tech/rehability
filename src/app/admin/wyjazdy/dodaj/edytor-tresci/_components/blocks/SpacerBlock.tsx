"use client";

import React from "react";

export default function SpacerBlock() {
  return (
    <div className="w-full flex items-center justify-center h-16 border border-dashed border-brand-primary/20 rounded-lg bg-brand-primary/[0.02]">
      <span className="text-[10px] uppercase font-bold tracking-widest text-brand-primary/40">
        Przerwa wizualna
      </span>
    </div>
  );
}
