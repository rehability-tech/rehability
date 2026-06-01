import React from "react";
import { notFound, redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth/auth";
import { prisma } from "@/lib/prisma";
import ChatRoom from "@/components/chat/ChatRoom";

interface Props {
  params: Promise<{ bookingId: string }>;
}

export default async function ChatPage({ params }: Props) {
  const { bookingId } = await params;
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/logowanie");
  }

  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    select: {
      userId: true,
      email: true,
      trip: { select: { id: true, title: true } },
    },
  });

  if (!booking) notFound();

  const owns =
    booking.userId === session.user.id || booking.email === session.user.email;
  if (!owns) notFound();

  return (
    <div className="flex flex-col h-[calc(100dvh-220px)] min-h-[480px] lg:h-[calc(100dvh-180px)]">
      <ChatRoom
        tripId={booking.trip.id}
        variant="panel"
        title={`Czat · ${booking.trip.title}`}
        subtitle="Pisz z organizatorem i pozostałymi uczestniczkami"
      />
    </div>
  );
}
