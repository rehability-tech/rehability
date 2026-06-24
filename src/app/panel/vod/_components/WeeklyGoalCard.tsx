import { Target } from "@phosphor-icons/react/dist/ssr";

export function WeeklyGoalCard({ done, goal }: { done: number; goal: number }) {
  const capped = Math.min(done, goal);
  const pct = goal ? Math.round((capped / goal) * 100) : 0;
  const remaining = Math.max(0, goal - done);
  return (
    <div className="relative overflow-hidden rounded-3xl rounded-tr-none bg-white/60 backdrop-blur-2xl border border-white/50 shadow-[0_20px_60px_-30px_rgba(3,63,99,0.3)] p-6 h-full flex flex-col">
      <div className="pointer-events-none absolute -top-12 -right-10 w-44 h-44 rounded-full bg-brand-yellow/20 blur-[70px]" />
      <div className="flex items-center gap-2 mb-4">
        <Target size={18} weight="duotone" className="text-brand-primary" />
        <h3 className="font-jakarta font-bold text-[15px] text-brand-secondary">
          Cel nauki
        </h3>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center">
        <div
          className="relative size-32 rounded-full grid place-items-center"
          style={{
            background: `conic-gradient(#287d88 ${pct * 3.6}deg, rgba(3,63,99,0.08) 0deg)`,
          }}
        >
          <div className="size-[104px] rounded-full bg-white grid place-items-center shadow-inner">
            <div className="text-center leading-none">
              <p className="font-jakarta font-bold text-[26px] text-brand-secondary">
                {done}
                <span className="text-brand-secondary/30 text-[18px]">
                  /{goal}
                </span>
              </p>
              <p className="font-montserrat text-[11px] text-brand-secondary/50 mt-1">
                lekcji
              </p>
            </div>
          </div>
        </div>
        <p className="font-montserrat text-[12.5px] text-brand-secondary/55 text-center mt-4 max-w-[200px]">
          {remaining > 0 ? (
            <>
              Jeszcze{" "}
              <span className="font-bold text-brand-primary">{remaining}</span>{" "}
              {remaining === 1 ? "lekcja" : "lekcje"} do celu. Tak trzymaj! 🔥
            </>
          ) : (
            <>Cel osiągnięty — świetna robota! 🎉</>
          )}
        </p>
      </div>
    </div>
  );
}
