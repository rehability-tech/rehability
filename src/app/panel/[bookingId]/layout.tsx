import React from "react";
import { getServerSession } from "next-auth/next";
import { redirect, notFound } from "next/navigation";
import { authOptions } from "@/lib/auth/auth";
import { prisma } from "@/lib/prisma";

interface Props {
  children: React.ReactNode;
  params: Promise<{ bookingId: string }>;
}

export default async function BookingLayout({ children, params }: Props) {
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

  // DostÄ™p: booking musi naleLLeÄ‡ do zalogowanej uczestniczki
  // Dopuszczamy teLL e-mail match â€” gdy booking istnieje, ale userId jeszcze nie byL‚ przypisany
  const ownsById = booking.userId === session.user.id;
  const ownsByEmail = booking.email === session.user.email;

  if (!ownsById && !ownsByEmail) {
    redirect("/panel");
  }

  // JeL›li booking istnieje, a userId nie byL‚ przypisany â€” przypisz przy pierwszym wejL›ciu
  if (!booking.userId && ownsByEmail) {
    await prisma.booking.update({
      where: { id: bookingId },
      data: { userId: session.user.id },
    });
  }

  return <>{children}</>;
}
