import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/requireAdmin";
import { z } from "zod";

// PATCH /api/admin/wydarzenia/registration
// Szybkie ręczne otwarcie/zamknięcie zapisów na wydarzenie (bez wchodzenia w edytor).
const schema = z.object({
  id: z.string().min(1, "ID wydarzenia jest wymagane"),
  registrationClosed: z.boolean(),
});

export async function PATCH(req: Request) {
  try {
    const { isAuthorized, response } = await requireAdmin();
    if (!isAuthorized) return response as NextResponse;

    const parsed = schema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Błąd walidacji" },
        { status: 400 },
      );
    }

    const { id, registrationClosed } = parsed.data;

    const existing = await prisma.trip.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!existing) {
      return NextResponse.json(
        { error: "Nie znaleziono wydarzenia" },
        { status: 404 },
      );
    }

    const trip = await prisma.trip.update({
      where: { id },
      data: { registrationClosed },
      select: { id: true, registrationClosed: true },
    });

    return NextResponse.json({ success: true, trip });
  } catch (error) {
    console.error("Błąd zmiany stanu zapisów:", error);
    return NextResponse.json(
      { error: "Błąd serwera podczas zmiany zapisów" },
      { status: 500 },
    );
  }
}
