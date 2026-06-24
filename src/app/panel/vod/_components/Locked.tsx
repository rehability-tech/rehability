import Link from "next/link";
import { Lock, ShoppingBag } from "@phosphor-icons/react/dist/ssr";

// Nakładka „kup, aby odblokować" — przykrywa zawartość w trybie locked.
export function Locked({
  active,
  children,
}: {
  active: boolean;
  children: React.ReactNode;
}) {
  if (!active) return <>{children}</>;
  return (
    <div className="relative">
      <div className="pointer-events-none select-none blur-[3px] opacity-50">
        {children}
      </div>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center gap-3 rounded-3xl rounded-tr-none bg-white/40 backdrop-blur-[2px] p-6">
        <span className="flex items-center justify-center size-12 rounded-2xl rounded-tr-none bg-brand-primary text-white shadow-[0_8px_22px_-6px_rgba(40,125,136,0.6)]">
          <Lock size={24} weight="fill" />
        </span>
        <p className="font-jakarta font-bold text-[15px] text-brand-secondary">
          Kup kurs, aby odblokować
        </p>
        <Link
          href="/kursy"
          className="inline-flex items-center gap-1.5 bg-brand-primary text-white font-montserrat font-bold text-[13px] px-4 py-2 rounded-xl rounded-tr-[3px] border border-brand-yellow/30 hover:shadow-[0_8px_22px_0px_rgba(242,217,103,0.45)] transition-all"
        >
          <ShoppingBag size={15} weight="duotone" />
          Przeglądaj kursy
        </Link>
      </div>
    </div>
  );
}
