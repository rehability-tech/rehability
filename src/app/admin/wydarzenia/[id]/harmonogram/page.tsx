import React from "react";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth/auth";
import TimeGridContainer from "./_components/TimeGridContainer";

interface Props {
  params: Promise<{ id: string }>;
}

// Cienki server component: tylko auth guard + przekazanie tripId.
// Dane harmonogramu (trip/services/events/bloki/rezerwacje) ładuje
// TimeGridContainer przez useEffect z /api/admin/wydarzenia/[id]/harmonogram.
export default async function HarmonogramAdminPage({ params }: Props) {
  const { id } = await params;

  const session = await getServerSession(authOptions);
  if (!session || session.user?.role !== "ADMIN") {
    redirect("/logowanie");
  }

  return (
    <div className="p-6 lg:p-8 max-w-[1400px] mx-auto w-full">
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-gray-100/80 pb-5">
        <div>
          <h1 className="font-jakarta text-2xl sm:text-3xl font-bold text-brand-secondary">
            Harmonogram wydarzenia
          </h1>
          <p className="text-[13px] text-brand-secondary/50 font-medium mt-1">
            Kliknij w pustą przestrzeń dnia aby dodać punkt
          </p>
        </div>
      </header>
      <TimeGridContainer tripId={id} />
    </div>
  );
}
