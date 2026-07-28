import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth/requireAdmin";

export const dynamic = "force-dynamic";

const createSchema = z.object({
  name: z.string().trim().min(1, "Nazwa jest wymagana").max(200),
  duration: z.coerce.number().int().positive("Czas trwania musi być dodatni"),
  price: z.coerce.number().nonnegative("Cena nie może być ujemna"),
  description: z.string().trim().min(1, "Opis usługi jest wymagany").max(2000),
  image: z
    .union([z.string().trim().url().max(2000), z.literal(""), z.null()])
    .optional(),
});

const updateSchema = createSchema.extend({
  id: z.string().min(1, "Brak ID usługi"),
});

type AggregatedService = {
  id: string;
  name: string;
  duration: number;
  price: number;
  description: string;
  image: string | null;
};

export async function GET() {
  const { isAuthorized, response } = await requireAdmin();
  if (!isAuthorized) return response as NextResponse;

  try {
    // GLOBALNA BAZA USŁUG = katalog ExtraService ∪ wszystkie usługi ze wszystkich
    // wydarzeń (TripService). Usługi tworzone/edytowane "tylko dla wydarzenia" żyją
    // wyłącznie w TripService — tutaj zbieramy je wszystkie w jedną listę, żeby
    // "Wybierz z bazy" pokazywało komplet (z opisem i zdjęciem).
    const [extra, tripServices] = await Promise.all([
      prisma.extraService.findMany({ orderBy: { createdAt: "desc" } }),
      prisma.tripService.findMany({ orderBy: { name: "asc" } }),
    ]);

    // Deduplikacja po (nazwa | czas | cena) — zachowuje warianty (np. ta sama
    // nazwa, inna cena/czas), a scala identyczne kopie z różnych wydarzeń.
    // Przy kolizji wzbogacamy brakujące zdjęcie/opis z kopii, która je ma.
    const map = new Map<string, AggregatedService>();
    const keyOf = (name: string, duration: number, price: number) =>
      `${name.trim().toLowerCase()}|${duration}|${price}`;

    const upsert = (svc: AggregatedService) => {
      const key = keyOf(svc.name, svc.duration, svc.price);
      const existing = map.get(key);
      if (!existing) {
        map.set(key, svc);
        return;
      }
      if (!existing.image && svc.image) existing.image = svc.image;
      if (
        (!existing.description || !existing.description.trim()) &&
        svc.description
      ) {
        existing.description = svc.description;
      }
    };

    // Katalog globalny ma pierwszeństwo (jego id staje się id pozycji).
    for (const s of extra) {
      upsert({
        id: s.id,
        name: s.name,
        duration: s.duration,
        price: Number(s.price),
        description: s.description ?? "",
        image: s.image ?? null,
      });
    }
    for (const ts of tripServices) {
      upsert({
        id: ts.id,
        name: ts.name,
        duration: ts.duration,
        price: Number(ts.price),
        description: ts.description ?? "",
        image: ts.image ?? null,
      });
    }

    return NextResponse.json([...map.values()]);
  } catch (error) {
    console.error("[GET /api/admin/uslugi]", error);
    return NextResponse.json(
      { error: "Błąd pobierania usług" },
      { status: 500 },
    );
  }
}

export async function POST(req: Request) {
  const { isAuthorized, response } = await requireAdmin();
  if (!isAuthorized) return response as NextResponse;

  try {
    const body = await req.json().catch(() => null);
    const parsed = createSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Nieprawidłowe dane" },
        { status: 400 },
      );
    }
    const { name, duration, price, description, image } = parsed.data;

    const newService = await prisma.extraService.create({
      data: {
        name,
        duration,
        price,
        description,
        image: image && image.trim() ? image : null,
      },
    });

    return NextResponse.json(newService);
  } catch (error) {
    console.error("[POST /api/admin/uslugi]", error);
    return NextResponse.json(
      { error: "Błąd podczas zapisu usługi" },
      { status: 500 },
    );
  }
}

// EDYCJA ISTNIEJĄCEJ USŁUGI
export async function PATCH(req: Request) {
  const { isAuthorized, response } = await requireAdmin();
  if (!isAuthorized) return response as NextResponse;

  try {
    const body = await req.json().catch(() => null);
    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Nieprawidłowe dane" },
        { status: 400 },
      );
    }
    const { id, name, duration, price, description, image } = parsed.data;

    const data = {
      name,
      duration,
      price,
      description,
      // image === null → wyczyść; undefined → nie ruszaj; string → ustaw
      image: image === null ? null : image && image.trim() ? image : undefined,
    };

    // Propagacja: edycja w katalogu globalnym aktualizuje też wszystkie
    // kopie usługi przypisane do campów (TripService powiązane przez sourceServiceId).
    const [updatedService] = await prisma.$transaction([
      prisma.extraService.update({ where: { id }, data }),
      prisma.tripService.updateMany({ where: { sourceServiceId: id }, data }),
    ]);

    return NextResponse.json(updatedService);
  } catch (error) {
    console.error("[PATCH /api/admin/uslugi]", error);
    return NextResponse.json(
      { error: "Błąd aktualizacji usługi" },
      { status: 500 },
    );
  }
}
