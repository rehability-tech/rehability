import React from "react";
import { notFound, redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth/auth";
import { prisma } from "@/lib/prisma";
import TimeGrid, { type SerializedEvent } from "./_components/TimeGrid";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function HarmonogramAdminPage({ params }: Props) {
  const { id } = await params;

  const session = await getServerSession(authOptions);
  if (!session || session.user?.role !== "ADMIN") {
    redirect("/logowanie");
  }

  const camp = await prisma.camp.findUnique({
    where: { id },
    select: {
      id: true,
      title: true,
      startDate: true,
      endDate: true,
    },
  });

  if (!camp) notFound();

  const events = await prisma.campEvent.findMany({
    where: { campId: id },
    orderBy: [{ startTime: "asc" }, { sortOrder: "asc" }],
  });

  const serialized: SerializedEvent[] = events.map((e) => ({
    id: e.id,
    title: e.title,
    description: e.description,
    startTime: e.startTime.toISOString(),
    endTime: e.endTime ? e.endTime.toISOString() : null,
    type: e.type,
    icon: e.icon,
    isPublished: e.isPublished,
    sortOrder: e.sortOrder,
  }));

  return (
    <div className="p-6 lg:p-8 max-w-[1400px] mx-auto w-full">
      <header className="mb-6">
        <p className="text-[11px] uppercase tracking-[0.18em] font-bold text-brand-secondary/40">
          Camp / Harmonogram
        </p>
        <h1 className="font-jakarta text-[26px] lg:text-[30px] font-bold text-brand-secondary leading-tight mt-1">
          {camp.title}
        </h1>
        <p className="text-sm text-brand-secondary/60 mt-1">
          Plan wyjazdu — kliknij w pustą przestrzeń dnia, aby dodać punkt.
        </p>
      </header>

      <TimeGrid
        campId={camp.id}
        startDate={camp.startDate.toISOString()}
        endDate={camp.endDate.toISOString()}
        initialEvents={serialized}
      />
    </div>
  );
}
