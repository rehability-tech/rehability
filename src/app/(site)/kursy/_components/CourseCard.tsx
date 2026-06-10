"use client";

import Image from "next/image";
import Link from "next/link";
import {
  Star,
  Clock,
  BookmarkSimple,
} from "@phosphor-icons/react/dist/ssr";
import type { Course } from "../_data/courses";

export function CourseCard({ course }: { course: Course }) {
  return (
    <article className="group relative flex flex-col bg-white rounded-2xl p-3 shadow-[0_18px_45px_-28px_rgba(3,63,99,0.4)] ring-1 ring-brand-secondary/[0.04] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_28px_55px_-26px_rgba(3,63,99,0.5)]">
      {/* MINIATURA */}
      <div className="relative h-[185px] w-full rounded-xl overflow-hidden">
        <Image
          src={course.image}
          alt={course.title}
          fill
          sizes="(max-width: 768px) 100vw, 360px"
          className="object-cover"
        />
        {/* Overlay: kategoria + zakładka */}
        <div className="absolute inset-x-0 top-0 flex items-center justify-between p-2">
          <span className="bg-brand-primary text-white font-montserrat font-medium text-[12px] uppercase px-2.5 py-[5px] rounded-full">
            {course.category}
          </span>
          <button
            type="button"
            aria-label="Zapisz program"
            className="flex items-center justify-center size-[30px] rounded-full bg-white/90 text-brand-primary backdrop-blur-sm transition-colors hover:bg-white"
          >
            <BookmarkSimple size={16} weight="bold" />
          </button>
        </div>
      </div>

      {/* TREŚĆ */}
      <div className="flex flex-col gap-3 flex-1 px-1 pt-4">
        {/* Ocena */}
        <div className="flex items-center gap-1">
          <Star size={16} weight="fill" className="text-brand-yellow" />
          <span className="font-montserrat font-medium text-[12px] text-black/50">
            {course.rating.toFixed(1)} ({course.reviews})
          </span>
        </div>

        {/* Tytuł */}
        <h3 className="font-montserrat font-bold text-brand-secondary text-[16px] leading-snug line-clamp-2 min-h-[44px]">
          {course.title}
        </h3>

        {/* Czas trwania */}
        <div className="flex items-center gap-1.5">
          <Clock size={20} weight="duotone" className="text-brand-primary" />
          <span className="font-montserrat font-medium text-[12px] text-black/50">
            {course.durationMin} min
          </span>
        </div>

        <div className="h-px w-full bg-brand-secondary/10" />

        {/* Cena + CTA */}
        <div className="mt-auto flex items-center justify-between pt-1">
          <span className="font-montserrat font-bold text-brand-primary text-[16px]">
            {course.price} PLN
          </span>
          <Link
            href={`/kursy/${course.slug}`}
            className="bg-brand-primary text-white font-montserrat font-semibold text-[13px] px-3 py-2 rounded-xl rounded-tr-none transition-colors hover:bg-brand-secondary"
          >
            Otrzymaj dostęp
          </Link>
        </div>
      </div>
    </article>
  );
}
