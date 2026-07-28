import { NextResponse } from "next/server";
import Stripe from "stripe";
import { z } from "zod";
import { getServerSession } from "next-auth/next";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function getStripe(): Stripe {
  const secret = process.env.STRIPE_SECRET_KEY;
  if (!secret) throw new Error("Brak STRIPE_SECRET_KEY w środowisku.");
  return new Stripe(secret);
}

const BodySchema = z.object({
  slug: z.string().min(1),
  buyerType: z.enum(["private", "company"]).optional(),
  company: z.string().trim().optional(),
  nip: z.string().trim().optional(),
  // Dane rozliczeniowe (do faktur) — utrwalane w metadata PI, a po opłaceniu
  // w rekordzie CoursePurchase. Opcjonalne, żeby nie łamać istniejących wywołań.
  name: z.string().trim().optional(),
  email: z.string().trim().optional(),
  address: z.string().trim().optional(),
  postal: z.string().trim().optional(),
  city: z.string().trim().optional(),
});

export async function POST(req: Request) {
  // Dostęp jest per-konto → wymagamy zalogowania (userId trafia do metadata,
  // a webhook po opłaceniu zakłada Enrollment na tego użytkownika).
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string } | undefined)?.id;
  const email = session?.user?.email?.toLowerCase();
  if (!userId || !email) {
    return NextResponse.json(
      { error: "Zaloguj się, aby kupić kurs." },
      { status: 401 },
    );
  }

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
  const {
    slug,
    buyerType,
    company,
    nip,
    name,
    email: billingEmail,
    address,
    postal,
    city,
  } = parsed.data;

  const course = await prisma.course.findFirst({
    where: { slug, status: "PUBLISHED" },
    select: { id: true, title: true, price: true },
  });
  if (!course) {
    return NextResponse.json(
      { error: "Ten kurs nie jest już dostępny." },
      { status: 404 },
    );
  }

  // Już ma dostęp → nie tworzymy płatności.
  const existing = await prisma.enrollment.findUnique({
    where: { userId_courseId: { userId, courseId: course.id } },
    select: { id: true },
  });
  if (existing) {
    return NextResponse.json({ alreadyOwned: true });
  }

  const amount = Math.round((course.price ?? 0) * 100);

  // Kurs darmowy → nadajemy dostęp od razu, bez Stripe.
  if (amount <= 0) {
    await prisma.enrollment.upsert({
      where: { userId_courseId: { userId, courseId: course.id } },
      update: {},
      create: { userId, courseId: course.id },
    });
    return NextResponse.json({ free: true });
  }

  // Metadata czytane przez webhook (payment_intent.succeeded → Enrollment).
  const metadata: Record<string, string> = {
    kind: "COURSE_PURCHASE",
    courseId: course.id,
    slug,
    userId,
  };
  if (buyerType) metadata.buyerType = buyerType;
  if (company) metadata.company = company.slice(0, 400);
  if (nip) metadata.nip = nip.slice(0, 40);
  // Snapshot rozliczeniowy (limity znaków Stripe: 500/wartość).
  if (name) metadata.buyerName = name.slice(0, 200);
  if (billingEmail) metadata.buyerEmail = billingEmail.slice(0, 200);
  if (address) metadata.address = address.slice(0, 300);
  if (postal) metadata.postalCode = postal.slice(0, 20);
  if (city) metadata.city = city.slice(0, 120);

  let paymentIntent: Stripe.PaymentIntent;
  try {
    const stripe = getStripe();
    paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency: "pln",
      receipt_email: email,
      automatic_payment_methods: { enabled: true },
      metadata,
    });
  } catch (err) {
    console.error("[kursy/create-payment-intent] Stripe error:", err);
    return NextResponse.json(
      { error: "Nie udało się utworzyć płatności." },
      { status: 502 },
    );
  }

  if (!paymentIntent.client_secret) {
    return NextResponse.json(
      { error: "Stripe nie zwrócił client_secret." },
      { status: 502 },
    );
  }

  return NextResponse.json({
    clientSecret: paymentIntent.client_secret,
    amount,
  });
}
