import React from "react";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth/auth";
import { prisma } from "@/lib/prisma";
import HealthForm from "./_components/HealthForm";
import SubscriptionStatusButtons from "@/components/notifications/SubscriptionStatusButtons";

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
        foodIntolerances: profile.foodIntolerances,
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
    <div className="pt-6">
      <div className="mb-6">
        <h1 className="font-jakarta font-bold text-2xl text-[#0B3B4C]">
          Karta zdrowia
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Uzupełnij przed wyjazdem — organizatorki będą o Ciebie dbać
        </p>
      </div>
      <SubscriptionStatusButtons />
      <HealthForm initial={initial} />
    </div>
  );
}
