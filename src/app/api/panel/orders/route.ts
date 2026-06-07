import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import Stripe from "stripe";
import { authOptions } from "@/lib/auth/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const createOrderSchema = z.object({
  bookingId: z.string().min(1),
  spaBlockId: z.string().min(1),
  serviceId: z.string().min(1),
  // Wolny blok: klient przesyła sub-slot. Whitelist: ignorowane (server użyje block range).
  startTime: z.coerce.date().optional(),
});

function getStripe(): Stripe {
  const secret = process.env.STRIPE_SECRET_KEY;
  if (!secret) throw new Error("Brak STRIPE_SECRET_KEY w środowisku.");
  return new Stripe(secret);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const parsed = createOrderSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Nieprawidłowe dane" }, { status: 400 });
  }

  const {
    bookingId,
    spaBlockId,
    serviceId,
    startTime: clientStart,
  } = parsed.data;

  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    select: {
      userId: true,
      email: true,
      tripId: true,
      trip: { select: { title: true } },
    },
  });

  if (!booking) {
    return NextResponse.json(
      { error: "Rezerwacja nie istnieje" },
      { status: 404 },
    );
  }

  const owns =
    booking.userId === session.user.id || booking.email === session.user.email;

  if (!owns) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const { orderId, amountPln, serviceName, slotStart } =
      await prisma.$transaction(async (tx) => {
        const block = await tx.spaBlock.findUnique({
          where: { id: spaBlockId },
          include: {
            orders: {
              where: { status: { not: "CANCELLED" } },
              select: {
                id: true,
                bookingId: true,
                serviceId: true,
                startTime: true,
                endTime: true,
              },
            },
            serviceCapacities: {
              select: { serviceId: true, capacity: true },
            },
          },
        });

        if (!block || !block.isActive || block.tripId !== booking.tripId) {
          throw new Error("BLOCK_NOT_FOUND");
        }

        const service = await tx.tripService.findUnique({
          where: { id: serviceId },
          select: {
            id: true,
            tripId: true,
            price: true,
            duration: true,
            name: true,
          },
        });
        if (!service || service.tripId !== booking.tripId) {
          throw new Error("SERVICE_NOT_FOUND");
        }

        const blockStartMs = block.startTime.getTime();
        const blockEndMs = block.endTime.getTime();
        const blockDurationMinutes = Math.round(
          (blockEndMs - blockStartMs) / 60000,
        );
        const durationMs = service.duration * 60_000;

        let slotStartMs: number;
        let slotEndMs: number;

        if (block.isOpen) {
          // Wolny blok: klient musiał podać startTime sub-slotu.
          if (!clientStart) throw new Error("SUB_SLOT_REQUIRED");
          if (service.duration > blockDurationMinutes) {
            throw new Error("SERVICE_TOO_LONG");
          }
          slotStartMs = clientStart.getTime();
          slotEndMs = slotStartMs + durationMs;
          if (slotStartMs < blockStartMs || slotEndMs > blockEndMs) {
            throw new Error("SUB_SLOT_OUT_OF_RANGE");
          }
          // Capacity check: w żadnym momencie [slotStart, slotEnd] liczba aktywnych
          // rezerwacji nie może przekroczyć block.capacity - 1.
          const events: { t: number; delta: number }[] = [];
          for (const o of block.orders) {
            // ! — pola są tymczasowo nullable w schemacie do czasu backfill+required.
            const oS = o.startTime!.getTime();
            const oE = o.endTime!.getTime();
            if (oS >= slotEndMs || oE <= slotStartMs) continue;
            events.push({ t: Math.max(oS, slotStartMs), delta: 1 });
            events.push({ t: Math.min(oE, slotEndMs), delta: -1 });
          }
          events.sort((a, b) => a.t - b.t || a.delta - b.delta);
          let cur = 0;
          let maxOverlap = 0;
          for (const e of events) {
            cur += e.delta;
            if (cur > maxOverlap) maxOverlap = cur;
          }
          if (maxOverlap + 1 > block.capacity) {
            throw new Error("SUB_SLOT_TAKEN");
          }
        } else {
          // Whitelist: rezerwacja pokrywa cały blok; per-service capacity.
          const sc = block.serviceCapacities.find(
            (s) => s.serviceId === serviceId,
          );
          if (!sc) throw new Error("SERVICE_NOT_IN_BLOCK");
          const takenForService = block.orders.filter(
            (o) => o.serviceId === serviceId,
          ).length;
          if (takenForService >= sc.capacity) {
            throw new Error("SERVICE_SLOT_FULL");
          }
          if (block.orders.some((o) => o.bookingId === bookingId)) {
            throw new Error("BLOCK_ALREADY_BOOKED_BY_ME");
          }
          slotStartMs = blockStartMs;
          slotEndMs = blockEndMs;
        }

        const order = await tx.serviceOrder.create({
          data: {
            bookingId,
            spaBlockId,
            serviceId,
            startTime: new Date(slotStartMs),
            endTime: new Date(slotEndMs),
            price: service.price,
            status: "PENDING",
          },
          select: { id: true },
        });

        return {
          orderId: order.id,
          amountPln: Number(service.price),
          serviceName: service.name,
          slotStart: new Date(slotStartMs),
        };
      });

    // Po wyjściu z transakcji — tworzymy PaymentIntent (embedded PaymentElement po stronie klienta).
    const stripe = getStripe();
    const amountGrosze = Math.round(amountPln * 100);

    let paymentIntent: Stripe.PaymentIntent;
    try {
      paymentIntent = await stripe.paymentIntents.create({
        amount: amountGrosze,
        currency: "pln",
        receipt_email: booking.email ?? undefined,
        automatic_payment_methods: { enabled: true },
        description: `Zabieg: ${serviceName} · ${slotStart.toLocaleString(
          "pl-PL",
          {
            day: "2-digit",
            month: "long",
            hour: "2-digit",
            minute: "2-digit",
          },
        )}`,
        metadata: {
          kind: "SERVICE_ORDER",
          orderId,
          bookingId,
        },
      });
    } catch (err) {
      console.error("[POST /api/panel/orders] Stripe PI error:", err);
      await prisma.serviceOrder.update({
        where: { id: orderId },
        data: { status: "CANCELLED" },
      });
      throw new Error("STRIPE_NO_URL");
    }

    if (!paymentIntent.client_secret) {
      await prisma.serviceOrder.update({
        where: { id: orderId },
        data: { status: "CANCELLED" },
      });
      throw new Error("STRIPE_NO_URL");
    }

    await prisma.serviceOrder.update({
      where: { id: orderId },
      data: { paymentIntentId: paymentIntent.id },
    });

    return NextResponse.json(
      {
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
        orderId,
        amount: amountGrosze,
      },
      { status: 201 },
    );
  } catch (e) {
    const msg = e instanceof Error ? e.message : "ERROR";
    const map: Record<string, { error: string; status: number }> = {
      // ↓ definicje znanych kodów ↓
      BLOCK_NOT_FOUND: {
        error: "Blok SPA nie istnieje lub jest nieaktywny.",
        status: 404,
      },
      BLOCK_FULL: {
        error: "Brak wolnych miejsc w tym bloku — wybierz inną godzinę.",
        status: 409,
      },
      BLOCK_ALREADY_BOOKED_BY_ME: {
        error: "Masz już rezerwację w tym bloku.",
        status: 409,
      },
      SERVICE_NOT_FOUND: {
        error: "Usługa nie należy do tego wyjazdu.",
        status: 404,
      },
      SERVICE_TOO_LONG: {
        error: "Ta usługa nie mieści się w wybranym bloku czasowym.",
        status: 409,
      },
      SERVICE_NOT_IN_BLOCK: {
        error: "Ta usługa nie jest dostępna w wybranym bloku.",
        status: 409,
      },
      SERVICE_SLOT_FULL: {
        error: "Brak wolnych miejsc tej usługi w wybranym bloku.",
        status: 409,
      },
      SUB_SLOT_REQUIRED: {
        error: "Wybierz godzinę rozpoczęcia w wolnym bloku.",
        status: 400,
      },
      SUB_SLOT_OUT_OF_RANGE: {
        error: "Wybrana godzina wykracza poza zakres bloku.",
        status: 422,
      },
      SUB_SLOT_TAKEN: {
        error: "Ten przedział czasu jest już zajęty — wybierz inny.",
        status: 409,
      },
      STRIPE_NO_URL: {
        error: "Nie udało się utworzyć płatności. Spróbuj ponownie.",
        status: 502,
      },
    };
    const out = map[msg];
    if (!out) {
      // Nieznany błąd — loguj pełny stack do terminala, żebyśmy widzieli przyczynę.
      console.error("[POST /api/panel/orders] Unhandled error:", e);
      return NextResponse.json(
        { error: "Nie udało się zarezerwować." },
        { status: 500 },
      );
    }
    return NextResponse.json({ error: out.error }, { status: out.status });
  }
}

export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const orderId = searchParams.get("orderId");

  if (!orderId) {
    return NextResponse.json({ error: "Brak orderId" }, { status: 400 });
  }

  const existing = await prisma.serviceOrder.findUnique({
    where: { id: orderId },
    include: { booking: { select: { userId: true, email: true } } },
  });

  if (!existing) {
    return NextResponse.json({ error: "Nie znaleziono" }, { status: 404 });
  }

  const owns =
    existing.booking.userId === session.user.id ||
    existing.booking.email === session.user.email;

  if (!owns || existing.status === "PAID") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await prisma.serviceOrder.update({
    where: { id: orderId },
    data: { status: "CANCELLED" },
  });

  return NextResponse.json({ ok: true });
}
