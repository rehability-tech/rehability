import { Suspense } from "react";
import { getCourseCategories } from "@/lib/courses-db";
import { CourseWizard } from "./_components/CourseWizard";

export const metadata = {
  title: "Nowy kurs – Admin",
};

export default async function AddCoursePage() {
  // Istniejące kategorie z bazy (bez pseudo-filtra „Wszystkie") jako podpowiedzi
  // w kreatorze — dzięki temu kategorie dodane wcześniej wracają na liście.
  const dbCategories = (await getCourseCategories()).filter(
    (c) => c !== "Wszystkie",
  );
  return (
    <div className="w-full max-w-5xl mx-auto animate-in fade-in duration-500 pb-12 p-6">
      <div className="my-8 mt-2 text-center">
        <h1 className="text-[24px] md:text-[28px] font-jakarta font-bold text-[#0B3B4C]">
          Kreator kursu VOD
        </h1>
        <p className="text-gray-500 font-montserrat text-[14px] md:text-[15px] mt-1">
          Zbuduj nowy program wideo krok po kroku — z pomocą asystenta AI.
        </p>
      </div>
      <Suspense fallback={null}>
        <CourseWizard categories={dbCategories} />
      </Suspense>
    </div>
  );
}
