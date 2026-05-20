import React from "react";

import { AllCampsList } from "./_components/AllCampsList";
import { CampyHero } from "./_components/CampyHero";
import { FeaturedCamp } from "./_components/FeaturedCamp";
import { prisma } from "@/lib/prisma";

export const metadata = {
  title: "Campy | Rehability",
  description:
    "Ekskluzywne wyjazdy holistyczne. Całkowity reset dla ciała i umysłu.",
};

// Funkcja pomocnicza uderzająca prosto do bazy (działa TYLKO na serwerze!)
// Funkcja pomocnicza uderzająca prosto do bazy (działa TYLKO na serwerze!)
async function getInitialCampsData() {
  try {
    // 1. Zmieniamy nazwy zmiennych na "Raw", żeby wskazać, że to surowe dane prosto z Prismy
    const [featuredCampRaw, initialCampsRaw, totalCount] = await Promise.all([
      prisma.camp.findFirst({
        orderBy: { startDate: "asc" },
        select: {
          id: true,
          title: true,
          subtitle: true,
          heroImage: true,
          location: true,
          price: true,
          startDate: true,
          endDate: true,
        },
      }),
      prisma.camp.findMany({
        take: 9,
        skip: 0,
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
      }),
      prisma.camp.count(),
    ]);

    // 2. PARSOWANIE (Naprawa błędu)
    // Zamieniamy obiekt Decimal z Prismy na zwykły numer (lub null, jeśli nie ma ceny)
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

    // 3. Zwracamy czyste, płaskie obiekty
    return { featuredCamp, initialCamps, totalCount };
  } catch (error) {
    console.error("Błąd pobierania danych na serwerze:", error);
    return { featuredCamp: null, initialCamps: [], totalCount: 0 };
  }
}

// Zmieniamy komponent na ASYNC
export default async function CampyPage() {
  // Błyskawiczne pobranie danych z bazy zanim strona w ogóle trafi do użytkownika
  const { featuredCamp, initialCamps, totalCount } =
    await getInitialCampsData();

  return (
    <main className="min-h-screen pb-24">
      <CampyHero />

      {/* Przekazujemy gotowe dane - FeaturedCamp nie musi już pokazywać "Ładowanie..." */}
      {featuredCamp && <FeaturedCamp initialCamp={featuredCamp} />}

      {/* Przekazujemy pierwszą stronę. Paginacja obsłuży resztę po stronie klienta */}
      <AllCampsList initialCamps={initialCamps} totalCount={totalCount} />
    </main>
  );
}
