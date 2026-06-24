import Image from "next/image";
import Link from "next/link";
import {
  PlayCircle,
  Clock,
  CheckCircle,
  Sparkle,
  Lock,
  ArrowRight,
} from "@phosphor-icons/react/dist/ssr";
import {
  formatCourseDuration,
  type Course,
} from "@/app/(site)/kursy/_data/courses";

export function LibraryCard({
  course,
  progress,
  owned = true,
}: {
  course: Course;
  progress?: number;
  /** Czy użytkownik ma dostęp. Gdy false → karta „do kupienia". */
  owned?: boolean;
}) {
  const done = (progress ?? 0) >= 100;
  // Posiadane → odtwarzacz; do kupienia → strona kursu (zakup z aplikacji).
  const href = owned ? `/panel/vod/${course.slug}` : `/kursy/${course.slug}`;

  return (
    <Link
      href={href}
      className="group relative flex flex-col rounded-[24px] rounded-tr-none bg-white/60 backdrop-blur-xl border border-white/50 shadow-[0_16px_45px_-28px_rgba(3,63,99,0.35)] overflow-hidden hover:-translate-y-0.5 transition-all"
    >
      <div className="relative h-[150px] overflow-hidden">
        <Image
          src={course.image}
          alt={course.title}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw"
          className={`object-cover transition-transform duration-500 group-hover:scale-105 ${
            owned ? "" : "saturate-[0.9]"
          }`}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-brand-secondary/70 via-brand-secondary/10 to-transparent" />
        <span className="absolute top-3 left-3 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-white/80 backdrop-blur-md text-brand-secondary border border-white/40">
          {course.category}
        </span>

        {owned && done && (
          <span className="absolute top-3 right-3 inline-flex items-center gap-1 text-[10px] font-bold text-white bg-emerald-500/90 px-2 py-1 rounded-full">
            <CheckCircle size={12} weight="fill" />
            Ukończony
          </span>
        )}
        {!owned && (
          <span className="absolute top-3 right-3 inline-flex items-center gap-1 text-[10px] font-bold text-brand-secondary bg-brand-yellow/85 px-2 py-1 rounded-full">
            <Lock size={11} weight="fill" />
            Do kupienia
          </span>
        )}

        <span className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          <span className="flex items-center justify-center size-12 rounded-full bg-white/90 text-brand-primary shadow-xl">
            <PlayCircle size={28} weight="fill" />
          </span>
        </span>

        {owned && (
          <span className="absolute bottom-3 right-3 inline-flex items-center gap-1 text-white text-[11px] font-semibold bg-black/30 backdrop-blur-md px-2 py-0.5 rounded-full">
            <Clock size={11} weight="fill" />
            {formatCourseDuration(course.durationMin)}
          </span>
        )}
      </div>

      <div className="flex flex-col flex-1 p-4 gap-2">
        <h3 className="font-jakarta font-bold text-[15px] text-brand-secondary leading-snug line-clamp-2 min-h-[40px]">
          {course.title}
        </h3>

        {owned ? (
          progress !== undefined ? (
            <div className="mt-auto">
              <div className="h-1.5 w-full rounded-full bg-brand-secondary/10 overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-brand-primary to-brand-yellow"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <span className="text-[11px] font-montserrat font-semibold text-brand-primary mt-1.5 inline-block">
                {done ? "Obejrzano w całości" : `Obejrzano ${progress}%`}
              </span>
            </div>
          ) : (
            <span className="mt-auto inline-flex items-center gap-1.5 text-[12px] font-montserrat font-semibold text-brand-secondary/50">
              <Sparkle size={13} weight="fill" className="text-brand-yellow" />
              Nowy w bibliotece
            </span>
          )
        ) : (
          <div className="mt-auto flex items-center justify-between gap-2">
            <span className="font-jakarta font-bold text-[16px] text-brand-secondary">
              {course.price} zł
            </span>
            <span className="inline-flex items-center gap-1 text-[12.5px] font-montserrat font-bold text-brand-primary group-hover:gap-2 transition-all">
              Poznaj szczegóły
              <ArrowRight size={14} weight="bold" />
            </span>
          </div>
        )}
      </div>
    </Link>
  );
}
