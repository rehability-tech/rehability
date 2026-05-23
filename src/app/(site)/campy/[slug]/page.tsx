import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";

import BlockRenderer from "@/components/block-renderer/BlockRenderer";
import CampPageClient from "./_components/CampPageClient";

interface Props {
  params: Promise<{ slug: string }>;
}

// Funkcja pomocnicza do ładnego formatowania dat (np. "12-15 czerwiec 2026")
function formatDateRange(startDate: Date, endDate: Date) {
  const startDay = startDate.getDate();
  const endDay = endDate.getDate();
  const startMonth = startDate.toLocaleString("pl-PL", { month: "long" });
  const year = startDate.getFullYear();

  if (startDate.getMonth() === endDate.getMonth()) {
    return `${startDay}-${endDay} ${startMonth} ${year}`;
  } else {
    const endMonth = endDate.toLocaleString("pl-PL", { month: "long" });
    return `${startDay} ${startMonth} - ${endDay} ${endMonth} ${year}`;
  }
}

// Bezpieczne parsowanie bloków z Prisma
function parseBlocksSafely(rawBlocks: any) {
  if (!rawBlocks) return [];

  if (Array.isArray(rawBlocks)) {
    return rawBlocks;
  }

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

export default async function SingleCampPage({ params }: Props) {
  const { slug } = await params;

  const camp = await prisma.camp.findUnique({
    where: { id: slug },
  });

  if (!camp) notFound();
  console.log(camp.blocks);

  // Używamy nowej, bezpiecznej funkcji
  const blocks = parseBlocksSafely(camp.blocks);

  // Formatowanie daty przed podaniem do komponentu klienckiego
  const dateRange = formatDateRange(camp.startDate, camp.endDate);

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
      // --- PODAJEMY WYDOBYTE BLOKI ---
      blocks={blocks}
      mapUrl={camp.mapUrl}
    />
  );
}
