"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { toast } from "sonner";
import {
  WarningCircle,
  Sparkle,
  CircleNotch,
  CheckCircle,
  CalendarBlank,
} from "@phosphor-icons/react/dist/ssr";
import { Clock } from "@phosphor-icons/react";
import Image from "next/image";
import { format } from "date-fns";
import { pl } from "date-fns/locale";
import { ServiceCard } from "./ServiceCard";
import { BlockPickerModal } from "./BlockPickerModal";
import type { Service, ShopData } from "./types";
import { canBookServiceInBlock } from "./types";

interface ExtendedShopData extends ShopData {
  orders?: {
    id: string;
    status: string;
    startTime: string | null;
    service: Service;
  }[];
}

// --- POMOCNICZY KOMPONENT: ELEGANCKI DIVIDER ---
const SectionDivider = ({
  title,
  icon: Icon,
  colorClass,
  lineColorClass,
}: {
  title: string;
  icon: any;
  colorClass: string;
  lineColorClass: string;
}) => (
  <div className="flex items-center w-full my-2">
    <div
      className={`flex-1 h-px bg-gradient-to-r from-transparent ${lineColorClass}`}
    />
    <div className={`mx-4 flex items-center gap-2.5 ${colorClass}`}>
      <Icon size={22} weight="fill" />
      <h3 className="font-jakarta font-bold text-[16px] sm:text-[18px] uppercase tracking-widest text-center">
        {title}
      </h3>
    </div>
    <div
      className={`flex-1 h-px bg-gradient-to-l from-transparent ${lineColorClass}`}
    />
  </div>
);

export default function ServicesClient({ bookingId }: { bookingId: string }) {
  const [data, setData] = useState<ExtendedShopData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pickerFor, setPickerFor] = useState<Service | null>(null);

  const load = async () => {
    try {
      const res = await fetch(`/api/panel/wyjazdy/${bookingId}/sklep`, {
        cache: "no-store",
      });
      if (!res.ok) throw new Error("fetch failed");
      const json = await res.json();

      setData({
        services: json.services || [],
        blocks: json.blocks || [],
        orders: json.orders || [],
      });
    } catch {
      setError("Nie udało się załadować oferty. Spróbuj odświeżyć stronę.");
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bookingId]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const status = params.get("redirect_status");
    if (!status) return;

    if (status === "succeeded") {
      toast.success("Płatność zaksięgowana — zabieg zarezerwowany!");
    } else if (status === "processing") {
      toast.info("Płatność w trakcie przetwarzania.");
    } else {
      toast.error("Płatność nie powiodła się. Spróbuj ponownie.");
    }

    const url = new URL(window.location.href);
    [
      "redirect_status",
      "payment_intent",
      "payment_intent_client_secret",
    ].forEach((k) => url.searchParams.delete(k));
    window.history.replaceState({}, "", url.toString());
  }, []);

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 bg-rose-50/50 backdrop-blur-xl border border-rose-100 rounded-[28px] shadow-sm text-center">
        <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm mb-4">
          <WarningCircle size={32} weight="duotone" className="text-rose-500" />
        </div>
        <p className="text-[14px] font-bold text-rose-600">{error}</p>
      </div>
    );
  }

  if (data === null) {
    return (
      <div className="flex flex-col items-center justify-center py-24 bg-white/40 backdrop-blur-xl border border-white/60 rounded-[28px] shadow-sm text-center">
        <CircleNotch
          size={36}
          weight="bold"
          className="text-brand-primary animate-spin mb-4"
        />
        <p className="text-[12px] font-bold uppercase tracking-widest text-brand-primary/60">
          Przygotowujemy strefę zabiegów...
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-10">
      {/* SEKCJA: Wykupione zabiegi */}
      {data.orders && data.orders.length > 0 && (
        <div className="flex flex-col gap-6 relative">
          {/* NOWY DIVIDER */}
          <SectionDivider
            title="Twoje zarezerwowane zabiegi"
            icon={CheckCircle}
            colorClass="text-emerald-600"
            lineColorClass="to-emerald-200/80"
          />

          <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,320px),1fr))] gap-5 sm:gap-6">
            {data.orders.map((order) => {
              const isPaid = order.status === "PAID";
              const hasDate = !!order.startTime;

              return (
                <div
                  key={order.id}
                  className="group relative border border-white/80 rounded-[28px] p-5 shadow-[0_8px_30px_-12px_rgba(3,63,99,0.08)] hover:shadow-[0_12px_40px_-12px_rgba(3,63,99,0.12)] hover:-translate-y-1 transition-all duration-300 overflow-hidden flex flex-col gap-4 min-h-[140px] bg-white/40"
                >
                  {/* TŁO: ZDJĘCIE */}
                  {order.service?.image && (
                    <Image
                      src={order.service.image}
                      alt={order.service.name}
                      fill
                      sizes="(max-width: 768px) 100vw, 320px"
                      className="object-cover object-left-center opacity-70 z-0 transition-transform duration-1000 group-hover:scale-110"
                    />
                  )}

                  {/* TŁO: OVERLAY GRADIENT */}
                  <div className="absolute inset-0 z-0 bg-gradient-to-r from-white/100 via-white/80 to-transparent pointer-events-none" />

                  {/* Subtelny glow dla statusu */}
                  <div
                    className={`absolute -top-6 -right-6 w-24 h-24 rounded-full blur-[30px] opacity-60 transition-colors duration-500 pointer-events-none z-0 ${
                      isPaid ? "bg-emerald-300" : "bg-brand-yellow/50"
                    }`}
                  />

                  <div className="flex items-start justify-between gap-4 relative z-10">
                    <div className="w-14 h-14 rounded-2xl bg-white/80 backdrop-blur-md border border-white shadow-sm flex items-center justify-center text-brand-primary shrink-0 group-hover:scale-105 transition-transform duration-300">
                      <Sparkle size={26} weight="duotone" />
                    </div>

                    <div
                      className={`shrink-0 px-3 py-1.5 rounded-xl text-[11px] font-bold uppercase tracking-wider border flex items-center gap-1.5 backdrop-blur-md ${
                        isPaid
                          ? "bg-emerald-50/90 text-emerald-600 border-emerald-200/60 shadow-sm"
                          : "bg-amber-50/90 text-amber-600 border-amber-200/60 shadow-sm"
                      }`}
                    >
                      {isPaid ? (
                        <>
                          <CheckCircle size={14} weight="bold" />
                          Opłacone
                        </>
                      ) : (
                        <>
                          <Clock size={14} weight="bold" />
                          Oczekuje
                        </>
                      )}
                    </div>
                  </div>

                  <div className="relative z-10 mt-1 flex flex-col gap-2">
                    <h4 className="font-jakarta font-bold text-[17px] text-brand-secondary leading-snug mb-1 group-hover:text-brand-primary transition-colors drop-shadow-[0_2px_12px_rgba(255,255,255,1)]">
                      {order.service?.name}
                    </h4>

                    {hasDate && (
                      <div className="flex items-center gap-1.5 text-[13px] font-medium text-brand-secondary/90 bg-white/80 w-fit px-2.5 py-1.5 rounded-xl backdrop-blur-md border border-white shadow-sm">
                        <CalendarBlank
                          size={16}
                          weight="duotone"
                          className="text-brand-primary"
                        />
                        <span>
                          <strong className="text-brand-secondary font-bold">
                            {format(new Date(order.startTime!), "d MMMM", {
                              locale: pl,
                            })}
                          </strong>
                          <span className="mx-1.5 text-brand-secondary/30">
                            |
                          </span>
                          <strong className="text-brand-secondary font-bold">
                            {format(new Date(order.startTime!), "HH:mm")}
                          </strong>
                        </span>
                      </div>
                    )}

                    {order.service?.duration && (
                      <div className="flex items-center gap-1.5 text-[11.5px] font-medium text-brand-secondary/70 bg-white/60 w-fit px-2 py-1 rounded-lg backdrop-blur-sm border border-white/50">
                        <Clock
                          size={13}
                          weight="duotone"
                          className="text-brand-primary/60"
                        />
                        <span>
                          Czas trwania:{" "}
                          <strong className="text-brand-secondary">
                            {order.service.duration} min
                          </strong>
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* SEKCJA: Katalog SPA z responsywnym Gridem chroniącym przed łamaniem buttonów */}
      <div className="flex flex-col gap-6">
        {/* NOWY DIVIDER DLA SKLEPU */}
        <SectionDivider
          title="Katalog Zabiegów"
          icon={Sparkle}
          colorClass="text-brand-secondary"
          lineColorClass="to-brand-primary/30"
        />

        {data.services.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 bg-white/40 backdrop-blur-xl border border-white/60 rounded-[28px] shadow-sm text-center px-4">
            <Sparkle
              size={32}
              weight="duotone"
              className="text-brand-primary/40 mb-3"
            />
            <h3 className="font-jakarta font-bold text-[18px] text-brand-secondary mb-1">
              Katalog SPA jeszcze pusty
            </h3>
            <p className="text-[13px] font-medium text-brand-secondary/60 max-w-sm">
              Menu zabiegowe dla tego wyjazdu jest w trakcie przygotowywania.
              Wróć tu wkrótce!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,320px),1fr))] gap-6 sm:gap-8">
            {data.services.map((service, i) => {
              const freeBlocksForService = data.blocks.filter(
                (b) => !b.isMine && canBookServiceInBlock(service, b),
              ).length;

              const isPurchased = data.orders?.some(
                (o) => o.service.id === service.id,
              );

              return (
                <motion.div
                  key={service.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    delay: i * 0.08,
                    duration: 0.5,
                    ease: [0.16, 1, 0.3, 1],
                  }}
                >
                  <ServiceCard
                    service={service}
                    totalFreeBlocks={freeBlocksForService}
                    isPurchased={isPurchased}
                    onReserve={() => setPickerFor(service)}
                  />
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      <AnimatePresence>
        {pickerFor && (
          <BlockPickerModal
            service={pickerFor}
            blocks={data.blocks}
            bookingId={bookingId}
            onClose={() => setPickerFor(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
