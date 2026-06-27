export type Tint = "primary" | "emerald" | "violet" | "rose" | "yellow";

const TINTS: Record<Tint, { text: string }> = {
  primary: { text: "text-brand-primary" },
  emerald: { text: "text-emerald-600" },
  violet: { text: "text-violet-600" },
  rose: { text: "text-rose-500" },
  yellow: { text: "text-amber-600" },
};

export type StatItem = {
  icon: React.ElementType;
  value: string | number;
  /** Mianownik (np. „/4") dopisany szarym obok wartości — np. 1/4 kursów. */
  sub?: string | number;
  label: string;
  tint: Tint;
  /** Postęp 0–100 dla pierścienia wokół ikony. */
  pct: number;
};

const CARD_BASE =
  "rounded-[20px] rounded-tr-none bg-white/60 backdrop-blur-xl border border-white/50 shadow-[0_14px_40px_-30px_rgba(3,63,99,0.4)]";

export function StatCard({ item }: { item: StatItem }) {
  const { icon: Icon, value, sub, label, tint, pct } = item;
  const t = TINTS[tint];
  return (
    <div className={`flex items-center gap-3.5 ${CARD_BASE} p-4`}>
      <div
        className={`relative size-12 shrink-0 rounded-full grid place-items-center ${t.text}`}
        style={{
          background: `conic-gradient(currentColor ${pct * 3.6}deg, rgba(3,63,99,0.08) 0deg)`,
        }}
      >
        <div className={`size-9 rounded-full bg-white grid place-items-center ${t.text}`}>
          <Icon size={18} weight="fill" />
        </div>
      </div>
      <div className="min-w-0">
        <p className="font-jakarta font-bold text-[20px] text-brand-secondary leading-none">
          {value}
          {sub !== undefined && (
            <span className="text-brand-secondary/30 text-[14px] font-semibold">
              /{sub}
            </span>
          )}
        </p>
        <p className="font-montserrat text-[12px] text-brand-secondary/50 mt-1 truncate">
          {label}
        </p>
      </div>
    </div>
  );
}
