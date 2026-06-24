"use client";

import Image from "next/image";
import { Clock, CheckCircle, Star } from "@phosphor-icons/react/dist/ssr";
import {
  formatCourseDuration,
  ORDER_INCLUDES,
  type Course,
} from "../_data/courses";

export function OrderSummary({ course }: { course: Course }) {
  return (
    <div className="w-full lg:w-[407px] shrink-0 lg:sticky lg:top-28">
      <div className="bg-white/60 backdrop-blur-xl border border-white/50 rounded-[28px] rounded-tr-none shadow-[0_20px_60px_-35px_rgba(3,63,99,0.35)] p-6 flex flex-col gap-6">
        <div className="flex items-end justify-between border-b border-brand-primary/10 pb-4">
          <h2 className="font-jakarta font-bold text-[20px] text-brand-secondary">
            Twoje zamówienie
          </h2>
          <span className="inline-flex items-center gap-1 bg-white/70 border border-white/60 rounded-full px-2.5 py-1 shadow-sm">
            <Star size={13} weight="fill" className="text-brand-yellow" />
            <span className="font-montserrat font-semibold text-[12px] text-brand-secondary">
              {course.rating.toFixed(1)}
            </span>
          </span>
        </div>

        {/* Mini-karta kursu */}
        <div className="flex gap-4 items-stretch">
          <div className="relative size-[112px] rounded-2xl rounded-tr-none overflow-hidden shrink-0 shadow-[0_12px_30px_-16px_rgba(3,63,99,0.5)]">
            <Image
              src={course.image}
              alt={course.title}
              fill
              sizes="112px"
              className="object-cover"
            />
          </div>
          <div className="flex flex-col justify-between flex-1 min-w-0 py-0.5">
            <h3 className="font-montserrat font-semibold text-[15px] text-brand-secondary leading-snug line-clamp-3">
              {course.title}
            </h3>
            <div className="flex items-center gap-1.5">
              <Clock size={16} weight="duotone" className="text-brand-primary" />
              <span className="font-montserrat font-medium text-[12px] text-brand-secondary/50">
                {formatCourseDuration(course.durationMin)} materiału
              </span>
            </div>
          </div>
        </div>

        {/* Zawartość */}
        <div className="bg-brand-primary/[0.07] rounded-[20px] rounded-tr-none p-4 flex flex-col gap-3">
          <span className="font-montserrat font-bold text-[12px] uppercase tracking-wider text-brand-secondary/60">
            W cenie
          </span>
          <ul className="flex flex-col gap-2.5">
            {ORDER_INCLUDES.map((item) => (
              <li key={item} className="flex items-center gap-2.5">
                <CheckCircle
                  size={18}
                  weight="fill"
                  className="text-brand-primary shrink-0"
                />
                <span className="font-montserrat text-[14px] text-brand-secondary/80">
                  {item}
                </span>
              </li>
            ))}
          </ul>
        </div>

        {/* Suma */}
        <div className="flex items-end justify-between border-t border-brand-primary/10 pt-4">
          <div>
            <p className="font-montserrat text-[12px] text-brand-secondary/50">
              Razem do zapłaty
            </p>
            <p className="font-montserrat text-[11px] text-brand-secondary/40">
              Dostęp dożywotni · jednorazowo
            </p>
          </div>
          <p className="font-jakarta font-bold text-[28px] text-brand-primary leading-none">
            {course.price}{" "}
            <span className="text-[16px] font-semibold">PLN</span>
          </p>
        </div>
      </div>
    </div>
  );
}
