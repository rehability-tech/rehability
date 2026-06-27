import { Wrench } from "@phosphor-icons/react/dist/ssr";

// Nakładka „już wkrótce" — przykrywa moduł, który nie jest jeszcze dostępny
// (np. certyfikaty). Treść pod spodem zostaje jako podgląd (rozmyta, nieaktywna).
export function ComingSoon({
  active,
  label = "Ten moduł nie jest jeszcze dostępny",
  children,
}: {
  active: boolean;
  label?: string;
  children: React.ReactNode;
}) {
  if (!active) return <>{children}</>;
  return (
    <div className="relative">
      <div className="pointer-events-none select-none blur-[3px] opacity-50">
        {children}
      </div>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center gap-2.5 rounded-3xl rounded-tr-none bg-white/45 backdrop-blur-[2px] p-6">
        <span className="relative flex items-center justify-center size-12 rounded-2xl rounded-tr-none bg-brand-primary text-white shadow-[0_8px_22px_-6px_rgba(40,125,136,0.6)]">
          <span className="pointer-events-none absolute -right-1 -bottom-1 size-6 rounded-full bg-brand-yellow/50 blur-[10px]" />
          <Wrench size={22} weight="fill" className="relative" />
        </span>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-yellow/20 border border-brand-yellow/40 px-3 py-1 font-montserrat font-bold text-[11px] uppercase tracking-wider text-amber-700">
          Już wkrótce
        </span>
        <p className="font-jakarta font-bold text-[14.5px] text-brand-secondary max-w-[240px] leading-snug">
          {label}
        </p>
      </div>
    </div>
  );
}
