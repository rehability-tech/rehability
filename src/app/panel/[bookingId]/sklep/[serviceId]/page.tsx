import React from "react";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { ArrowLeft } from "@phosphor-icons/react/dist/ssr";
import SlotPicker from "./_components/SlotPicker";

interface Props {
  params: Promise<{ bookingId: string; serviceId: string }>;
}

export default async function ServiceDetailPage({ params }: Props) {
  const { bookingId, serviceId } = await params;

  const [service, booking] = await Promise.all([
    prisma.campService.findUnique({
      where: { id: serviceId },
      include: {
        slots: {
          where: { isActive: true },
          include: { order: { select: { id: true, bookingId: true } } },
          orderBy: { startTime: "asc" },
        },
      },
    }),
    prisma.booking.findUnique({
      where: { id: bookingId },
      select: { id: true },
    }),
  ]);

  if (!service || !booking) notFound();

  const slots = service.slots.map((s) => ({
    id: s.id,
    startTime: s.startTime.toISOString(),
    endTime: s.endTime.toISOString(),
    isAvailable: s.order === null,
    isOwnedByMe: s.order?.bookingId === bookingId,
    orderId: s.order?.id ?? null,
  }));

  return (
    <div className="pt-6">
      <Link
        href={`/panel/${bookingId}/sklep`}
        className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-[#0B3B4C] mb-5 transition-colors"
      >
        <ArrowLeft size={16} />
        Powrót do listy
      </Link>

      <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm mb-6">
        <h1 className="font-jakarta font-bold text-xl text-[#0B3B4C]">
          {service.name}
        </h1>
        {service.description && (
          <p className="text-sm text-gray-500 mt-2">{service.description}</p>
        )}
        <div className="flex gap-4 mt-4">
          <div className="text-center">
            <p className="text-2xl font-jakarta font-bold text-[#0B3B4C]">
              {service.duration}
            </p>
            <p className="text-xs text-gray-400">minut</p>
          </div>
          <div className="w-px bg-gray-100" />
          <div className="text-center">
            <p className="text-2xl font-jakarta font-bold text-[#287D88]">
              {Number(service.price).toFixed(0)} zł
            </p>
            <p className="text-xs text-gray-400">cena</p>
          </div>
        </div>
      </div>

      <h2 className="font-semibold text-[#0B3B4C] text-sm mb-3">
        Dostępne terminy
      </h2>

      <SlotPicker slots={slots} bookingId={bookingId} />
    </div>
  );
}
