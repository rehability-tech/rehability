import { NextResponse } from "next/server";
import Stripe from "stripe";
import crypto from "node:crypto";
import { prisma } from "@/lib/prisma";
import { logCampEvent } from "@/lib/notifications/send";

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
      case "payment_intent.succeeded": {
        const pi = event.data.object as Stripe.PaymentIntent;
        if (pi.metadata?.kind === "SERVICE_ORDER") {
          await handleServiceOrderPaid(pi);
        } else {
          await handlePaymentSucceeded(pi);
        }
        break;
      }
      case "payment_intent.payment_failed":
      case "payment_intent.canceled": {
        const pi = event.data.object as Stripe.PaymentIntent;
        if (pi.metadata?.kind === "SERVICE_ORDER") {
          await handleServiceOrderFailed(pi);
        } else {
          await handlePaymentFailed(pi);
        }
        break;
      }
      case "checkout.session.expired": {
        const sess = event.data.object as Stripe.Checkout.Session;
        if (sess.metadata?.kind === "SERVICE_ORDER") {
          await handleServiceOrderExpired(sess);
        }
        break;
      }
      default:
        // Pozostałe eventy ignorujemy — Stripe wymaga 200 nawet wtedy.
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

type PaymentType = "deposit" | "remainder";

async function handlePaymentSucceeded(pi: Stripe.PaymentIntent) {
  const bookingId = pi.metadata?.bookingId;
  const paymentType = (pi.metadata?.paymentType as PaymentType) ?? "deposit";

  if (!bookingId) {
    console.warn(
      "[stripe-webhook] payment_intent.succeeded bez bookingId w metadata",
      pi.id,
    );
    return;
  }

  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    select: {
      id: true,
      status: true,
      email: true,
      name: true,
      userId: true,
      amountPaid: true,
      tripId: true,
      trip: { select: { title: true } },
    },
  });

  if (!booking) {
    console.warn("[stripe-webhook] Booking not found:", bookingId);
    return;
  }

  // Idempotency — ten sam event może przyjść wielokrotnie.
  if (paymentType === "deposit" && booking.status !== "PENDING") return;
  if (paymentType === "remainder" && booking.status === "FULLY_PAID") return;

  const paidNow = pi.amount_received ?? pi.amount ?? 0;
  const formattedAmount = (paidNow / 100).toFixed(2);
  const userName = booking.name || booking.email;

  const userId =
    booking.userId ?? (await linkOrCreateUser(booking.email, booking.name));

  if (paymentType === "deposit") {
    const newToken = `RH-${crypto
      .randomUUID()
      .replace(/-/g, "")
      .slice(0, 16)
      .toUpperCase()}`;

    await prisma.booking.update({
      where: { id: booking.id },
      data: {
        status: "DEPOSIT_PAID",
        qrToken: newToken,
        amountPaid: paidNow,
        depositPaidAt: new Date(),
        stripePaymentIntentId: pi.id,
        userId,
      },
    });

    logCampEvent({
      kind: "DEPOSIT_PAID",
      tripId: booking.tripId,
      tripTitle: booking.trip?.title,
      userName,
      amount: formattedAmount,
    }).catch((err) =>
      console.error("[stripe-webhook] Błąd wysyłki powiadomień:", err),
    );

    return;
  }

  // paymentType === "remainder"
  await prisma.booking.update({
    where: { id: booking.id },
    data: {
      status: "FULLY_PAID",
      amountPaid: booking.amountPaid + paidNow,
      remainderPaidAt: new Date(),
      userId,
    },
  });

  logCampEvent({
    kind: "FULLY_PAID",
    tripId: booking.tripId,
    tripTitle: booking.trip?.title,
    userName,
    amount: formattedAmount,
  }).catch((err) =>
    console.error("[stripe-webhook] Błąd wysyłki powiadomień:", err),
  );
}

async function handlePaymentFailed(pi: Stripe.PaymentIntent) {
  const bookingId = pi.metadata?.bookingId;
  if (!bookingId) return;

  // Tylko PENDING wracają do CANCELLED — opłaconych nie ruszamy.
  await prisma.booking.updateMany({
    where: { id: bookingId, status: "PENDING" },
    data: { status: "CANCELLED" },
  });
}

async function linkOrCreateUser(
  email: string,
  name: string | null,
): Promise<string> {
  const user = await prisma.user.upsert({
    where: { email },
    update: name ? { name } : {},
    create: { email, name: name ?? undefined },
    select: { id: true },
  });
  return user.id;
}

async function handleServiceOrderPaid(pi: Stripe.PaymentIntent) {
  const orderId = pi.metadata?.orderId;
  if (!orderId) {
    console.warn("[stripe-webhook] SERVICE_ORDER bez orderId w metadata", pi.id);
    return;
  }

  const order = await prisma.serviceOrder.findUnique({
    where: { id: orderId },
    select: {
      id: true,
      status: true,
      bookingId: true,
      service: { select: { name: true } },
      booking: {
        select: {
          name: true,
          email: true,
          tripId: true,
          trip: { select: { title: true } },
        },
      },
    },
  });

  if (!order) {
    console.warn("[stripe-webhook] ServiceOrder not found:", orderId);
    return;
  }

  // Idempotency — webhook może przyjść wielokrotnie.
  if (order.status === "PAID") return;

  await prisma.serviceOrder.update({
    where: { id: orderId },
    data: {
      status: "PAID",
      paidAt: new Date(),
      paymentIntentId: pi.id,
    },
  });

  const userName = order.booking.name || order.booking.email;
  logCampEvent({
    kind: "SERVICE_BOUGHT",
    tripId: order.booking.tripId,
    tripTitle: order.booking.trip?.title,
    userName,
    detail: order.service.name,
  }).catch((err) =>
    console.error("[stripe-webhook] SERVICE_BOUGHT notify error:", err),
  );
}

async function handleServiceOrderFailed(pi: Stripe.PaymentIntent) {
  const orderId = pi.metadata?.orderId;
  if (!orderId) return;
  // Tylko PENDING zwalniamy. PAID nie ruszamy.
  await prisma.serviceOrder.updateMany({
    where: { id: orderId, status: "PENDING" },
    data: { status: "CANCELLED" },
  });
}

async function handleServiceOrderExpired(sess: Stripe.Checkout.Session) {
  const orderId = sess.metadata?.orderId;
  if (!orderId) return;
  await prisma.serviceOrder.updateMany({
    where: { id: orderId, status: "PENDING" },
    data: { status: "CANCELLED" },
  });
}
