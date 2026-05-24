"use client";

import { STATUS_DOT, STATUS_LABELS, Status } from "./types";

export default function StatusLegend() {
  return (
    <div className="flex flex-wrap items-center gap-x-5 gap-y-2 mt-4 px-1">
      {(Object.keys(STATUS_LABELS) as Status[]).map((s) => (
        <div key={s} className="flex items-center gap-1.5">
          <span className={`w-2 h-2 rounded-full ${STATUS_DOT[s]}`} />
          <span className="text-[11px] text-gray-500 font-montserrat">{STATUS_LABELS[s]}</span>
        </div>
      ))}
    </div>
  );
}
