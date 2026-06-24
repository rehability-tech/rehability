"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CaretDown,
  PlayCircle,
  Quotes,
  Star,
  CheckCircle,
} from "@phosphor-icons/react/dist/ssr";
import {
  COURSE_BENEFITS,
  DEFAULT_CURRICULUM,
  DEFAULT_FAQ,
  formatCourseDuration,
  type Course,
  type CourseBlock,
} from "../_data/courses";

const TABS = ["O kursie", "Zawartość", "Opinie", "FAQ"] as const;
type Tab = (typeof TABS)[number];

// Prosty parser `**bold**` → <strong>. Treści korzyści są pisane w markdownie,
// a tu nie ma pełnego renderera, więc pogrubiamy ręcznie zaznaczone fragmenty.
function boldify(text: string): React.ReactNode[] {
  return text.split(/\*\*(.+?)\*\*/g).map((part, i) =>
    i % 2 === 1 ? (
      <strong key={i} className="font-bold text-brand-secondary">
        {part}
      </strong>
    ) : (
      <span key={i}>{part}</span>
    ),
  );
}

// Bloki „O kursie" renderujemy WIZUALNIE IDENTYCZNIE jak w edytorze treści
// (te same komponenty/klasy, RichTextInput → HTML). Stąd dangerouslySetInnerHTML.
function Block({ block }: { block: CourseBlock }) {
  if (block.type === "heading") {
    return (
      <h3
        className="font-jakarta font-bold text-[#0B3B4C] text-2xl md:text-3xl leading-[1.2]"
        dangerouslySetInnerHTML={{ __html: block.text }}
      />
    );
  }
  if (block.type === "list") {
    return (
      <ul className="w-full flex flex-col gap-3">
        {block.items.map((item, i) => (
          <li key={i} className="flex items-start gap-4 w-full">
            <CheckCircle
              size={24}
              weight="fill"
              className="text-[#287D88] shrink-0 mt-1"
            />
            <div
              className="flex-1 font-montserrat text-gray-600 text-base leading-[1.7] [&_p]:m-0 [&_p+p]:mt-2"
              dangerouslySetInnerHTML={{ __html: item }}
            />
          </li>
        ))}
      </ul>
    );
  }
  if (block.type === "highlight") {
    return (
      <div className="w-full border-l-4 border-brand-primary pl-4 py-1">
        <div
          className="font-jakarta font-medium text-lg text-[#0B3B4C] leading-relaxed [&_p]:m-0"
          dangerouslySetInnerHTML={{ __html: block.text }}
        />
      </div>
    );
  }
  if (block.type === "quote") {
    return (
      <div className="w-full border-l-[3px] border-brand-yellow pl-4 py-1">
        <div
          className="font-montserrat italic text-lg text-[#0B3B4C] leading-relaxed [&_p]:m-0"
          dangerouslySetInnerHTML={{ __html: block.text }}
        />
      </div>
    );
  }
  if (block.type === "spacer") {
    return <div className="h-16" aria-hidden="true" />;
  }
  return (
    <div
      className="font-montserrat text-gray-600 text-base leading-[1.7] [&_p]:m-0 [&_p+p]:mt-3"
      dangerouslySetInnerHTML={{ __html: block.text }}
    />
  );
}

function AboutTab({ course }: { course: Course }) {
  const blocks: CourseBlock[] = course.description ?? [
    { type: "paragraph", text: course.excerpt },
    { type: "heading", text: "Co otrzymujesz, dołączając do kursu?" },
    { type: "list", items: COURSE_BENEFITS },
  ];

  return (
    <div className="flex flex-col gap-5">
      <h2 className="font-montserrat font-semibold text-[24px] tracking-[0.24px] text-brand-secondary">
        Opis
      </h2>
      <div className="flex flex-col gap-6">
        {blocks.map((block, i) => (
          <Block key={i} block={block} />
        ))}
      </div>
    </div>
  );
}

// Tryb „single" (pojedynczy film) — zamiast zmyślonego programu modułów
// pokazujemy zwięzłe „Co dostajesz": główny film + korzyści.
function SingleContent({ course }: { course: Course }) {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="font-montserrat font-semibold text-[24px] tracking-[0.24px] text-brand-secondary">
          Co dostajesz
        </h2>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-white/70 border border-white/60 px-3 py-1 font-montserrat text-[12px] font-semibold text-brand-secondary/60 shadow-sm">
          <PlayCircle size={13} weight="fill" className="text-brand-primary" />
          1 film · {formatCourseDuration(course.durationMin)}
        </span>
      </div>

      {/* Główny film — wyróżniona karta (hero) */}
      <div className="relative overflow-hidden flex items-center gap-4 rounded-[22px] rounded-tr-none bg-gradient-to-br from-brand-primary to-[#1f6772] text-white shadow-[0_18px_45px_-24px_rgba(40,125,136,0.7)] p-5">
        <span className="pointer-events-none absolute -right-5 -bottom-7 size-28 rounded-full bg-brand-yellow/30 blur-[28px]" />
        <span className="relative flex items-center justify-center size-14 shrink-0 rounded-2xl rounded-tr-none bg-white/15 backdrop-blur-md border border-white/25 text-white">
          <PlayCircle size={30} weight="fill" />
        </span>
        <div className="relative">
          <p className="font-jakarta font-bold text-[17px] leading-snug">
            Pełne nagranie kursu
          </p>
          <p className="font-montserrat text-[14px] text-white/80 mt-1 leading-relaxed">
            Jeden film ({formatCourseDuration(course.durationMin)}) — oglądasz w
            całości, w swoim tempie i dowolną liczbę razy.
          </p>
        </div>
      </div>

      {/* Korzyści — lista kart w jednej kolumnie (z pogrubieniami) */}
      <div className="flex flex-col gap-3">
        {COURSE_BENEFITS.map((b, i) => (
          <div
            key={i}
            className="flex items-start gap-3 rounded-2xl rounded-tr-none bg-white/60 backdrop-blur-md border border-white/60 p-4 shadow-[0_10px_30px_-26px_rgba(3,63,99,0.4)]"
          >
            <span className="flex items-center justify-center size-8 shrink-0 rounded-xl rounded-tr-[3px] bg-brand-primary/10 text-brand-primary">
              <CheckCircle size={18} weight="fill" />
            </span>
            <p className="font-montserrat text-[14px] leading-[1.55] text-brand-secondary/75">
              {boldify(b)}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

// Opcjonalny opis zakładki „Zawartość" (bloki z edytora) — nad właściwą treścią.
function ContentDescription({ course }: { course: Course }) {
  const blocks = course.content;
  if (!Array.isArray(blocks) || blocks.length === 0) return null;
  return (
    <div className="flex flex-col gap-6">
      {blocks.map((block, i) => (
        <Block key={i} block={block} />
      ))}
    </div>
  );
}

function ContentTab({ course }: { course: Course }) {
  if (course.format === "single") {
    return (
      <div className="flex flex-col gap-6">
        <ContentDescription course={course} />
        <SingleContent course={course} />
      </div>
    );
  }
  const modules = course.curriculum ?? DEFAULT_CURRICULUM;
  const lessonCount = modules.reduce((sum, m) => sum + m.lessons.length, 0);

  return (
    <div className="flex flex-col gap-6">
      <ContentDescription course={course} />
      <div className="flex flex-wrap items-end justify-between gap-2">
        <h2 className="font-montserrat font-semibold text-[24px] tracking-[0.24px] text-brand-secondary">
          Program kursu
        </h2>
        <p className="font-montserrat text-[13px] text-brand-secondary/50">
          {modules.length} moduły · {lessonCount} lekcji · {formatCourseDuration(course.durationMin)}
        </p>
      </div>

      <div className="flex flex-col gap-4">
        {modules.map((mod, i) => (
          <div
            key={i}
            className="rounded-[22px] rounded-tr-none bg-white/70 backdrop-blur-md border border-white/60 shadow-[0_10px_30px_-22px_rgba(3,63,99,0.4)] p-5"
          >
            <div className="flex items-center gap-3 mb-3">
              <span className="flex items-center justify-center size-8 shrink-0 rounded-full bg-brand-primary text-white font-jakarta font-bold text-[14px]">
                {i + 1}
              </span>
              <h3 className="font-jakarta font-bold text-[17px] text-brand-secondary leading-snug">
                {mod.title}
              </h3>
            </div>
            <ul className="flex flex-col gap-2 ps-1">
              {mod.lessons.map((lesson, j) => (
                <li
                  key={j}
                  className="flex items-start gap-2.5 text-[15px] leading-[1.6] text-brand-secondary/80 font-montserrat"
                >
                  <PlayCircle
                    size={18}
                    weight="fill"
                    className="text-brand-primary/70 shrink-0 mt-0.5"
                  />
                  {lesson}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}

function ReviewsTab({ course }: { course: Course }) {
  const reviews = course.testimonials ?? [];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h2 className="font-montserrat font-semibold text-[24px] tracking-[0.24px] text-brand-secondary">
          Opinie kursantów
        </h2>
        {course.reviews > 0 ? (
          <div className="inline-flex items-center gap-2 bg-white/70 backdrop-blur-md border border-white/60 rounded-full px-4 py-1.5 shadow-sm">
            <Star size={18} weight="fill" className="text-brand-yellow" />
            <span className="font-jakarta font-bold text-[18px] text-brand-secondary">
              {course.rating.toFixed(1)}
            </span>
            <span className="font-montserrat text-[13px] text-brand-secondary/50">
              ({course.reviews} opinii)
            </span>
          </div>
        ) : (
          <span className="inline-flex items-center gap-2 bg-brand-yellow/15 border border-brand-yellow/30 rounded-full px-4 py-1.5 font-montserrat font-semibold text-[13px] text-amber-700">
            <Star size={16} weight="fill" className="text-brand-yellow" />
            Nowość — brak ocen
          </span>
        )}
      </div>

      {reviews.length === 0 ? (
        <div className="rounded-[22px] rounded-tr-none bg-white/70 backdrop-blur-md border border-white/60 p-8 text-center font-montserrat text-[15px] text-brand-secondary/55">
          Ten kurs nie ma jeszcze opinii. Pierwsze recenzje pojawią się tu, gdy
          kursantki podzielą się wrażeniami po obejrzeniu materiałów.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {reviews.map((review, i) => (
          <div
            key={i}
            className="relative rounded-[22px] rounded-tr-none bg-white/70 backdrop-blur-md border border-white/60 shadow-[0_10px_30px_-22px_rgba(3,63,99,0.4)] p-5"
          >
            <Quotes
              size={28}
              weight="fill"
              className="text-brand-primary/15 absolute top-4 right-4"
            />
            <div className="flex items-center gap-1 mb-3">
              {Array.from({ length: 5 }).map((_, s) => (
                <Star
                  key={s}
                  size={14}
                  weight="fill"
                  className={
                    s < review.rating
                      ? "text-brand-yellow"
                      : "text-brand-secondary/15"
                  }
                />
              ))}
            </div>
            <p className="font-montserrat text-[14px] leading-[1.6] text-brand-secondary/80 mb-4">
              {review.text}
            </p>
            <div className="flex items-center gap-2.5">
              <span className="flex items-center justify-center size-9 rounded-full bg-brand-primary/10 text-brand-primary font-jakarta font-bold text-[14px]">
                {review.author.charAt(0)}
              </span>
              <span className="font-montserrat font-semibold text-[14px] text-brand-secondary">
                {review.author}
              </span>
            </div>
          </div>
          ))}
        </div>
      )}
    </div>
  );
}

function FaqTab({ course }: { course: Course }) {
  const faq = course.faq ?? DEFAULT_FAQ;
  const [open, setOpen] = useState<number | null>(0);

  return (
    <div className="flex flex-col gap-6">
      <h2 className="font-montserrat font-semibold text-[24px] tracking-[0.24px] text-brand-secondary">
        Najczęstsze pytania
      </h2>
      <div className="flex flex-col gap-3">
        {faq.map((item, i) => {
          const isOpen = open === i;
          return (
            <div
              key={i}
              className="rounded-[20px] rounded-tr-none bg-white/70 backdrop-blur-md border border-white/60 shadow-[0_10px_30px_-24px_rgba(3,63,99,0.4)] overflow-hidden"
            >
              <button
                type="button"
                onClick={() => setOpen(isOpen ? null : i)}
                aria-expanded={isOpen}
                className="w-full flex items-center justify-between gap-4 text-left px-5 py-4"
              >
                <span className="font-montserrat font-semibold text-[15px] text-brand-secondary">
                  {item.q}
                </span>
                <span
                  className={`flex items-center justify-center size-7 shrink-0 rounded-full border transition-all ${
                    isOpen
                      ? "bg-brand-primary text-white border-brand-primary rotate-180"
                      : "bg-white text-brand-primary border-brand-primary/20"
                  }`}
                >
                  <CaretDown size={14} weight="bold" />
                </span>
              </button>
              <div
                className={`grid transition-all duration-300 ease-out ${
                  isOpen
                    ? "grid-rows-[1fr] opacity-100"
                    : "grid-rows-[0fr] opacity-0"
                }`}
              >
                <div className="overflow-hidden">
                  <p className="px-5 pb-5 font-montserrat text-[14px] leading-[1.7] text-brand-secondary/75">
                    {item.a}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function CourseTabs({ course }: { course: Course }) {
  const [active, setActive] = useState<Tab>("O kursie");

  return (
    <div className="flex flex-col gap-8 w-full">
      {/* Zakładki (szklany segment) */}
      <div className="inline-flex items-center self-start gap-1 p-1.5 rounded-full bg-white/60 backdrop-blur-xl border border-white/50 shadow-[0_10px_30px_-18px_rgba(3,63,99,0.4)] overflow-x-auto max-w-full [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {TABS.map((tab) => {
          const isActive = tab === active;
          return (
            <button
              key={tab}
              type="button"
              onClick={() => setActive(tab)}
              className={`relative h-[40px] px-5 shrink-0 rounded-full font-montserrat font-semibold text-[14px] transition-colors ${
                isActive
                  ? "text-white"
                  : "text-brand-secondary/60 hover:text-brand-secondary"
              }`}
            >
              {/* Aktywna „pigułka" — przesuwa się płynnie między zakładkami
                  (wspólny layoutId = jeden element, który Framer animuje). */}
              {isActive && (
                <motion.span
                  layoutId="courseTabPill"
                  transition={{ type: "spring", stiffness: 420, damping: 34 }}
                  className="absolute inset-0 rounded-full bg-brand-primary shadow-[0_4px_15px_0px_rgba(242,217,103,0.35)] border border-brand-yellow/30"
                >
                  <span className="pointer-events-none absolute -right-1 -bottom-1 size-6 rounded-full bg-brand-yellow/50 blur-[10px]" />
                </motion.span>
              )}
              <span className="relative z-10">{tab}</span>
            </button>
          );
        })}
      </div>

      {/* Treść — krzyżowe przejście (fade + delikatny slide) między zakładkami */}
      <div className="bg-white/60 backdrop-blur-xl border border-white/50 rounded-[28px] rounded-tr-none shadow-[0_20px_60px_-35px_rgba(3,63,99,0.35)] p-6 md:p-9">
        <AnimatePresence mode="wait">
          <motion.div
            key={active}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
          >
            {active === "O kursie" && <AboutTab course={course} />}
            {active === "Zawartość" && <ContentTab course={course} />}
            {active === "Opinie" && <ReviewsTab course={course} />}
            {active === "FAQ" && <FaqTab course={course} />}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
