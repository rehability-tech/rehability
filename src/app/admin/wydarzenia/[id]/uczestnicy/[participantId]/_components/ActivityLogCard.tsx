"use client";

import { useMemo, useState } from "react";
import { motion, AnimatePresence, type Variants } from "framer-motion";
import {
  ClockCounterClockwise,
  CaretLeft,
  CaretRight,
  Tent,
  CurrencyCircleDollar,
  CheckCircle,
  HeartStraight,
  Sparkle,
} from "@phosphor-icons/react/dist/ssr";
import { formatDistanceToNow } from "date-fns";
import { pl } from "date-fns/locale";
import { cn } from "@/lib/utils";
import type { ParticipantData } from "@/types/participant";

type ActivityKind = "booking" | "deposit" | "payment" | "spa" | "health";

interface ActivityEvent {
  id: string;
  label: string;
  detail?: string;
  date: string;
  kind: ActivityKind;
}

const KIND_STYLES: Record<
  ActivityKind,
  { icon: React.ReactNode; wrap: string }
> = {
  booking: {
    icon: <Tent size={18} weight="duotone" />,
    wrap: "bg-blue-50 text-blue-600",
  },
  deposit: {
    icon: <CurrencyCircleDollar size={18} weight="duotone" />,
    wrap: "bg-amber-50 text-amber-600",
  },
  payment: {
    icon: <CheckCircle size={18} weight="fill" />,
    wrap: "bg-emerald-50 text-emerald-600",
  },
  spa: {
    icon: <Sparkle size={18} weight="fill" />,
    wrap: "bg-purple-50 text-purple-600",
  },
  health: {
    icon: <HeartStraight size={18} weight="fill" />,
    wrap: "bg-rose-50 text-rose-500",
  },
};

// Buduje oś czasu realnych akcji uczestniczki w obrębie tego wydarzenia.
function buildActivity(participant: ParticipantData): ActivityEvent[] {
  const events: ActivityEvent[] = [];

  // Rezerwacja wydarzenia
  if (participant.createdAt) {
    events.push({
      id: "booking-created",
      label: "Rezerwacja wydarzenia",
      date: participant.createdAt,
      kind: "booking",
    });
  }

  // Opłacenie zaliczki
  if (participant.depositPaidAt) {
    events.push({
      id: "deposit-paid",
      label: "Opłacenie zaliczki",
      detail: "Rezerwacja potwierdzona zadatkiem",
      date: participant.depositPaidAt,
      kind: "deposit",
    });
  }

  // Opłacenie całości
  if (participant.remainderPaidAt) {
    events.push({
      id: "remainder-paid",
      label: "Opłacenie całości wydarzenia",
      detail: "Pełna kwota uregulowana",
      date: participant.remainderPaidAt,
      kind: "payment",
    });
  }

  // Wypełnienie / aktualizacja karty zdrowia
  const hp = participant.user?.healthProfile;
  if (hp?.createdAt) {
    events.push({
      id: "health-created",
      label: "Wypełnienie karty zdrowia",
      date: hp.createdAt,
      kind: "health",
    });
    // Aktualizacja karty (jeśli edytowana wyraźnie później niż utworzona)
    if (
      hp.updatedAt &&
      new Date(hp.updatedAt).getTime() - new Date(hp.createdAt).getTime() >
        60_000
    ) {
      events.push({
        id: "health-updated",
        label: "Aktualizacja karty zdrowia",
        date: hp.updatedAt,
        kind: "health",
      });
    }
  }

  // Wykupienie usług dodatkowych / SPA
  for (const order of participant.serviceOrders || []) {
    const paid = order.status === "PAID";
    const date = order.paidAt || order.createdAt;
    if (!date) continue;
    events.push({
      id: `service-${order.id}`,
      label: paid
        ? `Wykupienie usługi: ${order.service?.name || "Usługa SPA"}`
        : `Rezerwacja usługi: ${order.service?.name || "Usługa SPA"}`,
      detail: paid
        ? `${Number(order.price).toLocaleString("pl-PL")} zł`
        : "Oczekuje na płatność",
      date,
      kind: "spa",
    });
  }

  // Najnowsze na górze
  return events.sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
  );
}

const listVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.06 } },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: "easeOut" } },
};

const PAGE_SIZE = 3;

export const ActivityLogCard = ({
  participant,
}: {
  participant: ParticipantData;
}) => {
  const events = useMemo(() => buildActivity(participant), [participant]);

  const [page, setPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(events.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageItems = events.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.45, ease: "easeOut" }}
      className="relative bg-white/60 backdrop-blur-xl rounded-3xl p-6 sm:p-8 shadow-[0_10px_30px_-10px_rgba(59,130,246,0.45)] hover:shadow-[0_16px_40px_-10px_rgba(59,130,246,0.6)] transition-shadow duration-300 border border-white/80 overflow-hidden"
    >
      {/* Niebieski glow w tle karty */}
      <div className="absolute -top-12 -right-12 w-48 h-48 bg-blue-400/10 rounded-full blur-[50px] pointer-events-none" />

      <div className="relative z-10 flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-400 to-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20">
            <ClockCounterClockwise size={24} weight="bold" />
          </div>
          <h2 className="font-jakarta font-bold text-xl text-brand-secondary leading-tight">
            Historia aktywności
          </h2>
        </div>
        <span className="px-3 py-1 rounded-md bg-slate-100 text-slate-600 text-sm font-bold border border-slate-200">
          {events.length}
        </span>
      </div>

      {events.length > 0 ? (
        <div className="relative z-10">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentPage}
              variants={listVariants}
              initial="hidden"
              animate="visible"
              className="flex flex-col gap-2.5"
            >
              {pageItems.map((ev) => {
                const style = KIND_STYLES[ev.kind];
                return (
                  <motion.div
                    key={ev.id}
                    variants={itemVariants}
                    className="flex min-h-[84px] items-center gap-3.5 p-4 rounded-2xl bg-white/70 border border-slate-100 hover:border-blue-200/60 transition-colors"
                  >
                    <div
                      className={cn(
                        "w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
                        style.wrap,
                      )}
                    >
                      {style.icon}
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="text-[14px] font-bold text-brand-secondary leading-tight">
                        {ev.label}
                      </p>
                      {ev.detail && (
                        <p className="text-[12.5px] text-slate-500 leading-snug mt-0.5">
                          {ev.detail}
                        </p>
                      )}
                      <p className="text-[11px] font-semibold text-slate-400 mt-1.5">
                        {formatDistanceToNow(new Date(ev.date), {
                          addSuffix: true,
                          locale: pl,
                        })}
                      </p>
                    </div>
                  </motion.div>
                );
              })}

              {/* Placeholdery dopełniające stronę do PAGE_SIZE — stała wysokość karty */}
              {Array.from({
                length: Math.max(0, PAGE_SIZE - pageItems.length),
              }).map((_, i) => (
                <div
                  key={`placeholder-${i}`}
                  aria-hidden
                  className="min-h-[84px] rounded-2xl border border-transparent"
                />
              ))}
            </motion.div>
          </AnimatePresence>

          {totalPages > 1 && (
            <div className="mt-5 flex items-center justify-between gap-2 pt-4 border-t border-slate-100">
              <span className="text-[11px] font-medium text-slate-400">
                Strona {currentPage} z {totalPages}
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  aria-label="Poprzednia strona"
                  className="flex items-center justify-center w-8 h-8 rounded-lg border border-slate-200 text-slate-500 enabled:hover:bg-white enabled:hover:text-blue-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <CaretLeft size={16} weight="bold" />
                </button>
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  aria-label="Następna strona"
                  className="flex items-center justify-center w-8 h-8 rounded-lg border border-slate-200 text-slate-500 enabled:hover:bg-white enabled:hover:text-blue-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <CaretRight size={16} weight="bold" />
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="relative z-10 text-center py-10 bg-slate-50/70 rounded-2xl border border-dashed border-slate-200">
          <p className="text-sm font-medium text-slate-500">
            Brak zarejestrowanej aktywności.
          </p>
        </div>
      )}
    </motion.div>
  );
};
