import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/requireAdmin";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// Walidacja + parsowanie wspólnych pól usługi (wzorzec z /api/admin/uslugi)
function parseServiceFields(body: any) {
  const { name, duration, price, description, image } = body ?? {};
  if (!name || duration === undefined || price === undefined) {
    return { error: "Brak wymaganych pól (nazwa, czas, cena)." as const };
  }
  if (!description || !String(description).trim()) {
    return { error: "Opis usługi jest wymagany." as const };
  }
  const parsedDuration = parseInt(String(duration), 10);
  const parsedPrice = parseFloat(String(price).replace(",", "."));
  if (Number.isNaN(parsedDuration) || Number.isNaN(parsedPrice)) {
    return { error: "Czas i cena muszą być liczbami." as const };
  }
  return {
    data: {
      name: String(name),
      duration: parsedDuration,
      price: parsedPrice,
      description: String(description),
      image:
        typeof image === "string" && image.trim() ? image : image === null ? null : undefined,
    },
  };
}

// GET — pełny stan strony sklepu: usługi wyjazdu (ze statystykami), katalog globalny, agregaty
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireAdmin();
  if (!auth.isAuthorized) return auth.response;

  const { id: tripId } = await params;

  const trip = await prisma.trip.findUnique({
    where: { id: tripId },
    select: { id: true },
  });
  if (!trip) {
    return NextResponse.json({ error: "Wyjazd nie istnieje." }, { status: 404 });
  }

  const [tripServices, catalog] = await Promise.all([
    prisma.tripService.findMany({
      where: { tripId },
      include: {
        orders: { select: { status: true, price: true, bookingId: true } },
      },
      orderBy: { name: "asc" },
    }),
    prisma.extraService.findMany({ orderBy: { createdAt: "desc" } }),
  ]);

  // Ile wyjazdów łącznie korzysta z danej usługi katalogowej (do ostrzeżenia przy edycji globalnej)
  const linkedCounts = await prisma.tripService.groupBy({
    by: ["sourceServiceId"],
    where: { sourceServiceId: { not: null } },
    _count: { _all: true },
  });
  const linkedCountMap = new Map<string, number>();
  for (const row of linkedCounts) {
    if (row.sourceServiceId) {
      linkedCountMap.set(row.sourceServiceId, row._count._all);
    }
  }

  const inCampSourceIds = new Set(
    tripServices
      .map((s) => s.sourceServiceId)
      .filter((v): v is string => !!v),
  );

  // Mapowanie usług wyjazdu + statystyki sprzedaży
  const services = tripServices.map((s) => {
    const active = s.orders.filter((o) => o.status !== "CANCELLED");
    const paid = s.orders.filter((o) => o.status === "PAID");
    const pending = s.orders.filter((o) => o.status === "PENDING");
    const revenuePaid = paid.reduce((sum, o) => sum + Number(o.price), 0);
    const buyers = new Set(active.map((o) => o.bookingId)).size;
    return {
      id: s.id,
      name: s.name,
      duration: s.duration,
      price: Number(s.price),
      description: s.description,
      image: s.image,
      sourceServiceId: s.sourceServiceId,
      isLinked: !!s.sourceServiceId,
      linkedCampsCount: s.sourceServiceId
        ? linkedCountMap.get(s.sourceServiceId) ?? 1
        : 0,
      stats: {
        ordersActive: active.length,
        ordersPaid: paid.length,
        ordersPending: pending.length,
        revenuePaid,
        buyers,
      },
    };
  });

  // Agregaty całego wyjazdu
  const totalSold = services.reduce((s, x) => s + x.stats.ordersPaid, 0);
  const pendingCount = services.reduce((s, x) => s + x.stats.ordersPending, 0);
  const totalRevenue = services.reduce((s, x) => s + x.stats.revenuePaid, 0);
  const distinctBuyers = new Set(
    tripServices.flatMap((s) =>
      s.orders.filter((o) => o.status !== "CANCELLED").map((o) => o.bookingId),
    ),
  ).size;
  const topService =
    services.length > 0
      ? [...services].sort(
          (a, b) => b.stats.ordersActive - a.stats.ordersActive,
        )[0]
      : null;

  return NextResponse.json({
    services,
    catalog: catalog.map((c) => ({
      id: c.id,
      name: c.name,
      duration: c.duration,
      price: Number(c.price),
      description: c.description,
      image: c.image,
      inCamp: inCampSourceIds.has(c.id),
    })),
    stats: {
      servicesCount: services.length,
      totalSold,
      pendingCount,
      totalRevenue,
      distinctBuyers,
      topService: topService
        ? { name: topService.name, sold: topService.stats.ordersActive }
        : null,
    },
  });
}

// POST — dodanie usług z katalogu globalnego do wyjazdu: { extraServiceIds: string[] }
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireAdmin();
  if (!auth.isAuthorized) return auth.response;

  const { id: tripId } = await params;
  const body = await req.json().catch(() => null);
  const ids: unknown = body?.extraServiceIds;

  if (!Array.isArray(ids) || ids.length === 0) {
    return NextResponse.json(
      { error: "Nie wskazano usług do dodania." },
      { status: 400 },
    );
  }
  const extraIds = ids.filter((x): x is string => typeof x === "string");

  const trip = await prisma.trip.findUnique({
    where: { id: tripId },
    select: { id: true },
  });
  if (!trip) {
    return NextResponse.json({ error: "Wyjazd nie istnieje." }, { status: 404 });
  }

  const [catalog, existing] = await Promise.all([
    prisma.extraService.findMany({ where: { id: { in: extraIds } } }),
    prisma.tripService.findMany({
      where: { tripId, sourceServiceId: { in: extraIds } },
      select: { sourceServiceId: true },
    }),
  ]);
  const alreadyAdded = new Set(existing.map((e) => e.sourceServiceId));

  const toCreate = catalog.filter((c) => !alreadyAdded.has(c.id));
  if (toCreate.length === 0) {
    return NextResponse.json({ added: 0 });
  }

  await prisma.tripService.createMany({
    data: toCreate.map((c) => ({
      name: c.name,
      duration: c.duration,
      price: c.price,
      description: c.description,
      image: c.image,
      tripId,
      sourceServiceId: c.id,
    })),
  });

  return NextResponse.json({ added: toCreate.length });
}

// PATCH — edycja usługi. scope: 'camp' (tylko ten camp) lub 'global' (katalog + wszystkie powiązane campy)
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireAdmin();
  if (!auth.isAuthorized) return auth.response;

  const { id: tripId } = await params;
  const body = await req.json().catch(() => null);
  const serviceId: unknown = body?.id;
  const scope: unknown = body?.scope;

  if (typeof serviceId !== "string") {
    return NextResponse.json({ error: "Brak ID usługi." }, { status: 400 });
  }
  if (scope !== "camp" && scope !== "global") {
    return NextResponse.json({ error: "Nieprawidłowy zakres edycji." }, { status: 400 });
  }

  const parsed = parseServiceFields(body);
  if ("error" in parsed) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  const service = await prisma.tripService.findFirst({
    where: { id: serviceId, tripId },
    select: { id: true, sourceServiceId: true },
  });
  if (!service) {
    return NextResponse.json(
      { error: "Usługa nie istnieje w tym wyjeździe." },
      { status: 404 },
    );
  }

  if (scope === "camp") {
    const updated = await prisma.tripService.update({
      where: { id: service.id },
      data: parsed.data,
    });
    return NextResponse.json({ scope, id: updated.id });
  }

  // scope === 'global'
  if (!service.sourceServiceId) {
    return NextResponse.json(
      {
        error:
          "Ta usługa nie jest powiązana z katalogiem globalnym — można ją edytować tylko w tym wyjeździe.",
      },
      { status: 400 },
    );
  }
  const sourceId = service.sourceServiceId;

  // image: dla scope global nie chcemy przypadkowo zerować obrazu wartością undefined —
  // updateMany pomija undefined automatycznie, więc to bezpieczne.
  const [, propagated] = await prisma.$transaction([
    prisma.extraService.update({
      where: { id: sourceId },
      data: parsed.data,
    }),
    prisma.tripService.updateMany({
      where: { sourceServiceId: sourceId },
      data: parsed.data,
    }),
  ]);

  return NextResponse.json({
    scope,
    id: service.id,
    propagatedTo: propagated.count,
  });
}

// DELETE — usunięcie usługi z wyjazdu. Blokada, jeśli istnieją zamówienia.
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireAdmin();
  if (!auth.isAuthorized) return auth.response;

  const { id: tripId } = await params;
  const serviceId = req.nextUrl.searchParams.get("serviceId");

  if (!serviceId) {
    return NextResponse.json({ error: "Brak ID usługi." }, { status: 400 });
  }

  const service = await prisma.tripService.findFirst({
    where: { id: serviceId, tripId },
    select: { id: true },
  });
  if (!service) {
    return NextResponse.json(
      { error: "Usługa nie istnieje w tym wyjeździe." },
      { status: 404 },
    );
  }

  const ordersCount = await prisma.serviceOrder.count({
    where: { serviceId: service.id },
  });
  if (ordersCount > 0) {
    return NextResponse.json(
      {
        error: `Nie można usunąć — usługa ma ${ordersCount} ${
          ordersCount === 1 ? "rezerwację" : "rezerwacji"
        }. Najpierw anuluj zamówienia.`,
      },
      { status: 409 },
    );
  }

  await prisma.tripService.delete({ where: { id: service.id } });
  return NextResponse.json({ deleted: service.id });
}
