import React from "react";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import DashboardClient from "./_components/DashboardClient";

interface Props {
  params: Promise<{ bookingId: string }>;
}

export default async function BookingDashboardPage({ params }: Props) {
  const { bookingId } = await params;

  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: {
      camp: {
        select: {
          id: true,
          title: true,
          location: true,
          startDate: true,
          endDate: true,
          heroImage: true,
        },
      },
    },
  });

  if (!booking) notFound();

  return (
    <DashboardClient
      booking={{
        id: booking.id,
        qrToken: booking.qrToken,
        status: booking.status,
        isCheckedIn: booking.isCheckedIn,
        name: booking.name,
        email: booking.email,
        depositPaidAt: booking.depositPaidAt?.toISOString() ?? null,
        remainderPaidAt: booking.remainderPaidAt?.toISOString() ?? null,
      }}
      camp={{
        id: booking.camp.id,
        title: booking.camp.title,
        location: booking.camp.location,
        startDate: booking.camp.startDate.toISOString(),
        endDate: booking.camp.endDate.toISOString(),
        heroImage: booking.camp.heroImage,
      }}
    />
  );
}
