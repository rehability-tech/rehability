import { requireAdmin } from "@/lib/auth/requireAdmin";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { validateTripCompleteness } from "@/lib/trips/validateTripCompleteness";

import { z } from "zod";

type PricingItem = {
  id?: string;
  // ID powiązanej usługi z globalnego katalogu (ustawiane przez PricingListBlock)
  originalId?: string;
  name?: string;
  duration?: string | number;
  price?: string | number;
  description?: string | null;
  image?: string | null;
};

function extractPricingItems(blocks: unknown): PricingItem[] {
  if (!Array.isArray(blocks)) return [];
  const items: PricingItem[] = [];
  for (const block of blocks) {
    if (block?.type === "pricingList" && Array.isArray(block?.content?.items)) {
      for (const item of block.content.items) {
        if (item && typeof item === "object") items.push(item as PricingItem);
      }
    }
  }
  return items;
}

// ==========================================
// SCHEMATY WALIDACJI (ZOD)
// ==========================================

// Walidacja ID w parametrach ścieżki
const paramsSchema = z.object({
  id: z.string().min(1, "Brak ID Wydarzenia"),
});

// Walidacja danych wejściowych dla PATCH (Edytor treści).
// Uwaga: pole `description` jest CELOWO POMINIĘTE — należy do kroku
// "Dane podstawowe" i jest aktualizowane przez /api/admin/wydarzenia/save.
// Gdyby tu trafiło (np. ze starego frontu), zod odetnie je w `safeParse`
// dzięki domyślnemu strip-mode, więc nie przedostanie się do Prismy.
const patchBodySchema = z.object({
  subtitle: z.string().nullable().optional(),
  tags: z.array(z.string()).optional(),
  heroImage: z.string().url("Niepoprawny URL zdjęcia").nullable().optional(),
  // blocks to Json z bazy, na froncie przesyłasz tablicę obiektów TipTap,
  // sprawdzamy tylko czy to w ogóle jest przysłane (może być dowolną strukturą json/array)
  blocks: z.any().optional(),
});

// ==========================================
// GET: Pobieranie pojedynczego wydarzenia
// ==========================================
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { isAuthorized, response } = await requireAdmin();
    if (!isAuthorized) return response as NextResponse;

    const resolvedParams = await params;
    const validatedParams = paramsSchema.safeParse(resolvedParams);

    if (!validatedParams.success) {
      return NextResponse.json(
        { error: validatedParams.error.issues[0].message },
        { status: 400 },
      );
    }
    const { id } = validatedParams.data;

    // POBIERANIE Z PEŁNYM DRZEWEM RELACJI
    const trip = await prisma.trip.findUnique({
      where: { id: id },
      include: {
        bookings: {
          where: {
            status: { not: "CANCELLED" }, // Omijamy anulowane
          },
          include: {
            user: {
              include: {
                healthProfile: true, // Potrzebne do sprawdzenia ikony serca (Karty zdrowia)
              },
            },
            serviceOrders: {
              // Potrzebne do ikony gwiazdki w liście oraz do harmonogramu (rezerwacje SPA)
              include: { service: { select: { name: true } } },
            },
          },
        },
        // Harmonogram wydarzenia (widget "Harmonogram" na pulpicie)
        events: {
          orderBy: { startTime: "asc" },
        },
      },
    });

    if (!trip) {
      return NextResponse.json(
        { error: "Nie znaleziono wydarzenia o podanym ID" },
        { status: 404 },
      );
    }


    return NextResponse.json(trip);
  } catch (error) {
    console.error("Błąd podczas pobierania pojedynczego wydarzenia:", error);
    return NextResponse.json(
      { error: "Wystąpił błąd serwera" },
      { status: 500 },
    );
  }
}

// ==========================================
// PATCH: Aktualizacja danych z edytora treści
// ==========================================
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    // 1. ZABEZPIECZENIE: Autoryzacja Admina
    const { isAuthorized, response } = await requireAdmin();
    if (!isAuthorized) return response as NextResponse;

    // 2. WALIDACJA: Parametry ścieżki (id)
    const resolvedParams = await params;
    const validatedParams = paramsSchema.safeParse(resolvedParams);

    if (!validatedParams.success) {
      return NextResponse.json(
        { error: validatedParams.error.issues[0].message },
        { status: 400 },
      );
    }
    const { id } = validatedParams.data;

    // 3. WALIDACJA: Body zapytania (Zod parse JSON)
    const body = await request.json();
    const validatedBody = patchBodySchema.safeParse(body);

    if (!validatedBody.success) {
      return NextResponse.json(
        { error: validatedBody.error.issues[0].message },
        { status: 400 },
      );
    }

    // Wyciągamy bezpiecznie zwalidowane dane
    // (description celowo pominięty — patrz komentarz przy patchBodySchema)
    const { subtitle, tags, heroImage, blocks } = validatedBody.data;

    // 3b. WALIDACJA bloków "Lista usług" — wymagamy kompletności (name + duration + price).
    // Bez tego nie zapisujemy treści, bo TripService potrzebuje tych pól (NOT NULL).
    const pricingItems = extractPricingItems(blocks);
    // Soft-save: nie blokujemy zapisu przy niekompletnych pozycjach
    // (blokujemy dopiero przy publikacji — patrz validateTripCompleteness).
    // Wyjątek: jeśli name/duration/price są puste, NIE upsertujemy danej pozycji
    // do TripService (sekcja 6b), bo Prisma wymaga tych pól.
    for (const item of pricingItems) {
      const duration = String(item?.duration ?? "").trim();
      const price = String(item?.price ?? "").trim();
      if (duration && Number.isNaN(parseInt(duration, 10))) {
        return NextResponse.json(
          { error: "Nieprawidłowy czas trwania w bloku \"Lista usług\"." },
          { status: 400 },
        );
      }
      if (price && Number.isNaN(parseFloat(price.replace(",", ".")))) {
        return NextResponse.json(
          { error: "Nieprawidłowa cena w bloku \"Lista usług\"." },
          { status: 400 },
        );
      }
    }

    // 4. Pobieramy aktualny stan wydarzenia — potrzebny do auto-cofnięcia statusu
    const existingCamp = await prisma.trip.findUnique({ where: { id } });
    if (!existingCamp) {
      return NextResponse.json(
        { error: "Nie znaleziono wydarzenia o podanym ID" },
        { status: 404 },
      );
    }

    // 5. Składamy "post-update" kształt wydarzenia do walidacji kompletności
    const mergedCamp = {
      heroImage: heroImage !== undefined ? heroImage : existingCamp.heroImage,
      location: existingCamp.location,
      startDate: existingCamp.startDate,
      endDate: existingCamp.endDate,
      mapUrl: existingCamp.mapUrl,
      allowBringFriend: existingCamp.allowBringFriend,
      blocks: blocks !== undefined ? blocks : existingCamp.blocks,
    };

    // Jeśli trip był PUBLISHED, a nowy stan jest niekompletny — wymuszamy DRAFT
    let forcedDraft = false;
    if (existingCamp.status === "PUBLISHED") {
      const { isComplete } = validateTripCompleteness(mergedCamp);
      if (!isComplete) forcedDraft = true;
    }

    // 6. Logika biznesowa - Aktualizacja w bazie danych
    const updatedCamp = await prisma.trip.update({
      where: { id: id },
      data: {
        subtitle,
        tags,
        heroImage,
        // description celowo pominięty — należy do "Dane podstawowe"
        blocks, // Prisma zapisze tablicę obiektów jako JSONB w Postgresie
        lastStage: "edytor-tresci", // Aktualizujemy krok, w którym jest admin
        ...(forcedDraft ? { status: "DRAFT" } : {}),
      },
    });

    // 6b. Synchronizacja TripService z pozycjami bloku "Lista usług".
    // Pozwala uczestnikom widzieć usługi w panelu (/panel/wydarzenia/[id]/sklep).
    // Strategia: upsert po item.id; usuwamy TripService, które zniknęły z bloku,
    // ale tylko jeśli nie mają już złożonych zamówień (ServiceOrder).
    if (blocks !== undefined) {
      const blockItemIds = new Set(
        pricingItems
          .map((it) => (typeof it.id === "string" ? it.id : null))
          .filter((v): v is string => !!v),
      );

      const existingServices = await prisma.tripService.findMany({
        where: { tripId: id },
        include: { orders: { select: { id: true }, take: 1 } },
      });

      const toDeleteIds = existingServices
        .filter((s) => !blockItemIds.has(s.id) && s.orders.length === 0)
        .map((s) => s.id);

      if (toDeleteIds.length > 0) {
        await prisma.tripService.deleteMany({
          where: { id: { in: toDeleteIds } },
        });
      }

      for (const item of pricingItems) {
        if (typeof item.id !== "string") continue;
        const name = String(item.name ?? "").trim();
        const durationStr = String(item.duration ?? "").trim();
        const priceStr = String(item.price ?? "").trim();
        // Pomijamy upsert pozycji bez wymaganych pól (Prisma ma NOT NULL).
        // Walidacja "Wszystko musi być wypełnione" odbywa się przy publikacji.
        if (!name || !durationStr || !priceStr) continue;
        const duration = parseInt(durationStr, 10);
        const price = parseFloat(priceStr.replace(",", "."));
        if (Number.isNaN(duration) || Number.isNaN(price)) continue;
        const descriptionVal = String(item.description ?? "").trim();
        const imageVal =
          typeof item.image === "string" && item.image.trim().length > 0
            ? item.image
            : null;
        // Powiązanie z globalnym katalogiem, jeśli pozycja pochodzi z bazy usług
        // (PricingListBlock przekazuje originalId). Umożliwia propagację edycji.
        const sourceServiceId =
          typeof item.originalId === "string" && item.originalId.trim()
            ? item.originalId
            : null;
        await prisma.tripService.upsert({
          where: { id: item.id },
          create: {
            id: item.id,
            name,
            duration,
            price,
            description: descriptionVal,
            image: imageVal,
            tripId: id,
            sourceServiceId,
          },
          update: {
            name,
            duration,
            price,
            description: descriptionVal,
            image: imageVal,
            sourceServiceId,
          },
        });
      }
    }

    return NextResponse.json({
      ...updatedCamp,
      ...(forcedDraft
        ? {
            forcedDraft: true,
            message: "Cofnięto publikację z powodu braków w treści",
          }
        : {}),
    });
  } catch (error) {
    console.error("Błąd API podczas zapisu:", error);
    return NextResponse.json(
      { error: "Wystąpił błąd podczas zapisu danych" },
      { status: 500 },
    );
  }
}

// ==========================================
// DELETE: Usunięcie wydarzenia wraz z zależnościami
// ==========================================
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    // 1. Autoryzacja Admina
    const { isAuthorized, response } = await requireAdmin();
    if (!isAuthorized) return response as NextResponse;

    // 2. Walidacja ID
    const resolvedParams = await params;
    const validatedParams = paramsSchema.safeParse(resolvedParams);
    if (!validatedParams.success) {
      return NextResponse.json(
        { error: validatedParams.error.issues[0].message },
        { status: 400 },
      );
    }
    const { id } = validatedParams.data;

    // 3. Upewniamy się, że wydarzenie istnieje (czytelny 404 zamiast błędu Prismy)
    const existing = await prisma.trip.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!existing) {
      return NextResponse.json(
        { error: "Nie znaleziono wydarzenia o podanym ID" },
        { status: 404 },
      );
    }

    // 3b. BLOKADA: nie pozwalamy usunąć wydarzenia, na który zapisały się uczestniczki.
    // Anulowane / wygasłe rezerwacje się nie liczą. Takie wydarzenie należy archiwizować.
    const activeBookings = await prisma.booking.count({
      where: { tripId: id, status: { notIn: ["CANCELLED", "EXPIRED"] } },
    });
    if (activeBookings > 0) {
      return NextResponse.json(
        {
          error: `Nie można usunąć — wydarzenie ma zapisane uczestniczki (${activeBookings}). Zamiast usuwać, przenieś je do archiwum.`,
        },
        { status: 409 },
      );
    }

    // 4. Usuwanie.
    // Relacja ServiceOrder.service → TripService NIE ma kaskady (domyślnie Restrict),
    // więc najpierw kasujemy zamówienia SPA tego wydarzenia, inaczej kaskadowe
    // usunięcie TripService zostałoby zablokowane. Pozostałe zależności
    // (bookings, services, spaBlocks, events, views, activities, messages)
    // mają onDelete: Cascade i znikną razem z wydarzeniem.
    await prisma.$transaction([
      prisma.serviceOrder.deleteMany({ where: { booking: { tripId: id } } }),
      prisma.trip.delete({ where: { id } }),
    ]);

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Błąd podczas usuwania wydarzenia:", error);
    return NextResponse.json(
      { error: "Nie udało się usunąć wydarzenia" },
      { status: 500 },
    );
  }
}
