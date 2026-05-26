import React from "react";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth/auth";
import TimelineClient from "./_components/TimelineClient";

interface Props {
  params: Promise<{ bookingId: string }>;
}

export default async function HarmonogramPage({ params }: Props) {
  const { bookingId } = await params;
  const session = await getServerSession(authOptions);

  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    select: { tripId: true, userId: true, email: true },
  });

  if (!booking) notFound();

  const [campEvents, serviceOrders] = await Promise.all([
    prisma.tripEvent.findMany({
      where: { tripId: booking.tripId, isPublished: true },
      orderBy: [{ startTime: "asc" }, { sortOrder: "asc" }],
    }),
    prisma.serviceOrder.findMany({
      where: { bookingId, status: { not: "CANCELLED" } },
      include: {
        slot: { select: { startTime: true, endTime: true } },
        service: { select: { name: true, duration: true } },
      },
      orderBy: { slot: { startTime: "asc" } },
    }),
  ]);

  const events = campEvents.map((e) => ({
    id: e.id,
    kind: "event" as const,
    title: e.title,
    description: e.description ?? null,
    startTime: e.startTime.toISOString(),
    endTime: e.endTime?.toISOString() ?? null,
    type: e.type as string,
    icon: e.icon ?? null,
  }));

  const orders = serviceOrders.map((o) => ({
    id: o.id,
    kind: "order" as const,
    title: o.service.name,
    description: `${o.service.duration} min · ${Number(o.price).toFixed(0)} zł`,
    startTime: o.slot.startTime.toISOString(),
    endTime: o.slot.endTime.toISOString(),
    type: "ORDER",
    icon: null,
    status: o.status,
    isPaid: o.status === "PAID",
  }));

  const timeline = [...events, ...orders].sort(
    (a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
  );

  return (
    <div className="pt-6">
      <div className="mb-6">
        <h1 className="font-jakarta font-bold text-2xl text-[#0B3B4C]">
          Mój harmonogram
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Plan wyjazdu i Twoje zarezerwowane zabiegi
        </p>
      </div>
      <TimelineClient timeline={timeline} />
    </div>
  );
}
