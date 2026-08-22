import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth/auth";
import { prisma } from "@/lib/prisma";
import { resolveCheckoutPricing } from "@/lib/discounts/resolveCheckoutPricing";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Akceptacja zaproszenia "zabierz przyjaciółkę".
 * Przejmuje Booking (PENDING_INVITATION) na konto zalogowanej osoby:
 * ustawia `userId` + `email` zalogowanej, dzięki czemu rezerwacja pojawia
 * się w jej panelu (panel matchuje po emailu). Status zostaje
 * PENDING_INVITATION — gościni dalej musi opłacić swój zadatek.
 */
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email || !session.user.id) {
    return NextResponse.json(
      { error: "Musisz być zalogowana, aby przyjąć zaproszenie." },
      { status: 401 },
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const token =
    typeof body === "object" && body !== null && "token" in body
      ? String((body as { token: unknown }).token ?? "")
      : "";

  if (!token) {
    return NextResponse.json({ error: "Brak tokenu zaproszenia." }, { status: 400 });
  }

  const invitation = await prisma.booking.findUnique({
    where: { invitationToken: token },
    select: {
      id: true,
      status: true,
      userId: true,
      expiresAt: true,
      tripId: true,
    },
  });

  if (!invitation) {
    return NextResponse.json({ error: "Zaproszenie nie istnieje." }, { status: 404 });
  }

  // Już przejęte przez kogoś innego.
  if (invitation.userId && invitation.userId !== session.user.id) {
    return NextResponse.json(
      { error: "To zaproszenie zostało już wykorzystane." },
      { status: 409 },
    );
  }

  // Już przejęte przez tę samą osobę — idempotentnie zwracamy sukces.
  if (invitation.userId === session.user.id) {
    return NextResponse.json({ ok: true, bookingId: invitation.id });
  }

  const isExpired =
    invitation.status === "EXPIRED" ||
    (invitation.expiresAt != null && invitation.expiresAt.getTime() < Date.now());

  if (invitation.status !== "PENDING_INVITATION" || isExpired) {
    return NextResponse.json(
      { error: "Zaproszenie wygasło lub jest już nieaktywne." },
      { status: 410 },
    );
  }

  const claimerEmail = session.user.email.toLowerCase();

  await prisma.booking.update({
    where: { id: invitation.id },
    data: {
      userId: session.user.id,
      email: claimerEmail,
    },
  });

  // Rezerwacja powstała z e-mailem wpisanym przez osobę zapraszającą, więc
  // wyceniono ją cudzymi promocjami. Teraz znamy prawdziwego właściciela —
  // przewyceniamy na JEGO e-mail, żeby jego rabat mailowy zadziałał.
  // Kodu nie stosujemy: osoba przejmująca wpisze własny przy płatności.
  const pricing = await resolveCheckoutPricing({
    tripId: invitation.tripId,
    email: claimerEmail,
    rawCode: null,
    viewer: session.user,
  });

  if (pricing) {
    await prisma.booking.update({
      where: { id: invitation.id },
      data: {
        amountTotal: pricing.price.finalAmount,
        amountDeposit: pricing.depositGrosze,
        ...pricing.snapshot,
      },
    });
  }

  return NextResponse.json({ ok: true, bookingId: invitation.id });
}
