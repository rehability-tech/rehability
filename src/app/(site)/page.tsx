// app/(site)/page.tsx (lub src/app/(site)/page.tsx)

import { Navbar } from "@/components/layout/Navbar";
import { AboutSection } from "@/components/sections/AboutSection";
import { AppPresentation } from "@/components/sections/AppPresentation";
import { ContactSection } from "@/components/sections/ContactSection";
import { FAQSection } from "@/components/sections/FaqSection";
import { Footer } from "@/components/sections/Footer";
import { HeroSection } from "@/components/sections/HeroSection";
import { KnowledgeBase } from "@/components/sections/KnowledgeBase";
import { PopularCourses } from "@/components/sections/PopularCourses";
import { ServicesSection } from "@/components/sections/ServicesSection";
import { SocialProofSection } from "@/components/sections/SocialProofSection";
import { UpcomingCamps } from "@/components/sections/UpcomingCamps";

// Opcjonalnie: Metadata - musi być nazwanym eksportem (export const), NIE default
export const metadata = {
  title: "Start | Rehability",
};

// POPRAWKA: Musi być "export default" i zwracać prawidłowy JSX
export default function HomePage() {
  return (
    <main className="flex-1 pt-24">
      <Navbar />

      <div className="flex flex-col gap-[156px] max-[1024px]:gap-[200px]">
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
