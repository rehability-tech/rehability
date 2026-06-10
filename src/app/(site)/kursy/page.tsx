import type { Metadata } from "next";
import { KursyHero } from "./_components/KursyHero";
import { KursyCatalog } from "./_components/KursyCatalog";
import { KursySuggestion } from "./_components/KursySuggestion";

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

export default function KursyPage() {
  return (
    <main className="min-h-screen">
      <KursyHero />
      <KursyCatalog />
      <KursySuggestion />
    </main>
  );
}
