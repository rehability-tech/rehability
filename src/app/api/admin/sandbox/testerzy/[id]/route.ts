import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth/requireAdmin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * DELETE — odbiera dostęp do piaskownicy.
 *
 * Nie usuwa konta ani niczego, co tester zdążył kupić w sandboxie: dostęp do
 * kursów trzyma `Enrollment`, więc kupione materiały zostają. Znika wyłącznie
 * możliwość oglądania NOWYCH treści testowych. Flagę czytamy z bazy przy
 * każdym odświeżeniu tokenu, więc zmiana działa bez wylogowywania.
 */
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { isAuthorized, response } = await requireAdmin();
  if (!isAuthorized) return response as NextResponse;

  const { id } = await params;

  const user = await prisma.user.findUnique({
    where: { id },
    select: { id: true },
  });
  if (!user) {
    return NextResponse.json(
      { error: "Nie znaleziono konta." },
      { status: 404 },
    );
  }

  await prisma.user.update({
    where: { id },
    data: { sandboxAccess: false, sandboxGrantedAt: null },
  });

  return NextResponse.json({ success: true });
}
