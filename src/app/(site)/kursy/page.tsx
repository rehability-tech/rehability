import type { Metadata } from "next";
import { KursyHero } from "./_components/KursyHero";
import { KursyCatalog } from "./_components/KursyCatalog";
import { KursySuggestion } from "./_components/KursySuggestion";
import { getCourses, getCourseCategories } from "@/lib/courses-db";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Platforma VOD – Programy treningowe online",
  description:
    "Autorskie programy ruchowe stworzone przez fizjoterapeutów. Trenuj bezpiecznie z domu, podtrzymaj efekty terapii i pracuj ze swoim ciałem we własnym tempie.",
  alternates: { canonical: "/kursy" },
  openGraph: {
    title: "Platforma VOD – Programy treningowe online",
    description:
      "Autorskie programy ruchowe stworzone przez fizjoterapeutów. Trenuj bezpiecznie z domu, we własnym tempie, z dowolnego miejsca.",
    url: "/kursy",
    images: [{ url: "/images/kursy/hero.png" }],
  },
};

export default async function KursyPage() {
  const [courses, categories] = await Promise.all([
    getCourses(),
    getCourseCategories(),
  ]);

  return (
    <main className="relative min-h-screen bg-white">
      {/* Dekoracyjne tło — ten sam gradient co w panelach */}
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(to_bottom,#dafbff_0%,#ffffff_50%,#f5fbfc_100%)] opacity-50" />
        <div className="absolute -top-40 -left-20 w-[420px] h-[420px] rounded-full bg-brand-primary/20 blur-[120px]" />
        <div className="absolute top-1/3 -right-32 w-[380px] h-[380px] rounded-full bg-brand-yellow/25 blur-[120px]" />
      </div>
      <KursyHero />
      <KursyCatalog courses={courses} categories={categories} />
      <KursySuggestion />
    </main>
  );
}
