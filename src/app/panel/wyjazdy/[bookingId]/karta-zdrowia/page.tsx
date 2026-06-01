// app/panel/profil/karta-zdrowia/page.tsx (lub gdziekolwiek to trzymasz)
import React from "react";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth/auth";
import { prisma } from "@/lib/prisma";
import HealthForm from "./_components/HealthForm";

export default async function KartaZdrowiaPage() {
  const session = await getServerSession(authOptions);

  const profile = session?.user?.id
    ? await prisma.healthProfile.findUnique({
        where: { userId: session.user.id },
      })
    : null;

  const initial = profile
    ? {
        dietType: profile.dietType ?? "",
        foodIntolerances: profile.foodIntolerances || [],
        foodNotes: profile.foodNotes ?? "",
        chronicConditions: profile.chronicConditions ?? "",
        medications: profile.medications ?? "",
        injuries: profile.injuries ?? "",
        allergies: profile.allergies ?? "",
        emergencyName: profile.emergencyName ?? "",
        emergencyPhone: profile.emergencyPhone ?? "",
      }
    : null;

  return (
    <div className=" w-full max-w-2xl mx-auto">
      <HealthForm initial={initial} />
    </div>
  );
}
