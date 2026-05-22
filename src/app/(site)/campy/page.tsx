import React from "react";

import { AllCampsList } from "./_components/AllCampsList";
import { CampyHero } from "./_components/CampyHero";
import { FeaturedCamp } from "./_components/FeaturedCamp";
import { prisma } from "@/lib/prisma";

export const metadata = {
  title: "Campy",
  description:
    "Ekskluzywne wyjazdy holistyczne Rehability. Całkowity reset dla ciała i umysłu w otoczeniu natury.",
  openGraph: {
    title: "Campy | Rehability",
    description:
      "Ekskluzywne wyjazdy holistyczne Rehability. Całkowity reset dla ciała i umysłu w otoczeniu natury.",
    images: [{ url: "/images/campy/campy_hero.jpg" }],
  },
};

async function getInitialCampsData() {
  try {
    const [featuredCampRaw, initialCampsRaw, totalCount] = await Promise.all([
      prisma.camp.findFirst({
        where: { status: "PUBLISHED" },
        orderBy: { startDate: "asc" },
        select: {
          id: true,
          title: true,
          subtitle: true,
          description: true, // <--- DODANO TUTAJ
          heroImage: true,
          location: true,
          price: true,
          startDate: true,
          endDate: true,
        },
      }),
      prisma.camp.findMany({
        where: { status: "PUBLISHED" },
        take: 4,
        skip: 0,
        orderBy: { startDate: "asc" },
        select: {
          id: true,
          title: true,
          subtitle: true,
          description: true, // <--- ORAZ TUTAJ
          tags: true,
          heroImage: true,
          location: true,
          price: true,
          startDate: true,
          endDate: true,
        },
      }),
      prisma.camp.count({ where: { status: "PUBLISHED" } }),
    ]);

    const featuredCamp = featuredCampRaw
      ? {
          ...featuredCampRaw,
          price: featuredCampRaw.price ? Number(featuredCampRaw.price) : null,
        }
      : null;

    const initialCamps = initialCampsRaw.map((camp) => ({
      ...camp,
      price: camp.price ? Number(camp.price) : null,
    }));

    return { featuredCamp, initialCamps, totalCount };
  } catch (error) {
    console.error("Błąd pobierania danych na serwerze:", error);
    return { featuredCamp: null, initialCamps: [], totalCount: 0 };
  }
}

export default async function CampyPage() {
  const { featuredCamp, initialCamps, totalCount } =
    await getInitialCampsData();

  return (
    <main className="min-h-screen pb-24">
      <CampyHero />

      {featuredCamp && <FeaturedCamp initialCamp={featuredCamp} />}
      <AllCampsList initialCamps={initialCamps} totalCount={totalCount} />
    </main>
  );
}
