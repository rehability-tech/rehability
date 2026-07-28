import React from "react";

import { AllTripsList } from "./_components/AllTripsList";
import { TripsHero } from "./_components/TripsHero";
import { FeaturedTrip } from "./_components/FeaturedTrip";
import { prisma } from "@/lib/prisma";

import type { Metadata } from "next";

const TITLE = "Wydarzenia: warsztaty, treningi i weekendy regeneracyjne";
const DESCRIPTION =
  "Warsztaty, treningi, weekendy regeneracyjne i akcje specjalne w Rehability Prudnik. Zobacz najbliższe terminy i zapisz się online.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/wydarzenia" },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: "/wydarzenia",
    images: [{ url: "/images/campy/campy_hero.jpg" }],
  },
};

async function getInitialCampsData() {
  // Ukrywamy zakończone wydarzenia (po endDate). Próg: początek dzisiejszego dnia.
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const activeWhere = {
    status: "PUBLISHED",
    endDate: { gte: today },
  } as const;

  try {
    const [featuredTripRaw, initialTripsRaw, totalCount] = await Promise.all([
      prisma.trip.findFirst({
        where: activeWhere,
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
      prisma.trip.findMany({
        where: activeWhere,
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
      prisma.trip.count({ where: activeWhere }),
    ]);

    const featuredTrip = featuredTripRaw
      ? {
          ...featuredTripRaw,
          price: featuredTripRaw.price ? Number(featuredTripRaw.price) : null,
        }
      : null;

    const initialTrips = initialTripsRaw.map((trip) => ({
      ...trip,
      price: trip.price ? Number(trip.price) : null,
    }));

    return { featuredTrip, initialTrips, totalCount };
  } catch (error) {
    console.error("Błąd pobierania danych na serwerze:", error);
    return { featuredTrip: null, initialTrips: [], totalCount: 0 };
  }
}

export default async function WydarzeniaPage() {
  const { featuredTrip, initialTrips, totalCount } =
    await getInitialCampsData();

  return (
    <main className="min-h-screen pb-24">
      <TripsHero />

      {featuredTrip && <FeaturedTrip initialTrip={featuredTrip} />}
      <AllTripsList initialTrips={initialTrips} totalCount={totalCount} />
    </main>
  );
}
