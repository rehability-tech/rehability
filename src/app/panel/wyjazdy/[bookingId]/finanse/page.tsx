import React from "react";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import FinanceClient from "./_components/FinanceClient";

interface Props {
  params: Promise<{ bookingId: string }>;
}

export default async function FinansePage({ params }: Props) {
  const { bookingId } = await params;

  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: {
      trip: { select: { title: true, price: true, deposit: true } },
      serviceOrders: {
        where: { status: { not: "CANCELLED" } },
        include: {
          service: { select: { name: true } },
          slot: { select: { startTime: true } },
        },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!booking) notFound();

  const campPrice = Number(booking.trip.price);
  const campDeposit = Number(booking.trip.deposit);
  const servicesTotal = booking.serviceOrders.reduce(
    (sum, o) => sum + Number(o.price),
    0
  );
  const campRemainder = campPrice - campDeposit;

  const orders = booking.serviceOrders.map((o) => ({
    id: o.id,
    serviceName: o.service.name,
    slotTime: o.slot.startTime.toISOString(),
    price: Number(o.price),
    status: o.status,
    isPaid: o.status === "PAID",
  }));

  return (
    <div className="pt-6">
      <div className="mb-6">
        <h1 className="font-jakarta font-bold text-2xl text-[#0B3B4C]">
          Finanse
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Przegląd kosztów i status płatności
        </p>
      </div>

      <FinanceClient
        tripTitle={booking.trip.title}
        campPrice={campPrice}
        campDeposit={campDeposit}
        campRemainder={campRemainder}
        depositPaidAt={booking.depositPaidAt?.toISOString() ?? null}
        remainderPaidAt={booking.remainderPaidAt?.toISOString() ?? null}
        servicesTotal={servicesTotal}
        orders={orders}
      />
    </div>
  );
}
