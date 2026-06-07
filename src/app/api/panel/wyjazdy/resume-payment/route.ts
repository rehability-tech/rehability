import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth/auth";
import { prisma } from "@/lib/prisma";
import Stripe from "stripe";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function getStripe(): Stripe {
  const secret = process.env.STRIPE_SECRET_KEY;
  if (!secret) throw new Error("Brak STRIPE_SECRET_KEY w środowisku.");
  return new Stripe(secret);
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    return NextResponse.json({ error: "Brak autoryzacji" }, { status: 401 });
  }

  const { bookingId } = await req.json();

  if (!bookingId) {
    return NextResponse.json({ error: "Brak ID rezerwacji" }, { status: 400 });
  }

  // 1. Pobieramy rezerwację
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId, email: session.user.email },
    include: { trip: true },
  });

  // Dopuszczamy status PENDING (zadatek) oraz DEPOSIT_PAID (dopłata reszty)
  if (
    !booking ||
    (booking.status !== "PENDING" &&
      booking.status !== "PENDING_INVITATION" &&
      booking.status !== "DEPOSIT_PAID")
  ) {
    return NextResponse.json(
      { error: "Nieprawidłowa rezerwacja lub opłacona w całości." },
      { status: 400 },
    );
  }

  const isDepositPaid = booking.status === "DEPOSIT_PAID";

  // 2. WERYFIKACJA POJEMNOŚCI (Tylko jeśli płaci zadatek - bo dopłata reszty oznacza, że miejsce jest już zaklepane)
  if (!isDepositPaid) {
    const occupiedSeats = await prisma.booking.count({
      where: {
        tripId: booking.tripId,
        status: { in: ["DEPOSIT_PAID", "FULLY_PAID"] },
      },
    });

    const seatsNeeded = 1;

    if (occupiedSeats + seatsNeeded > booking.trip.capacity) {
      await prisma.booking.update({
        where: { id: booking.id },
        data: { status: "CANCELLED" },
      });

      return NextResponse.json(
        {
          error:
            "Niestety, wyprzedano wszystkie miejsca. Twoja rezerwacja została anulowana.",
        },
        { status: 409 },
      );
    }
  }

  // ========================================================
  // 3. LOGIKA WYLICZANIA KWOT (BARDZO WAŻNA KONTROLA)
  // ========================================================
  // UWAGA: amountToPay tutaj jest OBLICZANA W ZŁOTÓWKACH na potrzeby naszego kodu poniżej.
  let amountToPayPLN = 0;

  if (isDepositPaid) {
    // DOPŁACA RESZTĘ
    // booking.amountTotal w bazie jest w GROSZACH (np. 180000)
    // booking.amountPaid w bazie jest w GROSZACH (np. 60000)
    const amountTotalPLN = Number(booking.amountTotal) / 100;
    const amountPaidPLN = Number(booking.amountPaid) / 100;
    amountToPayPLN = amountTotalPLN - amountPaidPLN;
  } else {
    // PŁACI ZADATEK
    // booking.trip.deposit w bazie (zazwyczaj) trzymany jest w ZŁOTÓWKACH, bo to pole Decimal.
    amountToPayPLN = Number(booking.trip.deposit);
  }

  const paymentType = isDepositPaid ? "remainder" : "deposit";

  // ========================================================
  // 4. GENEROWANIE STRIPE PAYMENT INTENT (ZAMIANA NA GROSZE)
  // ========================================================
  const amountGrosze = Math.round(amountToPayPLN * 100);

  const stripe = getStripe();
  let clientSecret = "";

  // Próbujemy odzyskać istniejący koszyk, O ILE typ płatności się nie zmienił
  if (booking.stripePaymentIntentId) {
    try {
      const pi = await stripe.paymentIntents.retrieve(
        booking.stripePaymentIntentId,
      );
      // Sprawdzamy czy metadata.paymentType pasuje do obecnego zamiaru i czy nie jest zapłacone
      if (
        pi.status !== "succeeded" &&
        pi.status !== "canceled" &&
        pi.metadata.paymentType === paymentType
      ) {
        clientSecret = pi.client_secret!;
      }
    } catch (e) {
      console.warn(
        "[API] Nie udało się odzyskać PaymentIntenta ze Stripe, tworzę nowy.",
      );
    }
  }

  // Jeśli nie mamy ważnego secretu, tworzymy nowy PaymentIntent na odpowiednią kwotę w GROSZACH
  if (!clientSecret) {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountGrosze, // STRIPE ZAWSZE WYMAGA GROSZY/CENTÓW!
      currency: "pln",
      receipt_email: session.user.email,
      automatic_payment_methods: { enabled: true },
      metadata: {
        bookingId: booking.id,
        paymentType: paymentType,
        tripId: booking.trip.id,
      },
    });

    clientSecret = paymentIntent.client_secret!;

    await prisma.booking.update({
      where: { id: booking.id },
      data: { stripePaymentIntentId: paymentIntent.id },
    });
  }

  return NextResponse.json({
    clientSecret,
    // Zwracamy na front kwotę W ZŁOTÓWKACH, by było łatwiej to wyświetlić (lub jako string ze znakiem)
    amount: amountToPayPLN,
  });
}
