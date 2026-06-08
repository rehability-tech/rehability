import type { Metadata } from "next";
import dynamic from "next/dynamic";
import { Navbar } from "@/components/layout/Navbar";
import { HeroSection } from "./_components/HeroSection";
import { SocialProofSection } from "./_components/SocialProofSection";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth"; // <--- DODANY IMPORT
import { authOptions } from "@/lib/auth/auth";

// Strona główna. title.template z root layoutu doklei " | Rehability Prudnik",
// więc trzymamy tu tylko mocne słowa kluczowe. Canonical przechodzi do "/".
export const metadata: Metadata = {
  title: "Fizjoterapia, Masaż Kobido i Wyjazdy Holistyczne",
  description:
    "Medyczny fundament w świecie wellness. Specjalistyczna fizjoterapia, masaże lecznicze i Kobido w Prudniku oraz ogólnopolskie wyjazdy holistyczne i edukacja.",
  alternates: { canonical: "/" },
  openGraph: {
    title: "Fizjoterapia, Masaż Kobido i Wyjazdy Holistyczne",
    description:
      "Medyczny fundament w świecie wellness. Specjalistyczna fizjoterapia, masaże lecznicze i Kobido w Prudniku oraz ogólnopolskie wyjazdy holistyczne i edukacja.",
    url: "/",
  },
};

const AboutSection = dynamic(() =>
  import("./_components/AboutSection").then((m) => ({
    default: m.AboutSection,
  })),
);
const ServicesSection = dynamic(() =>
  import("./_components/ServicesSection").then((m) => ({
    default: m.ServicesSection,
  })),
);
const AppPresentation = dynamic(() =>
  import("./_components/AppPresentation").then((m) => ({
    default: m.AppPresentation,
  })),
);
const PopularCourses = dynamic(() =>
  import("./_components/PopularCourses").then((m) => ({
    default: m.PopularCourses,
  })),
);
const UpcomingTrips = dynamic(() =>
  import("./_components/UpcomingTrips").then((m) => ({
    default: m.UpcomingTrips,
  })),
);
const KnowledgeBase = dynamic(() =>
  import("./_components/KnowledgeBase").then((m) => ({
    default: m.KnowledgeBase,
  })),
);
const FAQSection = dynamic(() =>
  import("@/components/FaqSection").then((m) => ({ default: m.FAQSection })),
);
const ContactSection = dynamic(() =>
  import("./_components/ContactSection").then((m) => ({
    default: m.ContactSection,
  })),
);
const Footer = dynamic(() =>
  import("@/components/layout/Footer").then((m) => ({ default: m.Footer })),
);

export const revalidate = 600;

async function getLatestPosts() {
  try {
    return await prisma.post.findMany({
      where: { status: "PUBLISHED", publishedAt: { lte: new Date() } },
      orderBy: { publishedAt: "desc" },
      take: 6,
      select: {
        id: true,
        slug: true,
        title: true,
        excerpt: true,
        coverImage: true,
        category: true,
      },
    });
  } catch {
    return [];
  }
}

async function getFeaturedTrip() {
  try {
    const campRaw = await prisma.trip.findFirst({
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
  const [featuredTrip, latestPosts] = await Promise.all([
    getFeaturedTrip(),
    getLatestPosts(),
  ]);
  const session = await getServerSession(authOptions); // <--- POBRANIE SESJI NA SERWERZE

  // Jeśli używasz specyficznej konfiguracji autoryzacji (authOptions),
  // upewnij się, że ją importujesz i używasz: await getServerSession(authOptions)

  return (
    <main className="flex-1 pt-30">
      <Navbar session={session} /> {/* <--- PRZEKAZANIE SESJI W PROPSACH */}
      <div className="flex flex-col gap-50 max-[1024px]:gap-72 ">
        <HeroSection />
        <SocialProofSection />
        <AboutSection />
        <ServicesSection />
        <AppPresentation />
        <PopularCourses />
        {featuredTrip && <UpcomingTrips featuredTrip={featuredTrip} />}
        <KnowledgeBase posts={latestPosts} />
        <FAQSection />
        <ContactSection />
        <Footer />
      </div>
    </main>
  );
}
