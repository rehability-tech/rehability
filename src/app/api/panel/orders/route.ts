import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const createOrderSchema = z.object({
  slotId: z.string().min(1),
  bookingId: z.string().min(1),
});

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const parsed = createOrderSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "NieprawidL�owe dane" }, { status: 400 });
  }

  const { slotId, bookingId } = parsed.data;

  // Weryfikacja LLe booking naleLLy do sesji
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    select: { userId: true, email: true },
  });

  if (!booking) {
    return NextResponse.json({ error: "Rezerwacja nie istnieje" }, { status: 404 });
  }

  const owns =
    booking.userId === session.user.id ||
    booking.email === session.user.email;

  if (!owns) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Pobierz slot i sprawdLs dostępnoL�ć (z blokadą przez transakcję)
  const order = await prisma.$transaction(async (tx) => {
    const slot = await tx.serviceSlot.findUnique({
      where: { id: slotId },
      include: {
        order: { select: { id: true } },
        service: { select: { id: true, price: true } },
      },
    });

    if (!slot || !slot.isActive) {
      throw new Error("SLOT_NOT_FOUND");
    }

    if (slot.order !== null) {
      throw new Error("SLOT_TAKEN");
    }

    return tx.serviceOrder.create({
      data: {
        bookingId,
        slotId,
        serviceId: slot.service.id,
        price: slot.service.price,
        status: "PENDING",
      },
      include: {
        slot: { select: { startTime: true, endTime: true } },
        service: { select: { name: true, duration: true } },
      },
    });
  });

  return NextResponse.json({ order }, { status: 201 });
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
