import React from "react";
import { getServerSession } from "next-auth/next";
import { redirect, notFound } from "next/navigation";
import { authOptions } from "@/lib/auth/auth";
import { prisma } from "@/lib/prisma";
import ParticipantSidebar from "./_components/ParticipantSidebar";
import ParticipantBottomNav from "./_components/ParticipantBottomNav";

interface Props {
  children: React.ReactNode;
  params: Promise<{ bookingId: string }>;
}

export default async function ParticipantPanelLayout({
  children,
  params,
}: Props) {
  const { bookingId } = await params;
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/logowanie");
  }

  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    select: { userId: true, email: true },
  });

  if (!booking) {
    notFound();
  }

  const ownsById = booking.userId === session.user.id;
  const ownsByEmail = booking.email === session.user.email;

  if (!ownsById && !ownsByEmail) {
    redirect("/panel");
  }

  if (!booking.userId && ownsByEmail) {
    await prisma.booking.update({
      where: { id: bookingId },
      data: { userId: session.user.id },
    });
  }

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-[260px_1fr] font-montserrat">
      <ParticipantSidebar bookingId={bookingId} />

      <main className="flex flex-col min-w-0 min-h-screen w-full">
        <div className="max-w-[1400px] mx-auto w-full flex-1 px-4 lg:px-8 pt-6 pb-28 lg:pb-12">
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
            {children}
          </div>
        </div>
      </main>

      <ParticipantBottomNav bookingId={bookingId} />
    </div>
  );
}
