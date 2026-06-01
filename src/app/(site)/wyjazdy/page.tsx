import React from "react";

import { AllTripsList } from "./_components/AllTripsList";
import { TripsHero } from "./_components/TripsHero";
import { FeaturedTrip } from "./_components/FeaturedTrip";
import { prisma } from "@/lib/prisma";

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Wyjazdy Holistyczne, SPA i Weekendy Wellness",
  description:
    "Zadbaj o ciało i umysł pod okiem fizjoterapeutów. Zobacz nasze prywatne wyjazdy holistyczne dla kobiet, weekendy wellness i turnusy regeneracyjne.",
  alternates: { canonical: "/wyjazdy" },
  openGraph: {
    title: "Wyjazdy Holistyczne, SPA i Weekendy Wellness",
    description:
      "Zadbaj o ciało i umysł pod okiem fizjoterapeutów. Zobacz nasze prywatne wyjazdy holistyczne dla kobiet, weekendy wellness i turnusy regeneracyjne.",
    url: "/wyjazdy",
    images: [{ url: "/images/campy/campy_hero.jpg" }],
  },
};

async function getInitialCampsData() {
  try {
    const [featuredTripRaw, initialTripsRaw, totalCount] = await Promise.all([
      prisma.trip.findFirst({
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
      prisma.trip.findMany({
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
      prisma.trip.count({ where: { status: "PUBLISHED" } }),
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

export default async function WyjazdyPage() {
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
