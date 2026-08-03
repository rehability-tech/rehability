import { NextResponse } from "next/server";
import Stripe from "stripe";
import { z } from "zod";
import crypto from "node:crypto";
import { getServerSession } from "next-auth/next";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth/auth";
import { logCampEvent } from "@/lib/notifications/send";
import {
  getTripBookingWindow,
  bookingClosedMessage,
} from "@/lib/trips/bookingWindow";
import { canUseSandbox } from "@/lib/sandbox/context";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const INVITATION_TTL_HOURS = 24;

const FriendSchema = z.object({
  firstName: z.string().trim().min(1, "Podaj imię osoby towarzyszącej."),
  lastName: z.string().trim().min(1, "Podaj nazwisko osoby towarzyszącej."),
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email("Nieprawidłowy email osoby towarzyszącej."),
});

const BodySchema = z
  .object({
    tripId: z.string().min(1),
    variant: z.enum(["standard", "duo"]),
    customer: z.object({
      firstName: z.string().trim().min(1, "Podaj imię."),
      lastName: z.string().trim().min(1, "Podaj nazwisko."),
      phone: z.string().trim().min(6, "Podaj numer telefonu."),
    }),
    consents: z.object({
      rodo: z.literal(true, { message: "Wymagana zgoda RODO." }),
      health: z.literal(true, { message: "Wymagane oświadczenie zdrowotne." }),
    }),
    friend: FriendSchema.optional(),
  })
  .refine((d) => d.variant !== "duo" || !!d.friend, {
    message: "Wariant Duo wymaga danych osoby towarzyszącej.",
    path: ["friend"],
  });

function getStripe(): Stripe {
  const secret = process.env.STRIPE_SECRET_KEY;
  if (!secret) throw new Error("Brak STRIPE_SECRET_KEY w środowisku.");
  return new Stripe(secret);
}

export async function POST(req: Request) {
  // Sesja jest wymagana — email pochodzi ze zweryfikowanego konta Google,
  // a userId od razu wiążemy z Bookingiem (bez czekania na webhook).
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json(
      { error: "Musisz być zalogowana, aby zarezerwować." },
      { status: 401 },
    );
  }

  const sessionEmail = session.user.email.toLowerCase();
  const sessionUserId =
    (session.user as { id?: string }).id ?? undefined;

  let rawBody: unknown;
  try {
    rawBody = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const parsed = BodySchema.safeParse(rawBody);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", issues: parsed.error.flatten() },
      { status: 422 },
    );
  }
  const data = parsed.data;

  if (data.friend && data.friend.email.toLowerCase() === sessionEmail) {
    return NextResponse.json(
      { error: "Email osoby towarzyszącej musi być inny niż Twój." },
      { status: 422 },
    );
  }

  const trip = await prisma.trip.findUnique({
    where: { id: data.tripId },
    select: {
      id: true,
      title: true,
      status: true,
      price: true,
      deposit: true,
      capacity: true,
      allowBringFriend: true,
      startDate: true,
      endDate: true,
      registrationDeadline: true,
      registrationClosed: true,
      sandbox: true,
    },
  });

  if (!trip || trip.status !== "PUBLISHED") {
    return NextResponse.json({ error: "Wydarzenie jest niedostępne." }, { status: 404 });
  }

  // Bramka piaskownicy — rezerwację testową może opłacić tylko admin/tester.
  if (trip.sandbox && !(await canUseSandbox())) {
    return NextResponse.json(
      { error: "Wydarzenie jest niedostępne." },
      { status: 404 },
    );
  }

  // Okno zapisów. "Twarde" zamknięcia (wydarzenie zakończone / ręcznie zamknięte)
  // blokują KAŻDĄ płatność — także przejęcie zaproszenia. Minięty termin
  // (DEADLINE) blokuje tylko nowe rezerwacje (sprawdzane niżej, w ścieżce
  // standardowej), bo zaproszona osoba ma własne 24h na opłatę.
  const bookingWindow = getTripBookingWindow(trip);
  if (bookingWindow.reason === "ENDED" || bookingWindow.reason === "MANUAL") {
    return NextResponse.json(
      { error: bookingClosedMessage(bookingWindow.reason) },
      { status: 409 },
    );
  }

  if (data.variant === "duo" && !trip.allowBringFriend) {
    return NextResponse.json(
      { error: "To wydarzenie nie wspiera opcji 'zabierz osobę towarzyszącą'." },
      { status: 422 },
    );
  }

  const depositGrosze = Math.round(Number(trip.deposit) * 100);
  const totalGrosze = Math.round(Number(trip.price) * 100);

  if (depositGrosze <= 0) {
    return NextResponse.json(
      { error: "Wydarzenie nie ma poprawnie ustawionego zadatku." },
      { status: 500 },
    );
  }

  const fullName = `${data.customer.firstName} ${data.customer.lastName}`.trim();
  const expiresAt = new Date(Date.now() + INVITATION_TTL_HOURS * 3600 * 1000);

  // MERGE zaproszenia: jeśli ta osoba ma już aktywne zaproszenie na to wydarzenie
  // (PENDING_INVITATION na jej email), PRZEJMUJEMY tę rezerwację zamiast tworzyć
  // duplikat. Dzięki temu zaproszona uczestniczka, która opłaca zadatek normalną
  // ścieżką (a nie przez link /zaproszenie), ląduje w SWOJEJ istniejącej rezerwacji,
  // a nie w nowej, osieroconej. To naprawia "tworzenie konta od nowa po zaproszeniu".
  const existingInvitation = await prisma.booking.findFirst({
    where: {
      tripId: trip.id,
      email: sessionEmail,
      status: "PENDING_INVITATION",
      NOT: { expiresAt: { lt: new Date() } }, // nie wygasłe (lub bez daty)
    },
    select: { id: true },
  });
  const claimedInvitation = !!existingInvitation;

  let bookerId: string;

  if (existingInvitation) {
    // Przejęcie zaproszenia — bez nowej rezerwacji i bez sprawdzania miejsc
    // (miejsce jest już zarezerwowane przez to zaproszenie).
    await prisma.booking.update({
      where: { id: existingInvitation.id },
      data: {
        userId: sessionUserId ?? null,
        name: fullName,
        phone: data.customer.phone,
        status: "PENDING",
      },
    });
    bookerId = existingInvitation.id;
  } else {
    // Standardowa ścieżka — najpierw okno zapisów (blokuje też DEADLINE),
    // potem miejsca, na końcu tworzymy nową rezerwację.
    if (!bookingWindow.isOpen) {
      return NextResponse.json(
        { error: bookingClosedMessage(bookingWindow.reason) },
        { status: 409 },
      );
    }

    const occupiedSeats = await prisma.booking.count({
      where: {
        tripId: trip.id,
        status: {
          in: ["PENDING", "DEPOSIT_PAID", "FULLY_PAID", "PENDING_INVITATION"],
        },
      },
    });
    const seatsNeeded = data.variant === "duo" ? 2 : 1;
    if (occupiedSeats + seatsNeeded > trip.capacity) {
      return NextResponse.json(
        { error: "Brak wolnych miejsc na to wydarzenie." },
        { status: 409 },
      );
    }

    bookerId = await prisma.$transaction(async (tx) => {
      const booker = await tx.booking.create({
        data: {
          tripId: trip.id,
          userId: sessionUserId ?? null,
          name: fullName,
          email: sessionEmail,
          phone: data.customer.phone,
          status: "PENDING",
          amountTotal: totalGrosze,
        },
        select: { id: true },
      });

      if (data.variant === "duo" && data.friend) {
        const friendName =
          `${data.friend.firstName} ${data.friend.lastName}`.trim();
        const invitationToken = crypto.randomBytes(24).toString("base64url");

        await tx.booking.create({
          data: {
            tripId: trip.id,
            name: friendName,
            email: data.friend.email,
            status: "PENDING_INVITATION",
            amountTotal: totalGrosze,
            invitedById: booker.id,
            invitationToken,
            expiresAt,
          },
        });
      }

      return booker.id;
    });
  }

  const stripe = getStripe();

  let paymentIntent: Stripe.PaymentIntent;
  try {
    paymentIntent = await stripe.paymentIntents.create({
      amount: depositGrosze,
      currency: "pln",
      receipt_email: sessionEmail,
      automatic_payment_methods: { enabled: true },
      metadata: {
        bookingId: bookerId,
        paymentType: "deposit",
        tripId: trip.id,
      },
    });
  } catch (err) {
    console.error("[create-payment-intent] Stripe error:", err);
    if (claimedInvitation) {
      // Przywracamy zaproszenie, żeby nieudana płatność go nie zniszczyła —
      // uczestniczka może spróbować ponownie.
      await prisma.booking.updateMany({
        where: { id: bookerId, status: "PENDING" },
        data: { status: "PENDING_INVITATION" },
      });
    } else {
      await prisma.booking.updateMany({
        where: { id: bookerId, status: "PENDING" },
        data: { status: "CANCELLED" },
      });
      await prisma.booking.updateMany({
        where: { invitedById: bookerId, status: "PENDING_INVITATION" },
        data: { status: "CANCELLED" },
      });
    }
    return NextResponse.json(
      { error: "Nie udało się utworzyć płatności." },
      { status: 502 },
    );
  }

  await prisma.booking.update({
    where: { id: bookerId },
    data: { stripePaymentIntentId: paymentIntent.id },
  });

  if (!paymentIntent.client_secret) {
    return NextResponse.json(
      { error: "Stripe nie zwrócił client_secret." },
      { status: 502 },
    );
  }

  logCampEvent({
    kind: "SIGNUP",
    tripId: trip.id,
    tripTitle: trip.title,
    userName: fullName,
  }).catch((err) => console.error("[create-payment-intent] SIGNUP log failed:", err));

  return NextResponse.json({
    clientSecret: paymentIntent.client_secret,
    paymentIntentId: paymentIntent.id,
    bookingId: bookerId,
    amount: depositGrosze,
  });
}
