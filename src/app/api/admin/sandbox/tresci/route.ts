import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth/requireAdmin";
import { isSandboxEntity } from "@/lib/sandbox/constants";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Przenoszenie treści między piaskownicą a produkcją.
//
// `sandbox` jest wymiarem NIEZALEŻNYM od `status` — celowo nie ruszamy tu
// statusu. Kurs opublikowany w piaskownicy po „wypuszczeniu na produkcję"
// zostaje PUBLISHED i po prostu staje się widoczny; nic nie trzeba publikować
// drugi raz, a wcześniejsze testy (postępy, opinie) zostają nietknięte.

const BodySchema = z.object({
  entity: z.string().refine(isSandboxEntity, "Nieznany typ treści."),
  id: z.string().min(1, "Brak identyfikatora treści."),
  sandbox: z.boolean(),
});

export async function PATCH(req: Request) {
  const { isAuthorized, response } = await requireAdmin();
  if (!isAuthorized) return response as NextResponse;

  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return NextResponse.json({ error: "Nieprawidłowy JSON." }, { status: 400 });
  }

  const parsed = BodySchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Błąd walidacji." },
      { status: 422 },
    );
  }

  const { entity, id, sandbox } = parsed.data;

  try {
    if (entity === "trip") {
      const trip = await prisma.trip.update({
        where: { id },
        data: { sandbox },
        select: { id: true, title: true, status: true, sandbox: true },
      });
      return NextResponse.json({ item: { ...trip, entity } });
    }

    const course = await prisma.course.update({
      where: { id },
      data: { sandbox },
      select: {
        id: true,
        slug: true,
        title: true,
        status: true,
        sandbox: true,
      },
    });
    return NextResponse.json({ item: { ...course, entity } });
  } catch {
    // P2025 (rekord nie istnieje) i wszystko inne → 404, żeby nie zdradzać ID.
    return NextResponse.json(
      { error: "Nie znaleziono treści do przeniesienia." },
      { status: 404 },
    );
  }
}
