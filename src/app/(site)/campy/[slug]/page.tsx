import { notFound } from "next/navigation";
import { getServerSession } from "next-auth/next";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth/auth";

import CampPageClient from "./_components/CampPageClient";

interface Props {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ variant?: string; step?: string }>;
}

function formatDateRange(startDate: Date, endDate: Date) {
  const startDay = startDate.getDate();
  const endDay = endDate.getDate();
  const startMonth = startDate.toLocaleString("pl-PL", { month: "long" });
  const year = startDate.getFullYear();

  if (startDate.getMonth() === endDate.getMonth()) {
    return `${startDay}-${endDay} ${startMonth} ${year}`;
  }
  const endMonth = endDate.toLocaleString("pl-PL", { month: "long" });
  return `${startDay} ${startMonth} - ${endDay} ${endMonth} ${year}`;
}

function parseBlocksSafely(rawBlocks: any) {
  if (!rawBlocks) return [];
  if (Array.isArray(rawBlocks)) return rawBlocks;
  if (typeof rawBlocks === "string") {
    try {
      const parsed = JSON.parse(rawBlocks);
      if (Array.isArray(parsed)) return parsed;
    } catch (e) {
      console.error("Błąd parsowania bloków JSON:", e);
    }
  }
  return [];
}

export default async function SingleCampPage({ params, searchParams }: Props) {
  const [{ slug }, sp, session] = await Promise.all([
    params,
    searchParams,
    getServerSession(authOptions),
  ]);

  const camp = await prisma.camp.findUnique({
    where: { id: slug },
  });

  if (!camp) notFound();

  // INKREMENTACJA WYŚWIETLEŃ BEZPOŚREDNIO TUTAJ
  if (camp.status === "PUBLISHED") {
    try {
      await prisma.camp.update({
        where: { id: camp.id },
        data: {
          views: {
            increment: 1, // Atomiczne dodanie +1 do bazy
          },
        },
      });
      console.log("incremented the camp", camp.title);
    } catch (error) {
      // Łapiemy błąd, żeby ewentualny problem z licznikiem
      // nie wysypał użytkownikowi całej strony wyjazdu
      console.error("Błąd podczas inkrementacji wyświetleń:", error);
    }
  }

  const blocks = parseBlocksSafely(camp.blocks);
  const dateRange = formatDateRange(camp.startDate, camp.endDate);

  const initialVariant =
    sp.variant === "duo" || sp.variant === "standard" ? sp.variant : undefined;
  const initialStep = sp.step ? Number(sp.step) : undefined;

  const currentUser = session?.user?.email
    ? {
        email: session.user.email,
        name: session.user.name ?? null,
        image: session.user.image ?? null,
      }
    : null;

  return (
    <CampPageClient
      campId={camp.id}
      title={camp.title}
      subtitle={camp.subtitle || "Zanurz się w holistycznym świecie odpoczynku"}
      tags={camp.tags?.length ? camp.tags : []}
      heroImage={camp.heroImage || "/images/static/camp.png"}
      location={camp.location}
      dateRange={dateRange}
      price={camp.price ? camp.price.toString() : undefined}
      priceValue={Number(camp.price)}
      depositValue={Number(camp.deposit)}
      allowBringFriend={camp.allowBringFriend}
      blocks={blocks}
      mapUrl={camp.mapUrl}
      currentUser={currentUser}
      initialVariant={initialVariant}
      initialStep={initialStep}
    />
  );
}
