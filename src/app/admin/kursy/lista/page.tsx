import Link from "next/link";
import { GraduationCap, Sparkle } from "@phosphor-icons/react/dist/ssr";
import { getAdminCourses } from "@/lib/courses-db";
import { AdminCoursesList } from "./_components/AdminCoursesList";

export const metadata = {
  title: "Kursy – Admin",
};

export const revalidate = 60;

export default async function AdminKursyListaPage() {
  const courses = await getAdminCourses();

  return (
    <div className="w-full max-w-6xl mx-auto p-6 animate-in fade-in duration-500">
      {/* Nagłówek */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <div className="flex w-fit items-center gap-2 px-3 py-1.5 rounded-full bg-brand-primary/10 border border-brand-primary/15 mb-3">
            <GraduationCap
              size={14}
              weight="fill"
              className="text-brand-primary"
            />
            <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-brand-primary">
              Platforma VOD
            </span>
          </div>
          <h1 className="font-jakarta font-bold text-[24px] md:text-[28px] text-brand-secondary inline-flex items-center gap-2.5">
            Wszystkie kursy
            <span className="font-montserrat font-semibold text-[16px] text-brand-secondary/35">
              ({courses.length})
            </span>
          </h1>
          <p className="font-montserrat text-[14px] text-brand-secondary/50 mt-1">
            Lista wszystkich kursów VOD — przeglądaj i zarządzaj treścią.
          </p>
        </div>

        <Link
          href="/admin/kursy/dodaj"
          className="group relative inline-flex self-center sm:self-auto shrink-0 items-center gap-2 bg-brand-primary text-white font-montserrat font-bold text-[13px] px-4 py-2.5 rounded-xl rounded-tr-[3px] border border-brand-yellow/30 shadow-[0_8px_22px_-6px_rgba(40,125,136,0.5)] hover:shadow-[0_10px_26px_0px_rgba(242,217,103,0.45)] hover:-translate-y-0.5 transition-all overflow-hidden"
        >
          <span className="pointer-events-none absolute -right-2 -bottom-2 size-8 rounded-full bg-brand-yellow/50 blur-[12px]" />
          <span className="relative inline-flex items-center gap-2">
            <Sparkle size={15} weight="fill" />
            Stwórz nowy kurs
          </span>
        </Link>
      </div>

      {/* Pusty stan */}
      {courses.length === 0 ? (
        <div className="relative overflow-hidden rounded-[24px]  min-h-[340px] px-8 py-14 sm:py-16 text-center flex flex-col items-center justify-center">
          {/* Firmowa poświata w rogach */}

          {/* Ikona — morski akcent + żółta poświata */}
          <span className="relative flex items-center justify-center size-16 rounded-2xl rounded-tr-none bg-brand-primary text-white border border-brand-yellow/30 shadow-[0_8px_22px_-6px_rgba(40,125,136,0.5)] mb-5">
            <span className="pointer-events-none absolute -right-1.5 -bottom-1.5 size-7 rounded-full bg-brand-yellow/50 blur-[10px]" />
            <GraduationCap size={30} weight="duotone" className="relative" />
          </span>

          <h2 className="relative font-jakarta font-bold text-[20px] text-brand-secondary">
            Brak kursów
          </h2>
          <p className="relative font-montserrat text-[13.5px] leading-relaxed text-brand-secondary/50 mt-2 mb-6 max-w-sm">
            Nie masz jeszcze żadnego kursu VOD. Utwórz pierwszy w kreatorze —
            pojawi się tutaj od razu.
          </p>
          <Link
            href="/admin/kursy/dodaj"
            className="group relative inline-flex items-center gap-2 bg-brand-primary text-white font-montserrat font-bold text-[13px] px-4 py-2.5 rounded-xl rounded-tr-[3px] border border-brand-yellow/30 shadow-[0_8px_22px_-6px_rgba(40,125,136,0.5)] hover:shadow-[0_10px_26px_0px_rgba(242,217,103,0.45)] transition-all overflow-hidden"
          >
            <span className="pointer-events-none absolute -right-2 -bottom-2 size-8 rounded-full bg-brand-yellow/50 blur-[12px]" />
            <span className="relative inline-flex items-center gap-2">
              <Sparkle size={15} weight="fill" />
              Utwórz kurs z AI
            </span>
          </Link>
        </div>
      ) : (
        <AdminCoursesList courses={courses} />
      )}
    </div>
  );
}
