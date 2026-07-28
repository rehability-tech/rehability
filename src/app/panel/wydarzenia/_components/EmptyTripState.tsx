import Link from "next/link";
import { Tent, ArrowRight } from "@phosphor-icons/react/dist/ssr";

export default function EmptyTripState() {
  return (
    <div className="flex flex-col items-center justify-center text-center py-20 px-4 bg-white rounded-3xl border border-gray-100 shadow-sm mt-8">
      <div className="w-20 h-20 rounded-full bg-brand-primary/10 text-brand-primary flex items-center justify-center mb-6">
        <Tent size={40} weight="duotone" />
      </div>
      <h3 className="font-jakarta font-bold text-2xl text-brand-secondary mb-3">
        Brak aktywnych wydarzeń
      </h3>
      <p className="text-gray-500 max-w-md mx-auto mb-8">
        Nie masz jeszcze zarezerwowanego żadnego wydarzenia. Odkryj nasze
        nadchodzące wydarzenia i dołącz do społeczności Rehability!
      </p>
      <Link
        href="/wydarzenia"
        className="inline-flex items-center gap-2 px-6 py-3 bg-brand-primary text-white font-semibold rounded-xl hover:bg-brand-primary/90 transition shadow-[0_4px_15px_0px_rgba(40,125,136,0.35)]"
      >
        Przeglądaj wydarzenia <ArrowRight size={16} weight="bold" />
      </Link>
    </div>
  );
}
