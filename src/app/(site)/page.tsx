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
import { prisma } from "@/lib/prisma";

export const metadata = {
  title: "Start | Rehability",
};

async function getFeaturedCamp() {
  try {
    const campRaw = await prisma.camp.findFirst({
      where: { isFeatured: true, status: "PUBLISHED" },
      orderBy: { startDate: "asc" },
      select: {
        id: true,
        title: true,
        subtitle: true,
        tags: true,
        heroImage: true,
        location: true,
        price: true,
        startDate: true,
        endDate: true,
      },
    });

    if (!campRaw) return null;

    return {
      ...campRaw,
      price: campRaw.price ? Number(campRaw.price) : null,
    };
  } catch {
    return null;
  }
}

export default async function HomePage() {
  const featuredCamp = await getFeaturedCamp();

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
        {featuredCamp && <UpcomingCamps featuredCamp={featuredCamp} />}
        <KnowledgeBase />
        <FAQSection />
        <ContactSection />
        <Footer />
      </div>
    </main>
  );
}
