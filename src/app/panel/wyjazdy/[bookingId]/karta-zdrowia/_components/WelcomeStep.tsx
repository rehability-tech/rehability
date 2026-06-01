"use client";

import { Heartbeat } from "@phosphor-icons/react/dist/ssr";

export default function WelcomeStep() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center text-center py-10">
      <div className="relative w-20 h-20 bg-brand-primary/10 rounded-3xl flex items-center justify-center mb-6">
        <div className="absolute inset-0 bg-brand-yellow/20 rounded-[32px] blur-xl" />
        <Heartbeat
          size={40}
          weight="duotone"
          className="text-brand-primary relative z-10"
        />
      </div>
      <h1 className="font-jakarta font-bold text-2xl text-brand-secondary mb-3">
        Karta Zdrowia
      </h1>
      <p className="text-[14px] text-brand-secondary/60 leading-relaxed max-w-[280px]">
        Zanim wyruszymy w drogę, musimy poznać Twoje potrzeby dietetyczne i
        upewnić się co do stanu zdrowia.
        <br />
        <br />
        <strong className="text-brand-primary font-semibold">
          Zajmie to dosłownie 2 minuty.
        </strong>
      </p>
    </div>
  );
}
