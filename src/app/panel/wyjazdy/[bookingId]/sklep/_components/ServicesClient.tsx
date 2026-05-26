"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import {
  Timer,
  CurrencyCircleDollar,
  ArrowRight,
  WarningCircle,
  Sparkle,
} from "@phosphor-icons/react/dist/ssr";

interface Service {
  id: string;
  name: string;
  duration: number;
  price: number;
  description: string | null;
  availableSlots: number;
  totalSlots: number;
}

export default function ServicesClient({
  services,
  bookingId,
}: {
  services: Service[];
  bookingId: string;
}) {
  if (services.length === 0) {
    return (
      <div className="text-center py-16 text-gray-400">
        <Sparkle size={40} className="mx-auto mb-3 opacity-40" />
        <p className="text-sm">Brak dostępnych usług dla tego wyjazdu.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {services.map((service, i) => (
        <motion.div
          key={service.id}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.06 }}
        >
          <Link href={`/panel/wyjazdy/${bookingId}/sklep/${service.id}`}>
            <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm active:scale-[0.98] transition-transform">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <h3 className="font-jakarta font-bold text-[#0B3B4C] text-base leading-tight">
                    {service.name}
                  </h3>
                  {service.description && (
                    <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                      {service.description}
                    </p>
                  )}

                  <div className="flex items-center gap-3 mt-3">
                    <span className="inline-flex items-center gap-1 text-xs text-gray-500">
                      <Timer size={13} />
                      {service.duration} min
                    </span>
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#0B3B4C]">
                      <CurrencyCircleDollar size={13} />
                      {service.price.toFixed(0)} zł
                    </span>
                  </div>
                </div>

                <div className="flex flex-col items-end gap-2 shrink-0">
                  <ArrowRight size={18} className="text-gray-300 mt-1" />
                  <SlotBadge
                    available={service.availableSlots}
                    total={service.totalSlots}
                  />
                </div>
              </div>
            </div>
          </Link>
        </motion.div>
      ))}
    </div>
  );
}

function SlotBadge({
  available,
  total,
}: {
  available: number;
  total: number;
}) {
  if (total === 0) {
    return (
      <span className="text-[10px] text-gray-400 font-medium">
        Brak terminów
      </span>
    );
  }

  if (available === 0) {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-red-500 bg-red-50 px-2 py-0.5 rounded-full">
        <WarningCircle size={10} weight="fill" />
        Brak miejsc
      </span>
    );
  }

  const isLow = available <= 2;

  return (
    <span
      className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
        isLow
          ? "text-amber-600 bg-amber-50"
          : "text-emerald-600 bg-emerald-50"
      }`}
    >
      {available} {available === 1 ? "termin" : "terminy"}
    </span>
  );
}
