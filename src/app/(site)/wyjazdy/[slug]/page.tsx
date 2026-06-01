import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getServerSession } from "next-auth/next";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth/auth";
import {
  SITE_NAME,
  SITE_OG_IMAGE,
  SITE_LOCALE,
  absoluteUrl,
} from "@/lib/seo/site";
import { truncateSmart } from "@/lib/seo/utils";

import TripPageClient from "./_components/TripPageClient";

interface Props {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ variant?: string; step?: string }>;
}

// Dynamiczne SEO wyjazdu. Strategia:
// 1) Jeśli admin ustawił `metaTitle` / `metaDescription` w edytorze SEO — wygrywa.
// 2) W przeciwnym razie fallback z `title` + `subtitle` + `description`.
// 3) Sufix " | Rehability Prudnik" doklejany przez template z root layoutu
//    (template działa tylko dla `title.absolute` braku — tu zwracamy
//    zwykły string, więc template się aplikuje automatycznie).
// 4) noIndex w DB → robots: noindex,nofollow (np. wyjazd ARCHIVED lub w przygotowaniu).
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;

  const trip = await prisma.trip.findUnique({
    where: { id: slug },
    select: {
      id: true,
      title: true,
      subtitle: true,
      description: true,
      location: true,
      heroImage: true,
      status: true,
      metaTitle: true,
      metaDescription: true,
      ogImage: true,
      canonicalUrl: true,
      noIndex: true,
      updatedAt: true,
    },
  });

  if (!trip) {
    // 404 → noindex, ale wciąż renderujemy by uniknąć ujawnienia, że strona
    // istniała kiedykolwiek. `notFound()` zadziała w komponencie poniżej.
    return {
      title: "Nie znaleziono wyjazdu",
      robots: { index: false, follow: false },
    };
  }

  const fallbackTitle = trip.subtitle
    ? `${trip.title} — ${trip.location}`
    : `${trip.title} w ${trip.location}`;
  const title = trip.metaTitle?.trim() || fallbackTitle;

  const fallbackDescription =
    trip.description?.trim() ||
    `${trip.title} — wyjazd holistyczny organizowany przez ${SITE_NAME}. ` +
      `Lokalizacja: ${trip.location}.`;
  const description = truncateSmart(
    trip.metaDescription?.trim() || fallbackDescription,
    160,
  );

  const ogImage = trip.ogImage || trip.heroImage || SITE_OG_IMAGE.url;
  const canonical = trip.canonicalUrl || absoluteUrl(`/wyjazdy/${trip.id}`);

  // DRAFT/ARCHIVED nigdy nie powinny zostać zindeksowane — niezależnie od
  // `noIndex` (panel admina pozwala obejrzeć drafty przez URL).
  const shouldIndex = trip.status === "PUBLISHED" && !trip.noIndex;

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      type: "article",
      locale: SITE_LOCALE,
      url: canonical,
      siteName: SITE_NAME,
      title,
      description,
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: trip.title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImage],
    },
    robots: shouldIndex
      ? { index: true, follow: true }
      : { index: false, follow: false },
  };
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

  const trip = await prisma.trip.findUnique({
    where: { id: slug },
  });

  if (!trip) notFound();

  // INKREMENTACJA WYŚWIETLEŃ BEZPOŚREDNIO TUTAJ
  if (trip.status === "PUBLISHED") {
    try {
      await prisma.trip.update({
        where: { id: trip.id },
        data: {
          views: {
            increment: 1, // Atomiczne dodanie +1 do bazy
          },
        },
      });
     
    } catch (error) {
      // Łapiemy błąd, żeby ewentualny problem z licznikiem
      // nie wysypał użytkownikowi całej strony wyjazdu
      console.error("Błąd podczas inkrementacji wyświetleń:", error);
    }
  }

  const blocks = parseBlocksSafely(trip.blocks);
  const dateRange = formatDateRange(trip.startDate, trip.endDate);

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
    <TripPageClient
      tripId={trip.id}
      title={trip.title}
      subtitle={trip.subtitle || "Zanurz się w holistycznym świecie odpoczynku"}
      tags={trip.tags?.length ? trip.tags : []}
      heroImage={trip.heroImage || "/images/static/camp.png"}
      location={trip.location}
      dateRange={dateRange}
      price={trip.price ? trip.price.toString() : undefined}
      priceValue={Number(trip.price)}
      depositValue={Number(trip.deposit)}
      allowBringFriend={trip.allowBringFriend}
      blocks={blocks}
      mapUrl={trip.mapUrl}
      currentUser={currentUser}
      initialVariant={initialVariant}
      initialStep={initialStep}
    />
  );
}
