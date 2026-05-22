"use client";

import React, { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import {
  CheckCircle,
  Lock,
  CalendarBlank,
  CircleNotch,
  Trash,
} from "@phosphor-icons/react/dist/ssr";

interface Slot {
  id: string;
  startTime: string;
  endTime: string;
  isAvailable: boolean;
  isOwnedByMe: boolean;
  orderId: string | null;
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

export default function SlotPicker({
  slots,
  bookingId,
}: {
  slots: Slot[];
  bookingId: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [activeSlotId, setActiveSlotId] = useState<string | null>(null);

  const grouped = useMemo(() => {
    const map = new Map<string, Slot[]>();
    for (const slot of slots) {
      const day = new Date(slot.startTime).toDateString();
      if (!map.has(day)) map.set(day, []);
      map.get(day)!.push(slot);
    }
    return Array.from(map.entries());
  }, [slots]);

  const handleBook = (slot: Slot) => {
    setActiveSlotId(slot.id);
    startTransition(async () => {
      try {
        const res = await fetch("/api/panel/orders", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ slotId: slot.id, bookingId }),
        });

        if (!res.ok) {
          const data = await res.json();
          if (data.error === "SLOT_TAKEN") {
            toast.error("Termin właśnie zajęto. Odświeżam listę...");
            router.refresh();
            return;
          }
          throw new Error(data.error ?? "Błąd serwera");
        }

        toast.success("Termin zarezerwowany!");
        router.refresh();
      } catch (err: unknown) {
        toast.error(err instanceof Error ? err.message : "Coś poszło nie tak");
      } finally {
        setActiveSlotId(null);
      }
    });
  };

  const handleCancel = (orderId: string) => {
    setActiveSlotId(orderId);
    startTransition(async () => {
      try {
        const res = await fetch(`/api/panel/orders?orderId=${orderId}`, {
          method: "DELETE",
        });

        if (!res.ok) throw new Error("Nie udało się anulować");

        toast.success("Rezerwacja anulowana");
        router.refresh();
      } catch {
        toast.error("Nie udało się anulować rezerwacji");
      } finally {
        setActiveSlotId(null);
      }
    });
  };

  if (slots.length === 0) {
    return (
      <div className="text-center py-12 text-gray-400">
        <CalendarBlank size={36} className="mx-auto mb-2 opacity-40" />
        <p className="text-sm">Brak dostępnych terminów.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-6">
      {grouped.map(([day, daySlots]) => (
        <div key={day}>
          <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3">
            {formatDay(daySlots[0].startTime)}
          </p>

          <div className="space-y-2">
            <AnimatePresence>
              {daySlots.map((slot) => {
                const isLoading = activeSlotId === slot.id || activeSlotId === slot.orderId;

                if (slot.isOwnedByMe) {
                  return (
                    <motion.div
                      key={slot.id}
                      initial={{ opacity: 0, scale: 0.97 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="flex items-center justify-between bg-[#EBF6F7] border border-[#287D88]/30 rounded-2xl px-4 py-3"
                    >
                      <div className="flex items-center gap-3">
                        <CheckCircle
                          size={20}
                          weight="fill"
                          className="text-[#287D88] shrink-0"
                        />
                        <div>
                          <p className="font-semibold text-[#0B3B4C] text-sm">
                            {formatTime(slot.startTime)} –{" "}
                            {formatTime(slot.endTime)}
                          </p>
                          <p className="text-[10px] text-[#287D88] font-medium">
                            Twoja rezerwacja
                          </p>
                        </div>
                      </div>

                      <button
                        onClick={() => slot.orderId && handleCancel(slot.orderId)}
                        disabled={isLoading}
                        className="text-gray-400 hover:text-red-500 transition-colors p-1.5 rounded-lg hover:bg-red-50"
                        aria-label="Anuluj rezerwację"
                      >
                        {isLoading ? (
                          <CircleNotch size={16} className="animate-spin" />
                        ) : (
                          <Trash size={16} />
                        )}
                      </button>
                    </motion.div>
                  );
                }

                if (!slot.isAvailable) {
                  return (
                    <div
                      key={slot.id}
                      className="flex items-center justify-between bg-gray-50 border border-gray-100 rounded-2xl px-4 py-3 opacity-50"
                    >
                      <div className="flex items-center gap-3">
                        <Lock size={18} className="text-gray-400 shrink-0" />
                        <p className="text-sm text-gray-400">
                          {formatTime(slot.startTime)} –{" "}
                          {formatTime(slot.endTime)}
                        </p>
                      </div>
                      <span className="text-[10px] text-gray-400 font-medium">
                        Zajęty
                      </span>
                    </div>
                  );
                }

                return (
                  <motion.button
                    key={slot.id}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    onClick={() => handleBook(slot)}
                    disabled={isLoading || pending}
                    className="w-full flex items-center justify-between bg-white border border-gray-200 hover:border-[#287D88] hover:shadow-md rounded-2xl px-4 py-3 transition-all active:scale-[0.98] disabled:opacity-60"
                  >
                    <p className="font-semibold text-[#0B3B4C] text-sm">
                      {formatTime(slot.startTime)} – {formatTime(slot.endTime)}
                    </p>
                    {isLoading ? (
                      <CircleNotch
                        size={16}
                        className="animate-spin text-[#287D88]"
                      />
                    ) : (
                      <span className="text-xs font-bold text-[#287D88] bg-[#EBF6F7] px-3 py-1 rounded-full">
                        Rezerwuj
                      </span>
                    )}
                  </motion.button>
                );
              })}
            </AnimatePresence>
          </div>
        </div>
      ))}
    </div>
  );
}
