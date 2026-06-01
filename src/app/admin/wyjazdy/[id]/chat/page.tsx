import React from "react";
import { notFound, redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth/auth";
import { prisma } from "@/lib/prisma";
import ChatRoom from "@/components/chat/ChatRoom";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function AdminChatPage({ params }: Props) {
  const { id } = await params;

  // Weryfikacja uprawnień (obrona w głąb, niezależnie od guardu w /admin/layout.tsx).
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "ADMIN") {
    redirect("/logowanie");
  }

  const trip = await prisma.trip.findUnique({
    where: { id },
    select: {
      id: true,
      title: true,
      _count: { select: { bookings: true } },
    },
  });

  if (!trip) notFound();

  return (
    <div className="flex flex-col h-[calc(100dvh-220px)] min-h-[480px] lg:h-[calc(100dvh-180px)]">
      <ChatRoom
        tripId={trip.id}
        variant="admin"
        title={`Czat · ${trip.title}`}
        subtitle={`Piszesz jako organizator do ${trip._count.bookings} uczestniczek`}
      />
    </div>
  );
}
