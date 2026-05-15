import { AllCampsList } from "@/components/sections/campy/AllCampsList";
import { CampyHero } from "@/components/sections/campy/CampyHero";
import { FeaturedCamp } from "@/components/sections/campy/FeaturedCamp";
import React from "react";

export const metadata = {
  title: "Campy | Rehability",
  description:
    "Ekskluzywne wyjazdy holistyczne. Całkowity reset dla ciała i umysłu.",
};

export default function CampyPage() {
  return (
    <main className="min-h-screen  pb-24">
      <CampyHero />
      <FeaturedCamp />
      <AllCampsList />
    </main>
  );
}
