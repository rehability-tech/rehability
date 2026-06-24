import { Trophy, Sparkle, Lock } from "@phosphor-icons/react/dist/ssr";
import type { Achievement } from "./lib/gamification";

const ACH_TINT: Record<string, string> = {
  yellow: "bg-brand-yellow/20 text-amber-600 border-brand-yellow/30",
  rose: "bg-rose-100 text-rose-500 border-rose-200",
  primary: "bg-brand-primary/10 text-brand-primary border-brand-primary/20",
  muted: "bg-brand-secondary/5 text-brand-secondary/30 border-brand-secondary/10",
};

export function AchievementsCard({
  g,
  achievements,
}: {
  g: { level: number; xp: number; xpToNext: number };
  achievements: readonly Achievement[];
}) {
  const xpPct = Math.round((g.xp / g.xpToNext) * 100);
  return (
    <div className="relative overflow-hidden rounded-3xl rounded-tr-none bg-white/60 backdrop-blur-2xl border border-white/50 shadow-[0_20px_60px_-30px_rgba(3,63,99,0.3)] p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
        <div className="flex items-center gap-2">
          <Trophy size={18} weight="duotone" className="text-brand-primary" />
          <h3 className="font-jakarta font-bold text-[16px] text-brand-secondary">
            Twoje osiągnięcia
          </h3>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-[280px]">
          <span className="inline-flex items-center gap-1.5 shrink-0 text-[12px] font-bold text-brand-primary bg-brand-primary/10 border border-brand-primary/15 rounded-full px-3 py-1">
            <Sparkle size={13} weight="fill" />
            Poziom {g.level}
          </span>
          <div className="flex-1">
            <div className="h-2 w-full rounded-full bg-brand-secondary/10 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-brand-primary to-brand-yellow"
                style={{ width: `${xpPct}%` }}
              />
            </div>
            <p className="font-montserrat text-[10.5px] text-brand-secondary/45 mt-1 text-right">
              {g.xp} / {g.xpToNext} XP
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-5 gap-1.5 sm:gap-2">
        {achievements.map(({ icon: Icon, label, unlocked, tint }) => (
          <div
            key={label}
            className="flex flex-col items-center gap-2 min-w-0 text-center"
          >
            <span
              className={`relative flex items-center justify-center size-12 sm:size-14 rounded-2xl rounded-tr-none border ${ACH_TINT[unlocked ? tint : "muted"]}`}
            >
              <Icon size={24} weight={unlocked ? "fill" : "regular"} />
              {!unlocked && (
                <span className="absolute -top-1.5 -right-1.5 flex items-center justify-center size-5 rounded-full bg-brand-secondary/70 text-white">
                  <Lock size={10} weight="fill" />
                </span>
              )}
            </span>
            <span
              className={`font-montserrat text-[10px] sm:text-[11px] leading-tight ${
                unlocked
                  ? "text-brand-secondary/70 font-semibold"
                  : "text-brand-secondary/35"
              }`}
            >
              {label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
