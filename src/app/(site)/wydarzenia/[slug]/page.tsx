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
import {
  getTripBookingWindow,
  bookingClosedMessage,
  bookingClosedHeadline,
} from "@/lib/trips/bookingWindow";

import TripPageClient from "./_components/TripPageClient";
import { formatSingleDayOrNull } from "@/lib/trips/tripDates";
import { canUseSandbox } from "@/lib/sandbox/context";

interface Props {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ variant?: string; step?: string; inv?: string }>;
}

// Dynamiczne SEO wydarzenia. Strategia:
// 1) Jeśli admin ustawił `metaTitle` / `metaDescription` w edytorze SEO — wygrywa.
// 2) W przeciwnym razie fallback z `title` + `subtitle` + `description`.
// 3) Sufix " | Rehability Prudnik" doklejany przez template z root layoutu
//    (template działa tylko dla `title.absolute` braku — tu zwracamy
//    zwykły string, więc template się aplikuje automatycznie).
// 4) noIndex w DB → robots: noindex,nofollow (np. wydarzenie ARCHIVED lub w przygotowaniu).
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
      sandbox: true,
    },
  });

  if (!trip) {
    // 404 → noindex, ale wciąż renderujemy by uniknąć ujawnienia, że strona
    // istniała kiedykolwiek. `notFound()` zadziała w komponencie poniżej.
    return {
      title: "Nie znaleziono wydarzenia",
      robots: { index: false, follow: false },
    };
  }

  const fallbackTitle = trip.subtitle
    ? `${trip.title} — ${trip.location}`
    : `${trip.title} w ${trip.location}`;
  const title = trip.metaTitle?.trim() || fallbackTitle;

  const fallbackDescription =
    trip.description?.trim() ||
    `${trip.title} — wydarzenie holistyczne organizowane przez ${SITE_NAME}. ` +
      `Lokalizacja: ${trip.location}.`;
  const description = truncateSmart(
    trip.metaDescription?.trim() || fallbackDescription,
    160,
  );

  const ogImage = trip.ogImage || trip.heroImage || SITE_OG_IMAGE.url;
  const canonical = trip.canonicalUrl || absoluteUrl(`/wydarzenia/${trip.id}`);

  // DRAFT/ARCHIVED nigdy nie powinny zostać zindeksowane — niezależnie od
  // `noIndex` (panel admina pozwala obejrzeć drafty przez URL). Tak samo
  // wydarzenia z piaskownicy: nie mają prawa trafić do wyszukiwarki.
  const shouldIndex =
    trip.status === "PUBLISHED" && !trip.noIndex && !trip.sandbox;

  return {
    title,
    description,
    ...(shouldIndex ? { alternates: { canonical } } : {}),
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
  const singleDay = formatSingleDayOrNull(startDate, endDate);
  if (singleDay) return singleDay;

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

  // Piaskownica: wydarzenie testowe otwiera się po samym adresie, ale wyłącznie
  // dla admina i testerów. Dla wszystkich pozostałych po prostu nie istnieje.
  if (trip.sandbox && !(await canUseSandbox(session))) notFound();

  // INKREMENTACJA WYŚWIETLEŃ BEZPOŚREDNIO TUTAJ
  // Wydarzenia z piaskownicy pomijamy — statystyki mają zostać czyste.
  if (trip.status === "PUBLISHED" && !trip.sandbox) {
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
      // nie wysypał użytkownikowi całej strony wydarzenia
      console.error("Błąd podczas inkrementacji wyświetleń:", error);
    }
  }

  const blocks = parseBlocksSafely(trip.blocks);
  const dateRange = formatDateRange(trip.startDate, trip.endDate);

  // Stan okna zapisów — decyduje, czy pokazać formularz, czy kartę "zapisy zamknięte".
  const bookingWindow = getTripBookingWindow(trip);

  const initialVariant =
    sp.variant === "duo" || sp.variant === "standard" ? sp.variant : undefined;
  const initialStep = sp.step ? Number(sp.step) : undefined;

  // Wejście z linku zaproszenia (?inv=token) → pobieramy imię zapraszającego,
  // by pokazać delikatny tag "Zaproszenie od ...". Token musi dotyczyć tego wydarzenia.
  let inviterName: string | null = null;
  if (sp.inv) {
    const invitation = await prisma.booking.findFirst({
      where: { invitationToken: sp.inv, tripId: trip.id },
      select: { invitedBy: { select: { name: true } } },
    });
    inviterName = invitation?.invitedBy?.name ?? null;
  }

  const currentUser = session?.user?.email
    ? {
        email: session.user.email,
        name: session.user.name ?? null,
        image: session.user.image ?? null,
      }
    : null;

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Start", item: absoluteUrl("/") },
      {
        "@type": "ListItem",
        position: 2,
        name: "Wydarzenia",
        item: absoluteUrl("/wydarzenia"),
      },
      {
        "@type": "ListItem",
        position: 3,
        name: trip.title,
        item: absoluteUrl(`/wydarzenia/${trip.id}`),
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
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
      inviterName={inviterName}
      bookingOpen={bookingWindow.isOpen}
      bookingClosedHeadline={
        bookingWindow.isOpen ? null : bookingClosedHeadline(bookingWindow.reason)
      }
      bookingClosedMessage={
        bookingWindow.isOpen ? null : bookingClosedMessage(bookingWindow.reason)
      }
      />
    </>
  );
}
