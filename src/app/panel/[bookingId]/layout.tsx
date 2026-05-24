import React from "react";
import { getServerSession } from "next-auth/next";
import { redirect, notFound } from "next/navigation";
import { authOptions } from "@/lib/auth/auth";
import { prisma } from "@/lib/prisma";
import UserSidebar from "../_components/UserSidebar";
import UserTopbar from "../_components/UserTopbar";

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

  const user = {
    name: session.user.name,
    image: session.user.image,
    email: session.user.email,
  };

  return (
    <>
      <UserSidebar bookingId={bookingId} />

      <div className="lg:pl-64 min-h-screen">
        <div className="hidden lg:block">
          <UserTopbar user={user} bookingId={bookingId} />
        </div>

        <div className="max-w-[1400px] mx-auto w-full lg:px-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
          {children}
        </div>
      </div>
    </>
  );
}
