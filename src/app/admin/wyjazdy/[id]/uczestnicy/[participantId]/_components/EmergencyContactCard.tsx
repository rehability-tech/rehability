"use client";

import { ShieldWarning, Phone } from "@phosphor-icons/react/dist/ssr";
import { cn } from "@/lib/utils";

export const EmergencyContactCard = ({ health }: { health: any }) => {
  const name = health?.emergencyName || "Brak danych";
  const phone = health?.emergencyPhone || "Brak telefonu";
  console.log(health);

  return (
    <div className="relative bg-white/70 backdrop-blur-xl border border-rose-100/60 rounded-[24px] p-5 sm:p-6 shadow-[0_8px_30px_-12px_rgba(225,29,72,0.08)] overflow-hidden flex items-center justify-between gap-4">
      {/* Subtelny glow alarmowy w tle */}
      <div className="absolute -left-8 -top-8 w-32 h-32 bg-rose-400/10 blur-[50px] rounded-full pointer-events-none" />

      <div className="relative z-10 flex items-center gap-4">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-rose-50 to-rose-100/50 text-rose-500 border border-rose-100 flex items-center justify-center shrink-0 shadow-[inset_0_2px_10px_-2px_rgba(225,29,72,0.1)]">
          <ShieldWarning size={24} weight="duotone" />
        </div>
        <div className="flex flex-col min-w-0">
          <span className="text-[10px] font-bold uppercase tracking-widest text-rose-500/70 mb-0.5">
            Kontakt Alarmowy
          </span>
          <span className="text-[15px] font-bold text-brand-secondary truncate">
            {name}
          </span>
        </div>
      </div>

      <div className="relative z-10 shrink-0">
        <a
          href={
            phone !== "Brak telefonu" ? `tel:${phone.replace(/\s+/g, "")}` : "#"
          }
          className={cn(
            "flex items-center gap-2 px-4 py-2.5 rounded-xl border transition-all duration-300 font-semibold text-[13px] shadow-sm",
            phone !== "Brak telefonu"
              ? "bg-white border-rose-100 hover:border-rose-300 hover:shadow-md text-brand-secondary hover:text-rose-600 active:scale-95"
              : "bg-gray-50 border-transparent text-gray-400 cursor-not-allowed grayscale",
          )}
        >
          <Phone
            size={16}
            weight={phone !== "Brak telefonu" ? "duotone" : "regular"}
          />
          <span className="hidden sm:inline-block">{phone}</span>
        </a>
      </div>
    </div>
  );
};
