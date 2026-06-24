import Image from "next/image";
import Link from "next/link";
import {
  Fire,
  ArrowRight,
  PlayCircle,
  Star,
  Sparkle,
} from "@phosphor-icons/react/dist/ssr";
import type { Course } from "@/app/(site)/kursy/_data/courses";

// Lista zawsze trzyma min. tyle pozycji — brakujące dopełniamy placeholderami,
// żeby karta wyglądała spójnie nawet przy 1–2 kursach na start.
const MIN_ROWS = 3;
const PLACEHOLDER_TITLES = [
  "Nowy kurs już wkrótce",
  "Kolejny program w drodze",
  "Więcej treści w przygotowaniu",
];

export function PopularThisWeek({ items }: { items: Course[] }) {
  const placeholderCount = Math.max(0, MIN_ROWS - items.length);

  return (
    <div className="relative overflow-hidden rounded-3xl rounded-tr-none bg-white/60 backdrop-blur-2xl border border-white/50 shadow-[0_20px_60px_-30px_rgba(3,63,99,0.3)] p-6 h-full flex flex-col">
      <div className="pointer-events-none absolute -top-12 -right-10 w-44 h-44 rounded-full bg-brand-primary/15 blur-[70px]" />
      <div className="flex items-center justify-between gap-3 mb-5">
        <div className="flex items-center gap-2">
          <Fire size={18} weight="fill" className="text-rose-500" />
          <h3 className="font-jakarta font-bold text-[16px] text-brand-secondary">
            Popularne w tym tygodniu
          </h3>
        </div>
        <Link
          href="/kursy"
          className="group hidden sm:inline-flex items-center gap-1.5 text-[12.5px] font-bold text-brand-primary hover:gap-2.5 transition-all"
        >
          Zobacz wszystkie
          <ArrowRight size={14} weight="bold" />
        </Link>
      </div>

      <div className="flex flex-col gap-1 flex-1">
        {items.map((course, i) => (
          <Link
            key={course.id}
            href={`/kursy/${course.slug}`}
            className="group flex items-center gap-3 rounded-2xl rounded-tr-none p-2.5 hover:bg-white/60 transition-colors border-b border-brand-secondary/5 last:border-0"
          >
            <span
              className={`flex items-center justify-center size-6 shrink-0 rounded-full font-jakarta font-bold text-[12px] ${
                i === 0
                  ? "bg-brand-yellow/30 text-amber-600"
                  : "bg-brand-primary/10 text-brand-primary/70"
              }`}
            >
              {i + 1}
            </span>
            <div className="relative size-12 shrink-0 rounded-xl rounded-tr-none overflow-hidden">
              <Image
                src={course.image}
                alt={course.title}
                fill
                sizes="48px"
                className="object-cover"
              />
              <span className="absolute inset-0 flex items-center justify-center bg-brand-secondary/30 opacity-0 group-hover:opacity-100 transition-opacity">
                <PlayCircle size={20} weight="fill" className="text-white" />
              </span>
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-montserrat font-semibold text-[13px] text-brand-secondary leading-snug line-clamp-1">
                {course.title}
              </p>
              <div className="flex items-center gap-2 mt-0.5 text-[11px] font-montserrat text-brand-secondary/45">
                {course.reviews > 0 ? (
                  <>
                    <span className="inline-flex items-center gap-1">
                      <Star size={11} weight="fill" className="text-brand-yellow" />
                      {course.rating.toFixed(1)}
                    </span>
                    <span>·</span>
                    <span>{course.reviews} opinii</span>
                  </>
                ) : (
                  <span className="inline-flex items-center gap-1">
                    <Star size={11} weight="fill" className="text-brand-yellow" />
                    Nowość
                  </span>
                )}
              </div>
            </div>
          </Link>
        ))}

        {/* Placeholdery „w przygotowaniu" — dopełniają listę do min. wysokości */}
        {Array.from({ length: placeholderCount }).map((_, idx) => (
          <div
            key={`ph-${idx}`}
            className="flex items-center gap-3 rounded-2xl rounded-tr-none p-2.5 border-b border-brand-secondary/5 last:border-0 select-none"
          >
            <span className="flex items-center justify-center size-6 shrink-0 rounded-full border border-dashed border-brand-secondary/20 text-brand-secondary/30">
              <Sparkle size={12} weight="duotone" />
            </span>
            <div className="relative size-12 shrink-0 rounded-xl rounded-tr-none border border-dashed border-brand-secondary/15 bg-brand-secondary/[0.03] grid place-items-center text-brand-secondary/25">
              <Sparkle size={18} weight="duotone" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-montserrat font-semibold text-[13px] text-brand-secondary/45 leading-snug line-clamp-1">
                {PLACEHOLDER_TITLES[idx % PLACEHOLDER_TITLES.length]}
              </p>
              <span className="inline-flex items-center mt-1 text-[9.5px] font-bold uppercase tracking-[0.14em] text-brand-primary/60 bg-brand-primary/[0.06] border border-brand-primary/10 rounded-full px-2 py-0.5">
                W przygotowaniu
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
