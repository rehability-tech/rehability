import { getServerSession } from "next-auth/next";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth/auth";
import { prisma } from "@/lib/prisma";
import { getContinueCourse } from "@/lib/courses-db";
import { Sparkle } from "@phosphor-icons/react/dist/ssr";

import HubTripsWidget from "./_components/HubTripsWidget";
import HubVodWidget from "./_components/HubVodWidget";
import HubRecentUpdates from "./_components/HubRecentUpdates"; // <--- Nasz nowy komponent

export default async function PanelHubPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/logowanie");
  }

  // Wyciągamy pierwsze słowo z imienia
  const firstName = session.user.name ? session.user.name.split(" ")[0] : "";

  // Dynamiczne powitanie na podstawie godziny
  const hour = new Date().getHours();
  let greeting = "Dzień dobry";
  if (hour < 6) greeting = "Dobrej nocy";
  else if (hour > 18) greeting = "Dobry wieczór";

  // Dostęp do VOD = posiada przynajmniej jeden kupiony kurs (Enrollment).
  const enrollmentCount = await prisma.enrollment.count({
    where: { userId: session.user.id },
  });
  const hasActiveVod = enrollmentCount > 0;

  // Realny kurs „Kontynuuj" (ostatnio oglądany / ostatnio kupiony).
  const continueCourse = hasActiveVod
    ? await getContinueCourse(session.user.id)
    : null;

  return (
    <div className="w-full">
      {/* NAGŁÓWEK */}
      <div className="mb-10">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-brand-primary/10 border border-brand-primary/15 mb-3">
          <Sparkle size={14} weight="fill" className="text-brand-primary" />
          <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-brand-primary">
            Panel Główny
          </span>
        </div>

        <h1 className="font-jakarta font-bold text-3xl md:text-4xl text-brand-secondary tracking-tight">
          {greeting}
          {firstName ? `, ${firstName}` : ""} 👋
        </h1>
        <p className="text-brand-secondary/50 text-[14px] md:text-[15px] mt-2 font-montserrat max-w-lg leading-relaxed">
          Zarządzaj swoimi nadchodzącymi wydarzenieami i korzystaj z naszej cyfrowej
          platformy treningowej.
        </p>
      </div>

      {/* SIATKA GŁÓWNYCH WIDŻETÓW */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
        {/* Moduł 1: Wydarzenia (Pobiera dane samodzielnie na kliencie!) */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between px-1">
            <h2 className="font-jakarta font-bold text-[18px] text-brand-secondary">
              Strefa Wydarzeń
            </h2>
          </div>
          <HubTripsWidget />
        </div>

        {/* Moduł 2: VOD */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between px-1">
            <h2 className="font-jakarta font-bold text-[18px] text-brand-secondary">
              Strefa Cyfrowa
            </h2>
          </div>
          <HubVodWidget
            hasAccess={hasActiveVod}
            continueCourse={continueCourse}
          />
        </div>
      </div>

      {/* SEKCJA NOWOŚCI (Pod kartami) */}
      <div className="mt-10 lg:mt-12 flex flex-col gap-4">
        <div className="flex items-center justify-between px-1">
          <h2 className="font-jakarta font-bold text-[18px] text-brand-secondary">
            Ostatnie nowości w Rehability
          </h2>
        </div>
        <HubRecentUpdates />
      </div>
    </div>
  );
}
