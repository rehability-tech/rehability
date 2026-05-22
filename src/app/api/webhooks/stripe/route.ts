import { NextResponse } from "next/server";
import Stripe from "stripe";
import crypto from "node:crypto";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function getStripe(): Stripe {
  const secret = process.env.STRIPE_SECRET_KEY;
  if (!secret) throw new Error("Brak STRIPE_SECRET_KEY w środowisku.");
  return new Stripe(secret);
}

export async function POST(req: Request) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error("[stripe-webhook] Brak STRIPE_WEBHOOK_SECRET");
    return NextResponse.json(
      { error: "Webhook secret not configured" },
      { status: 500 },
    );
  }

  const signature = req.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  const rawBody = await req.text();

  let event: Stripe.Event;
  try {
    const stripe = getStripe();
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Invalid signature";
    console.error("[stripe-webhook] Verification failed:", message);
    return NextResponse.json({ error: message }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        await handleCheckoutCompleted(session);
        break;
      }
      case "checkout.session.async_payment_succeeded": {
        const session = event.data.object as Stripe.Checkout.Session;
        await handleCheckoutCompleted(session);
        break;
      }
      case "checkout.session.expired":
      case "checkout.session.async_payment_failed": {
        const session = event.data.object as Stripe.Checkout.Session;
        await handleCheckoutFailed(session);
        break;
      }
      default:
        // Inne eventy ignorujemy — Stripe wymaga jednak 200.
        break;
    }
  } catch (err) {
    console.error("[stripe-webhook] Handler error:", err);
    return NextResponse.json(
      { error: "Internal handler error" },
      { status: 500 },
    );
  }

  return NextResponse.json({ received: true }, { status: 200 });
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const bookingId = session.metadata?.bookingId;
  if (!bookingId) {
    console.warn(
      "[stripe-webhook] checkout.session.completed bez bookingId w metadata",
      session.id,
    );
    return;
  }

  const paid = session.payment_status === "paid";
  if (!paid) {
    return;
  }

  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    select: { id: true, status: true, qrToken: true, amountTotal: true },
  });

  if (!booking) {
    console.warn(
      "[stripe-webhook] Booking not found for bookingId:",
      bookingId,
    );
    return;
  }

  if (booking.status === "CONFIRMED") {
    return;
  }

  const newToken = `RH-${crypto.randomUUID().replace(/-/g, "").slice(0, 16).toUpperCase()}`;
  const amountPaid = session.amount_total ?? 0;

  await prisma.booking.update({
    where: { id: booking.id },
    data: {
      status: "CONFIRMED",
      qrToken: newToken,
      amountPaid,
      depositPaidAt: new Date(),
      stripeSessionId: session.id,
    },
  });
}

async function handleCheckoutFailed(session: Stripe.Checkout.Session) {
  const bookingId = session.metadata?.bookingId;
  if (!bookingId) return;

  await prisma.booking.updateMany({
    where: { id: bookingId, status: "PENDING" },
    data: { status: "CANCELLED" },
  });
}
