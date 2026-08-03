"use server";

import Stripe from "stripe";
import { prisma } from "@/lib/prisma";
import { canUseSandbox } from "@/lib/sandbox/context";

export interface CreateCheckoutInput {
  tripId: string;
  name: string;
  email: string;
  phone: string;
}

export interface CreateCheckoutResult {
  ok: boolean;
  checkoutUrl?: string;
  error?: string;
}

const DEFAULT_DEPOSIT_PLN = 1000;

function getStripe(): Stripe {
  const secret = process.env.STRIPE_SECRET_KEY;
  if (!secret) {
    throw new Error(
      "Brak STRIPE_SECRET_KEY w .env. Dodaj klucz Stripe i zrestartuj serwer.",
    );
  }
  return new Stripe(secret);
}

function getAppUrl(): string {
  return (
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.NEXTAUTH_URL ||
    "http://localhost:3000"
  );
}

function validate(input: CreateCheckoutInput): string | null {
  if (!input.tripId) return "Brak identyfikatora wydarzenia.";
  if (!input.name || input.name.trim().length < 3)
    return "Podaj imię i nazwisko.";
  if (!input.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.email))
    return "Podaj poprawny adres e-mail.";
  if (!input.phone || input.phone.replace(/\s+/g, "").length < 7)
    return "Podaj poprawny numer telefonu.";
  return null;
}

export async function createCheckoutSession(
  input: CreateCheckoutInput,
): Promise<CreateCheckoutResult> {
  const validationError = validate(input);
  if (validationError) return { ok: false, error: validationError };

  try {
    // Wydarzenie z piaskownicy zarezerwuje tylko admin/tester — dla reszty
    // filtr `sandbox: false` sprawia, że rekord się nie znajdzie.
    const trip = await prisma.trip.findUnique({
      where: {
        id: input.tripId,
        status: "PUBLISHED",
        ...((await canUseSandbox()) ? {} : { sandbox: false }),
      },
      select: {
        id: true,
        title: true,
        heroImage: true,
        price: true,
        deposit: true,
        capacity: true,
        _count: { select: { bookings: true } },
      },
    });

    if (!trip) {
      return {
        ok: false,
        error: "To wydarzenie nie jest już dostępne do rezerwacji.",
      };
    }

    if (trip._count.bookings >= trip.capacity) {
      return { ok: false, error: "Brak wolnych miejsc na to wydarzenie." };
    }

    const totalPln = trip.price ? Number(trip.price) : 0;
    const depositPln = trip.deposit
      ? Number(trip.deposit)
      : DEFAULT_DEPOSIT_PLN;

    const amountTotal = Math.round(totalPln * 100);
    const amountPaid = Math.round(depositPln * 100);

    const booking = await prisma.booking.create({
      data: {
        tripId: trip.id,
        name: input.name.trim(),
        email: input.email.trim().toLowerCase(),
        phone: input.phone.trim(),
        status: "PENDING",
        amountTotal,
        amountPaid: 0,
      },
      select: { id: true },
    });

    const stripe = getStripe();
    const appUrl = getAppUrl();

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card", "blik", "p24"],
      customer_email: input.email.trim().toLowerCase(),
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: "pln",
            unit_amount: amountPaid,
            product_data: {
              name: `Zadatek · ${trip.title}`,
              description: `Rezerwacja miejsca na wydarzeniu „${trip.title}". Zadatek bezzwrotny.`,
              images: trip.heroImage ? [trip.heroImage] : undefined,
              metadata: { tripId: trip.id },
            },
          },
        },
      ],
      metadata: {
        bookingId: booking.id,
        tripId: trip.id,
        kind: "CAMP_DEPOSIT",
      },
      payment_intent_data: {
        metadata: {
          bookingId: booking.id,
          tripId: trip.id,
          kind: "CAMP_DEPOSIT",
        },
      },
      success_url: `${appUrl}/panel/wydarzenia/${booking.id}?status=processing&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/wydarzenia/${trip.id}?canceled=1`,
      locale: "pl",
    });

    if (!session.url) {
      await prisma.booking.delete({ where: { id: booking.id } });
      return { ok: false, error: "Stripe nie zwrócił adresu płatności." };
    }

    await prisma.booking.update({
      where: { id: booking.id },
      data: { stripeSessionId: session.id },
    });

    return { ok: true, checkoutUrl: session.url };
  } catch (err) {
    console.error("[createCheckoutSession]", err);
    const message =
      err instanceof Error
        ? err.message
        : "Nieoczekiwany błąd podczas tworzenia płatności.";
    return { ok: false, error: message };
  }
}
