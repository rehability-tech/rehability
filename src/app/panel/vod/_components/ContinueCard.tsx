import Image from "next/image";
import Link from "next/link";
import { PlayCircle, Clock, Star } from "@phosphor-icons/react/dist/ssr";
import {
  formatCourseDuration,
  type Course,
} from "@/app/(site)/kursy/_data/courses";

export function ContinueCard({
  course,
  progress,
}: {
  course: Course;
  progress: number;
}) {
  return (
    <div className="relative overflow-hidden rounded-3xl rounded-tr-none bg-white/60 backdrop-blur-2xl border border-white/50 shadow-[0_20px_60px_-30px_rgba(3,63,99,0.3)] h-full">
      <div className="grid sm:grid-cols-[240px_1fr] h-full">
        <Link
          href={`/panel/vod/${course.slug}`}
          className="group relative block aspect-video sm:aspect-auto sm:h-full min-h-[180px] overflow-hidden"
        >
          <Image
            src={course.image}
            alt={course.title}
            fill
            sizes="(max-width: 640px) 100vw, 240px"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-brand-secondary/70 via-brand-secondary/10 to-transparent" />
          <span className="absolute inset-0 flex items-center justify-center">
            <span className="flex items-center justify-center size-14 rounded-full bg-white/90 backdrop-blur-md text-brand-primary shadow-xl group-hover:scale-110 transition-transform">
              <PlayCircle size={34} weight="fill" />
            </span>
          </span>
        </Link>

        <div className="p-5 md:p-6 flex flex-col justify-center">
          <span className="inline-flex items-center gap-1.5 self-start text-[10px] font-bold uppercase tracking-[0.18em] text-brand-primary bg-brand-primary/10 border border-brand-primary/15 rounded-full px-3 py-1 mb-3">
            <PlayCircle size={13} weight="fill" />
            Kontynuuj oglądanie
          </span>
          <h3 className="font-jakarta font-bold text-[18px] md:text-[20px] text-brand-secondary leading-tight line-clamp-2">
            {course.title}
          </h3>
          <div className="flex items-center gap-3 mt-2 text-[12px] font-montserrat text-brand-secondary/50">
            <span className="inline-flex items-center gap-1">
              <Clock size={14} weight="duotone" className="text-brand-primary" />
              {formatCourseDuration(course.durationMin)}
            </span>
            <span className="inline-flex items-center gap-1">
              <Star size={14} weight="fill" className="text-brand-yellow" />
              {course.reviews > 0 ? course.rating.toFixed(1) : "Nowość"}
            </span>
          </div>

          <div className="mt-4">
            <div className="flex items-center justify-between text-[12px] font-montserrat mb-1.5">
              <span className="text-brand-secondary/60 font-semibold">
                Postęp kursu
              </span>
              <span className="text-brand-primary font-bold">{progress}%</span>
            </div>
            <div className="h-2 w-full rounded-full bg-brand-secondary/10 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-brand-primary to-brand-yellow"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          <Link
            href={`/panel/vod/${course.slug}`}
            className="group relative self-start inline-flex items-center gap-2 mt-5 bg-brand-primary text-white font-montserrat font-bold text-[14px] px-6 py-3 rounded-2xl rounded-tr-[3px] border border-brand-yellow/30 shadow-[0_8px_22px_-6px_rgba(40,125,136,0.5)] hover:shadow-[0_10px_26px_0px_rgba(242,217,103,0.45)] transition-all overflow-hidden"
          >
            <span className="pointer-events-none absolute -right-2 -bottom-2 size-9 rounded-full bg-brand-yellow/50 blur-[12px]" />
            <span className="relative inline-flex items-center gap-2">
              <PlayCircle size={18} weight="fill" />
              Wznów trening
            </span>
          </Link>
        </div>
      </div>
    </div>
  );
}
