"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Star,
  Clock,
  ArrowRight,
  Heart,
  VideoCamera,
  LockSimpleOpen,
} from "@phosphor-icons/react/dist/ssr";
import { formatCourseDuration, type Course } from "../_data/courses";
import { useFavorites } from "@/app/_components/FavoritesProvider";

export function CourseCard({
  course,
  index = 0,
  owned = false,
}: {
  course: Course;
  index?: number;
  owned?: boolean;
}) {
  const { isFavorite, toggle } = useFavorites();
  const liked = isFavorite(course.id);
  const [heartHover, setHeartHover] = useState(false);

  const toggleLike = (e: React.MouseEvent) => {
    // Karta jest <Link> — blokujemy nawigację i propagację kliknięcia.
    e.preventDefault();
    e.stopPropagation();
    toggle(course.id);
  };

  return (
    <motion.article
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{
        duration: 0.55,
        delay: (index % 6) * 0.06,
        ease: [0.22, 0.61, 0.36, 1] as const,
      }}
      className="group h-full"
    >
      <Link
        href={`/kursy/${course.slug}`}
        className="relative flex flex-col h-full rounded-[28px] bg-white/70 backdrop-blur-xl border border-white/40 shadow-[0_20px_60px_-25px_rgba(3,63,99,0.25)] overflow-hidden"
      >
        {/* MINIATURA */}
        <div className="relative h-[210px] overflow-hidden">
          <Image
            src={course.image}
            alt={course.title}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw"
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-brand-secondary/70 via-brand-secondary/10 to-transparent" />

          {/* Kategoria + zakładka */}
          <div className="absolute top-4 left-4 right-4 flex items-start justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-white/80 backdrop-blur-md text-brand-secondary border border-white/40">
              {course.category}
            </span>
            <motion.button
              type="button"
              onClick={toggleLike}
              aria-pressed={liked}
              aria-label={liked ? "Usuń z polubionych" : "Dodaj do polubionych"}
              whileHover={{ scale: 1.15, rotate: -6 }}
              whileTap={{ scale: 0.8 }}
              onHoverStart={() => setHeartHover(true)}
              onHoverEnd={() => setHeartHover(false)}
              transition={{ type: "spring", stiffness: 400, damping: 15 }}
              className={`flex items-center justify-center size-8 rounded-full backdrop-blur-md border border-white/40 transition-colors ${
                liked || heartHover ? "bg-white" : "bg-white/80"
              }`}
            >
              <motion.span
                key={liked ? "on" : "off"}
                initial={false}
                animate={{ scale: liked ? [1, 1.4, 1] : 1 }}
                transition={{ duration: 0.35, ease: "easeOut" }}
                className="flex"
              >
                <Heart
                  size={16}
                  weight={liked || heartHover ? "fill" : "bold"}
                  className={
                    liked || heartHover ? "text-rose-500" : "text-brand-primary"
                  }
                />
              </motion.span>
            </motion.button>
          </div>

          {/* Ocena na obrazie (lub znacznik „Nowość", gdy brak opinii) */}
          <div className="absolute bottom-4 left-4 inline-flex items-center gap-1.5 text-white text-[11px] font-semibold bg-white/15 backdrop-blur-md border border-white/20 px-2.5 py-1 rounded-full">
            <Star size={12} weight="fill" className="text-brand-yellow" />
            {course.reviews > 0 ? (
              <>
                {course.rating.toFixed(1)}
                <span className="text-white/70 font-medium">({course.reviews})</span>
              </>
            ) : (
              "Nowość"
            )}
          </div>

          {/* Znacznik: kurs odblokowany (ma pierwszeństwo) lub nagrania wkrótce */}
          {owned ? (
            <span className="absolute bottom-4 right-4 inline-flex items-center gap-1 text-white text-[10px] font-bold bg-emerald-500/90 backdrop-blur-md border border-white/20 px-2 py-1 rounded-full">
              <LockSimpleOpen size={11} weight="fill" />
              Odblokowane
            </span>
          ) : (
            course.videoPending && (
              <span className="absolute bottom-4 right-4 inline-flex items-center gap-1 text-white text-[10px] font-bold bg-amber-500/90 backdrop-blur-md border border-white/20 px-2 py-1 rounded-full">
                <VideoCamera size={11} weight="fill" />
                Nagrania wkrótce
              </span>
            )
          )}
        </div>

        {/* TREŚĆ */}
        <div className="flex flex-col flex-1 p-6 gap-4">
          <div className="flex items-center gap-2 text-[12px] text-brand-secondary/60">
            <Clock size={14} weight="duotone" className="text-brand-primary" />
            <span className="font-medium">{formatCourseDuration(course.durationMin)} materiału</span>
          </div>

          <h3 className="font-jakarta text-[19px] font-bold text-brand-secondary leading-snug line-clamp-2 min-h-[52px]">
            {course.title}
          </h3>

          {/* Cena + CTA (gdy odblokowany — kompaktowy pill „Odblokowane”) */}
          <div className="mt-auto flex items-center justify-between pt-4 border-t border-brand-secondary/5">
            {owned ? (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-200/70 pl-2 pr-3 py-1 font-montserrat font-bold text-[12px] text-emerald-600">
                <LockSimpleOpen size={13} weight="fill" />
                Odblokowane
              </span>
            ) : (
              <div>
                <p className="text-[10px] uppercase tracking-wider text-brand-secondary/40 font-bold">
                  Cena
                </p>
                <p className="font-jakarta text-[22px] font-bold text-brand-primary leading-none mt-1">
                  {course.price} <span className="text-[15px]">PLN</span>
                </p>
              </div>
            )}
            <span className="inline-flex items-center gap-2 text-[13px] font-bold text-brand-primary group-hover:gap-3 transition-all">
              {owned ? "Zobacz szczegóły" : "Poznaj szczegóły"}
              <ArrowRight size={16} weight="bold" />
            </span>
          </div>
        </div>
      </Link>
    </motion.article>
  );
}
