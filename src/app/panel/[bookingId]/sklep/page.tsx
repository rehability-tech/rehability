import React from "react";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import ServicesClient from "./_components/ServicesClient";

interface Props {
  params: Promise<{ bookingId: string }>;
}

export default async function SklepPage({ params }: Props) {
  const { bookingId } = await params;

  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    select: { campId: true },
  });

  if (!booking) notFound();

  const services = await prisma.campService.findMany({
    where: { campId: booking.campId },
    include: {
      slots: {
        where: { isActive: true },
        include: { order: { select: { id: true } } },
        orderBy: { startTime: "asc" },
      },
    },
    orderBy: { name: "asc" },
  });

  const serialized = services.map((s) => ({
    id: s.id,
    name: s.name,
    duration: s.duration,
    price: Number(s.price),
    description: s.description ?? null,
    availableSlots: s.slots.filter((sl) => sl.order === null).length,
    totalSlots: s.slots.length,
  }));

  return (
    <div className="pt-6">
      <div className="mb-6">
        <h1 className="font-jakarta font-bold text-2xl text-[#0B3B4C]">
          Zabiegi & Masaże
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Wybierz zabieg i zarezerwuj swój termin
        </p>
      </div>
      <ServicesClient services={serialized} bookingId={bookingId} />
    </div>
  );
}
