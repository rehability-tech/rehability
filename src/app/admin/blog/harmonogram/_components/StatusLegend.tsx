"use client";

import { STATUS_DOT, STATUS_LABELS, Status } from "./types";

export default function StatusLegend() {
  return (
    <div className="flex flex-wrap items-center gap-2 px-1">
      <span className="text-[10px] font-bold uppercase tracking-widest text-brand-secondary/40 font-montserrat mr-1">
        Legenda
      </span>
      {(Object.keys(STATUS_LABELS) as Status[]).map((s) => (
        <span
          key={s}
          className="inline-flex items-center gap-1.5 bg-white/60 backdrop-blur-md border border-white/70 rounded-full px-2.5 py-1 shadow-[0_4px_14px_-8px_rgba(3,63,99,0.3)]"
        >
          <span className={`w-2 h-2 rounded-full ${STATUS_DOT[s]}`} />
          <span className="text-[11px] font-montserrat font-medium text-brand-secondary/70">
            {STATUS_LABELS[s]}
          </span>
        </span>
      ))}
    </div>
  );
}
