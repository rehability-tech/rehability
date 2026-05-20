// app/(site)/page.tsx (lub src/app/(site)/page.tsx)

import { Navbar } from "@/components/layout/Navbar";
import { AboutSection } from "./_components/AboutSection";
import { AppPresentation } from "./_components/AppPresentation";
import { ContactSection } from "./_components/ContactSection";
import { FAQSection } from "@/components/FaqSection";
import { Footer } from "@/components/layout/Footer";
import { HeroSection } from "./_components/HeroSection";
import { KnowledgeBase } from "./_components/KnowledgeBase";
import { PopularCourses } from "./_components/PopularCourses";
import { ServicesSection } from "./_components/ServicesSection";
import { SocialProofSection } from "./_components/SocialProofSection";
import { UpcomingCamps } from "./_components/UpcomingCamps";

// Opcjonalnie: Metadata - musi być nazwanym eksportem (export const), NIE default
export const metadata = {
  title: "Start | Rehability",
};

// POPRAWKA: Musi być "export default" i zwracać prawidłowy JSX
export default function HomePage() {
  return (
    <main className="flex-1 pt-30">
      <Navbar />

      <div className="flex flex-col gap-50 max-[1024px]:gap-72 ">
        <HeroSection />
        <SocialProofSection />
        <AboutSection />
        <ServicesSection />
        <AppPresentation />
        <PopularCourses />
        <UpcomingCamps />
        <KnowledgeBase />
        <FAQSection />
        <ContactSection />
        <Footer />
      </div>
    </main>
  );
}
