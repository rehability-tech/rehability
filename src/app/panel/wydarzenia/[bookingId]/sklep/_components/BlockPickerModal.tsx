"use client";

import { useMemo, useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import {
  Timer,
  CurrencyCircleDollar,
  WarningCircle,
  CircleNotch,
  X,
  Clock,
  CheckCircle,
} from "@phosphor-icons/react/dist/ssr";
import { cn } from "@/lib/utils";
import type { Service, SpaBlock, SubSlot } from "./types";
import { canBookServiceInBlock, computeOpenBlockSubSlots } from "./types";
import { OrderPaymentStep } from "./OrderPaymentStep";

function spotsAvailableForService(block: SpaBlock, service: Service): number {
  if (block.isOpen) return block.spotsAvailable;
  const sc = block.serviceCapacities.find((s) => s.serviceId === service.id);
  return sc?.spotsAvailable ?? 0;
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("pl-PL", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDay(iso: string) {
  return new Date(iso).toLocaleDateString("pl-PL", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

export function BlockPickerModal({
  service,
  blocks,
  bookingId,
  onClose,
}: {
  service: Service;
  blocks: SpaBlock[];
  bookingId: string;
  onClose: () => void;
}) {
  const [pending, setPending] = useState<string | null>(null);
  const [payment, setPayment] = useState<{
    clientSecret: string;
    amountGrosze: number;
    orderId: string;
    slotLabel: string;
  } | null>(null);

  // Stan potrzebny do sprawdzenia, czy jesteśmy na kliencie (wymagane przez Portal)
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Zablokuj scrollowanie pod spodem, gdy modal jest otwarty
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "unset";
    };
  }, []);

  const grouped = useMemo(() => {
    const free = blocks.filter(
      (b) => !b.isMine && canBookServiceInBlock(service, b),
    );
    const map = new Map<string, SpaBlock[]>();
    for (const b of free) {
      const key = new Date(b.startTime).toDateString();
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(b);
    }
    return Array.from(map.entries());
  }, [blocks, service]);

  const reserve = async (block: SpaBlock, subSlot?: SubSlot) => {
    // Klucz pending: dla open block = startTime sub-slotu, dla whitelist = block.id.
    const key = subSlot ? `${block.id}:${subSlot.startTime}` : block.id;
    setPending(key);
    try {
      const res = await fetch(`/api/panel/orders`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookingId,
          spaBlockId: block.id,
          serviceId: service.id,
          startTime: subSlot?.startTime,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(data.error ?? "Nie udało się zarezerwować.");
        return;
      }
      if (!data.clientSecret || !data.orderId) {
        toast.error("Nie udało się utworzyć płatności.");
        return;
      }
      // Przełączamy modal w tryb płatności — PaymentElement na clientSecret.
      const slotStartIso = subSlot?.startTime ?? block.startTime;
      const slotEndIso = subSlot?.endTime ?? block.endTime;
      setPayment({
        clientSecret: data.clientSecret,
        orderId: data.orderId,
        amountGrosze: data.amount,
        slotLabel: `${formatTime(slotStartIso)} – ${formatTime(slotEndIso)}`,
      });
    } catch {
      toast.error("Błąd sieci. Spróbuj ponownie.");
    } finally {
      setPending(null);
    }
  };

  // Jeśli nie zmontowano (SSR), zwracamy null, żeby uniknąć błędu hydratacji
  if (!mounted) return null;

  // Renderujemy modal w <div id="modal-root"> (lub body, jeśli nie masz takiego w layout.tsx)
  const modalRoot = document.getElementById("modal-root") || document.body;

  const modalContent = (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 z-[9998] bg-brand-secondary/60 backdrop-blur-sm"
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ type: "spring", stiffness: 320, damping: 32 }}
        className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 pointer-events-none"
      >
        <div className="relative w-full max-w-lg max-h-[90vh] flex flex-col bg-white border border-gray-100 rounded-[32px] shadow-2xl pointer-events-auto overflow-hidden">
          {/* HEADER MODALA */}
          <header className="relative px-6 py-6 border-b border-gray-100 bg-gradient-to-b from-gray-50/50 to-white shrink-0">
            <div className="pr-12">
              <span className="inline-block px-3 py-1 bg-brand-primary/10 text-brand-primary text-[11px] font-bold uppercase tracking-widest rounded-full mb-3">
                Wybierz Termin
              </span>
              <h2 className="font-jakarta text-[22px] font-bold text-brand-secondary leading-tight mb-3">
                {service.name}
              </h2>

              <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                <span className="inline-flex items-center gap-1.5 text-[12px] font-bold text-brand-primary bg-brand-primary/10 px-3 py-1.5 rounded-xl border border-brand-primary/10">
                  <Timer size={14} weight="duotone" />
                  {service.duration} min
                </span>
                <span className="inline-flex items-center gap-1.5 text-[12px] font-bold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-100">
                  <CurrencyCircleDollar size={14} weight="duotone" />
                  {service.price.toFixed(0)} zł
                </span>
              </div>
            </div>
            <button
              onClick={onClose}
              className="absolute top-6 right-6 w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 transition-colors"
            >
              <X size={18} weight="bold" />
            </button>
          </header>

          {/* WIDOK PŁATNOŚCI (po wybraniu sub-slotu) */}
          {payment ? (
            <div className="flex-1 overflow-y-auto px-6 py-6 bg-white space-y-4 custom-scrollbar">
              <div className="flex items-center justify-between gap-3 p-3 rounded-2xl bg-brand-primary/5 border border-brand-primary/15">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-brand-primary/70">
                    Rezerwujesz
                  </p>
                  <p className="text-[14px] font-bold text-brand-secondary tabular-nums">
                    {payment.slotLabel}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setPayment(null)}
                  className="text-[12px] font-bold text-brand-primary hover:underline shrink-0"
                >
                  ← Zmień termin
                </button>
              </div>
              <OrderPaymentStep
                clientSecret={payment.clientSecret}
                amountLabel={`${(payment.amountGrosze / 100).toFixed(2)} zł`}
                returnUrl={
                  typeof window !== "undefined"
                    ? `${window.location.origin}/panel/wydarzenia/${bookingId}/sklep`
                    : ""
                }
              />
            </div>
          ) : (
          /* LISTA TERMINÓW */
          <div className="flex-1 overflow-y-auto px-6 py-6 bg-gray-50/50 space-y-8 custom-scrollbar">
            {grouped.length === 0 && (
              <div className="text-center py-12">
                <div className="w-16 h-16 mx-auto bg-gray-100 rounded-full flex items-center justify-center mb-4">
                  <WarningCircle
                    size={32}
                    weight="duotone"
                    className="text-gray-400"
                  />
                </div>
                <p className="text-[15px] font-bold text-brand-secondary mb-1">
                  Brak wolnych miejsc
                </p>
                <p className="text-[13px] text-gray-500">
                  Niestety, wszystkie bloki dla tego zabiegu zostały już
                  zarezerwowane.
                </p>
              </div>
            )}

            {grouped.map(([day, items]) => (
              <div key={day}>
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-[1px] flex-1 bg-gray-200" />
                  <p className="text-[12px] font-bold text-gray-500 uppercase tracking-wider">
                    {formatDay(items[0].startTime)}
                  </p>
                  <div className="h-[1px] flex-1 bg-gray-200" />
                </div>

                <div className="grid grid-cols-1 gap-3">
                  {items.map((b) => {
                    // Open block → render kafelek z sub-slotami (siatka 15min).
                    if (b.isOpen) {
                      const subSlots = computeOpenBlockSubSlots(b, service);
                      if (subSlots.length === 0) return null;
                      return (
                        <div
                          key={b.id}
                          className="relative w-full p-4 rounded-[20px] bg-white border border-gray-100 overflow-hidden"
                        >
                          <div className="flex items-center gap-3 mb-3">
                            <div className="w-10 h-10 rounded-[14px] bg-brand-primary/10 flex items-center justify-center shrink-0">
                              <Clock
                                size={18}
                                weight="duotone"
                                className="text-brand-primary"
                              />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-[14px] font-bold text-brand-secondary tabular-nums">
                                {formatTime(b.startTime)}
                                <span className="text-gray-300 font-normal mx-1.5">
                                  →
                                </span>
                                {formatTime(b.endTime)}
                              </p>
                              <p className="text-[11px] font-medium text-gray-500 mt-0.5">
                                Wybierz dogodną godzinę startu ({service.duration}{" "}
                                min)
                              </p>
                            </div>
                          </div>

                          <div className="flex flex-wrap gap-2">
                            {subSlots.map((s) => {
                              const key = `${b.id}:${s.startTime}`;
                              const isPending = pending === key;
                              return (
                                <button
                                  key={s.startTime}
                                  onClick={() => reserve(b, s)}
                                  disabled={pending !== null}
                                  className="group inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-gray-50 border border-gray-100 hover:bg-brand-primary hover:border-brand-primary hover:text-white text-brand-secondary text-[12.5px] font-bold tabular-nums transition-colors disabled:opacity-60 disabled:cursor-wait"
                                >
                                  {isPending ? (
                                    <CircleNotch
                                      size={14}
                                      className="animate-spin"
                                      weight="bold"
                                    />
                                  ) : null}
                                  {formatTime(s.startTime)}
                                  <span className="text-gray-300 group-hover:text-white/60 font-normal">
                                    –
                                  </span>
                                  {formatTime(s.endTime)}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      );
                    }

                    // Whitelist → klasyczna pełna rezerwacja całego bloku.
                    const isPending = pending === b.id;
                    const spots = spotsAvailableForService(b, service);
                    return (
                      <button
                        key={b.id}
                        onClick={() => reserve(b)}
                        disabled={pending !== null}
                        className="group relative w-full flex items-center justify-between gap-4 p-4 rounded-[20px] bg-white border border-gray-100 hover:border-brand-primary/50 hover:shadow-lg transition-all text-left disabled:opacity-60 disabled:cursor-wait overflow-hidden"
                      >
                        <div className="absolute inset-0 bg-brand-primary/0 group-hover:bg-brand-primary/5 transition-colors pointer-events-none" />

                        <div className="flex items-center gap-4 relative z-10">
                          <div className="w-12 h-12 rounded-[16px] bg-gray-50 group-hover:bg-brand-primary/10 flex items-center justify-center shrink-0 transition-colors">
                            <Clock
                              size={20}
                              weight="duotone"
                              className="text-gray-500 group-hover:text-brand-primary transition-colors"
                            />
                          </div>
                          <div>
                            <p className="text-[16px] font-bold text-brand-secondary tabular-nums">
                              {formatTime(b.startTime)}{" "}
                              <span className="text-gray-300 font-normal mx-1">
                                →
                              </span>{" "}
                              {formatTime(b.endTime)}
                            </p>
                            <p
                              className={cn(
                                "text-[12px] font-medium mt-0.5",
                                spots === 1
                                  ? "text-amber-500"
                                  : "text-gray-500",
                              )}
                            >
                              {spots === 1
                                ? "Ostatnie wolne miejsce!"
                                : `Dostępne miejsca: ${spots}`}
                            </p>
                          </div>
                        </div>

                        <div className="relative z-10 pr-2">
                          {isPending ? (
                            <CircleNotch
                              size={20}
                              className="animate-spin text-brand-primary"
                              weight="bold"
                            />
                          ) : (
                            <div className="w-8 h-8 rounded-full border-2 border-gray-200 group-hover:border-brand-primary flex items-center justify-center transition-colors">
                              <CheckCircle
                                size={16}
                                weight="fill"
                                className="text-brand-primary opacity-0 group-hover:opacity-100 transition-opacity"
                              />
                            </div>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
          )}
        </div>
      </motion.div>
    </>
  );

  // Wstrzykujemy modal używając Portala!
  return createPortal(modalContent, modalRoot);
}
