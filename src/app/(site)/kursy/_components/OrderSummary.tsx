"use client";

import Image from "next/image";
import { Clock, CheckCircle } from "@phosphor-icons/react/dist/ssr";
import { ORDER_INCLUDES, type Course } from "../_data/courses";

export function OrderSummary({ course }: { course: Course }) {
  return (
    <div className="flex flex-col gap-6 w-full lg:w-[407px] shrink-0">
      <div className="border-b border-brand-primary/20 pb-6">
        <h2 className="font-montserrat font-semibold text-[20px] text-black">
          Zamówienie
        </h2>
      </div>

      <div className="bg-white border border-brand-primary/20 rounded-[21px] p-6 flex flex-col gap-8">
        {/* Mini-karta kursu */}
        <div className="flex gap-5 items-start">
          <div className="relative size-[130px] rounded-2xl overflow-hidden shrink-0">
            <Image
              src={course.image}
              alt={course.title}
              fill
              sizes="130px"
              className="object-cover"
            />
          </div>
          <div className="flex flex-col justify-between py-1.5 flex-1 min-w-0">
            <div className="flex flex-col gap-1.5">
              <h3 className="font-montserrat font-semibold text-[16px] text-brand-secondary leading-snug line-clamp-3">
                {course.title}
              </h3>
              <div className="flex items-center gap-1.5">
                <Clock
                  size={20}
                  weight="duotone"
                  className="text-brand-primary"
                />
                <span className="font-montserrat font-medium text-[12px] text-black/50">
                  {course.durationMin} min
                </span>
              </div>
            </div>
            <span className="font-montserrat font-bold text-[18px] text-brand-primary">
              {course.price} PLN
            </span>
          </div>
        </div>

        {/* Zawartość */}
        <div className="bg-brand-primary/20 rounded-[20px] p-4 flex flex-col gap-3">
          <span className="font-montserrat font-semibold text-[14px] text-brand-secondary/80">
            Zawartość:
          </span>
          <ul className="flex flex-col gap-2">
            {ORDER_INCLUDES.map((item) => (
              <li key={item} className="flex items-center gap-2">
                <CheckCircle
                  size={16}
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
      </div>
    </div>
  );
}
