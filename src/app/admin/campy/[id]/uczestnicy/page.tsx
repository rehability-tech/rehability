import React from "react";
import { notFound, redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth/auth";
import { prisma } from "@/lib/prisma";
import {
  CheckCircle,
  Clock,
  XCircle,
  QrCode,
  Sparkle,
} from "@phosphor-icons/react/dist/ssr";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function UczestnicyPage({ params }: Props) {
  const { id } = await params;
  const session = await getServerSession(authOptions);

  if (!session || session.user?.role !== "ADMIN") redirect("/logowanie");

  const camp = await prisma.camp.findUnique({
    where: { id },
    select: { title: true, startDate: true, endDate: true, capacity: true },
  });

  if (!camp) notFound();

  const bookings = await prisma.booking.findMany({
    where: { campId: id, status: { not: "CANCELLED" } },
    include: {
      serviceOrders: {
        where: { status: { not: "CANCELLED" } },
        include: {
          service: { select: { name: true } },
          slot: { select: { startTime: true } },
        },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  const checkedInCount = bookings.filter((b) => b.isCheckedIn).length;
  const confirmedCount = bookings.filter(
    (b) => b.status === "DEPOSIT_PAID" || b.status === "FULLY_PAID",
  ).length;

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* NagL�Alwek */}
      <div className="mb-6">
        <h1 className="font-jakarta font-bold text-2xl text-[#0B3B4C]">
          Uczestnicy
        </h1>
        <p className="text-sm text-gray-500 mt-1">{camp.title}</p>
      </div>

      {/* Statystyki */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <StatCard
          value={bookings.length}
          max={camp.capacity}
          label="Rezerwacji"
          color="text-[#0B3B4C]"
        />
        <StatCard
          value={confirmedCount}
          label="Potwierdzonych"
          color="text-emerald-600"
        />
        <StatCard
          value={checkedInCount}
          label="Zameldowanych"
          color="text-[#287D88]"
        />
      </div>

      {/* Tabela */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left px-4 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wide">
                  Uczestniczka
                </th>
                <th className="text-left px-4 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wide">
                  Status
                </th>
                <th className="text-center px-4 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wide">
                  Check-in
                </th>
                <th className="text-left px-4 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wide">
                  Zabiegi
                </th>
                <th className="text-left px-4 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wide">
                  Zadatek
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {bookings.map((booking) => (
                <tr key={booking.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3.5">
                    <p className="font-semibold text-[#0B3B4C]">
                      {booking.name ?? "—"}
                    </p>
                    <p className="text-xs text-gray-400">{booking.email}</p>
                    {booking.phone && (
                      <p className="text-xs text-gray-400">{booking.phone}</p>
                    )}
                  </td>

                  <td className="px-4 py-3.5">
                    <StatusBadge status={booking.status} />
                  </td>

                  <td className="px-4 py-3.5 text-center">
                    {booking.isCheckedIn ? (
                      <div className="flex flex-col items-center gap-0.5">
                        <CheckCircle
                          size={20}
                          weight="fill"
                          className="text-emerald-500"
                        />
                        {booking.checkedInAt && (
                          <span className="text-[10px] text-gray-400">
                            {new Date(booking.checkedInAt).toLocaleTimeString(
                              "pl-PL",
                              { hour: "2-digit", minute: "2-digit" }
                            )}
                          </span>
                        )}
                      </div>
                    ) : (
                      <QrCode size={20} className="text-gray-300 mx-auto" />
                    )}
                  </td>

                  <td className="px-4 py-3.5">
                    {booking.serviceOrders.length === 0 ? (
                      <span className="text-xs text-gray-300">—</span>
                    ) : (
                      <div className="space-y-1">
                        {booking.serviceOrders.map((order) => (
                          <div
                            key={order.id}
                            className="flex items-center gap-1.5"
                          >
                            <Sparkle
                              size={11}
                              weight="fill"
                              className={
                                order.status === "PAID"
                                  ? "text-emerald-500"
                                  : "text-amber-400"
                              }
                            />
                            <span className="text-xs text-gray-600">
                              {order.service.name}
                            </span>
                            <span className="text-[10px] text-gray-400">
                              {new Date(
                                order.slot.startTime
                              ).toLocaleTimeString("pl-PL", {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </td>

                  <td className="px-4 py-3.5">
                    {booking.depositPaidAt ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                        <CheckCircle size={10} weight="fill" />
                        OpL�acony
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
                        <Clock size={10} weight="fill" />
                        Oczekuje
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {bookings.length === 0 && (
            <div className="text-center py-12 text-gray-400">
              <p className="text-sm">Brak rezerwacji dla tego wyjazdu.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({
  value,
  max,
  label,
  color,
}: {
  value: number;
  max?: number;
  label: string;
  color: string;
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 text-center">
      <p className={`text-3xl font-jakarta font-bold ${color}`}>
        {value}
        {max !== undefined && (
          <span className="text-base text-gray-300">/{max}</span>
        )}
      </p>
      <p className="text-xs text-gray-400 mt-1">{label}</p>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; className: string; icon: React.ReactNode }> = {
    DEPOSIT_PAID: {
      label: "Zadatek",
      className: "text-emerald-600 bg-emerald-50",
      icon: <CheckCircle size={11} weight="fill" />,
    },
    FULLY_PAID: {
      label: "Opłacona",
      className: "text-emerald-700 bg-emerald-100",
      icon: <CheckCircle size={11} weight="fill" />,
    },
    PENDING: {
      label: "Oczekuje",
      className: "text-amber-600 bg-amber-50",
      icon: <Clock size={11} weight="fill" />,
    },
    PENDING_INVITATION: {
      label: "Zaproszenie",
      className: "text-blue-600 bg-blue-50",
      icon: <Clock size={11} weight="fill" />,
    },
    EXPIRED: {
      label: "WygasL�a",
      className: "text-gray-500 bg-gray-50",
      icon: <XCircle size={11} weight="fill" />,
    },
  };

  const cfg = map[status] ?? map["PENDING"];

  return (
    <span
      className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full ${cfg.className}`}
    >
      {cfg.icon}
      {cfg.label}
    </span>
  );
}
