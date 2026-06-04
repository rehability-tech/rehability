"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import {
  MagnifyingGlass,
  Question,
  CurrencyCircleDollar,
  HeartStraight,
  Sparkle,
  User,
  Clock,
  CaretLeft,
  CaretRight,
  UsersThree,
  SealCheck,
} from "@phosphor-icons/react/dist/ssr";
import { cn } from "@/lib/utils";

// ==========================================
// 1. TYPY I MAPOWANIE Z BAZY
// ==========================================

interface Participant {
  id: string;
  name: string | null;
  email: string;
  amountPaid: number;
  status: string; // PENDING | DEPOSIT_PAID | FULLY_PAID | PENDING_INVITATION
  isCheckedIn?: boolean;
  user?: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
    healthProfile?: any | null;
  } | null;
  serviceOrders?: any[];
  packagePartner?: {
    name?: string | null;
    relation: "inviter" | "guest";
    active: boolean;
  } | null;
}

interface TripParticipantsListProps {
  initialParticipants: Participant[];
  tripId: string;
}

const ITEMS_PER_PAGE = 8;

// ==========================================
// 2. KOMPONENTY IKON STATUSU
// ==========================================

function ParticipantStatusIcons({ p }: { p: Participant }) {
  const getPaymentStyle = () => {
    switch (p.status) {
      case "FULLY_PAID":
        return {
          wrapper:
            "bg-emerald-50 border-emerald-200/60 shadow-[0_2px_10px_-4px_rgba(16,185,129,0.3)]",
          icon: (
            <CurrencyCircleDollar
              size={18}
              weight="fill"
              className="text-emerald-500"
            />
          ),
        };
      case "DEPOSIT_PAID":
        return {
          wrapper:
            "bg-amber-50 border-amber-200/60 shadow-[0_2px_10px_-4px_rgba(245,158,11,0.3)]",
          icon: (
            <CurrencyCircleDollar
              size={18}
              weight="fill"
              className="text-amber-500"
            />
          ),
        };
      case "PENDING_INVITATION":
        return {
          wrapper:
            "bg-blue-50 border-blue-200/60 shadow-[0_2px_10px_-4px_rgba(59,130,246,0.3)]",
          icon: (
            <Clock
              size={18}
              weight="duotone"
              className="text-blue-500 animate-pulse"
            />
          ),
        };
      default:
        return {
          wrapper: "bg-gray-50/50 border-gray-200/50",
          icon: (
            <CurrencyCircleDollar
              size={18}
              weight="regular"
              className="text-gray-400"
            />
          ),
        };
    }
  };

  const getPaymentTitle = () => {
    switch (p.status) {
      case "FULLY_PAID":
        return "Całość opłacona";
      case "DEPOSIT_PAID":
        return "Opłacono tylko zadatek (do dopłaty)";
      case "PENDING_INVITATION":
        return "Oczekuje na wpłatę (Zaproszenie 24h)";
      default:
        return "Brak wpłaty / Oczekiwanie";
    }
  };

  const healthCardFilled = !!p.user?.healthProfile;
  const hasExtraServices = p.serviceOrders && p.serviceOrders.length > 0;
  const payment = getPaymentStyle();

  return (
    <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
      <div
        title={getPaymentTitle()}
        className={cn(
          "flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 rounded-full border shrink-0 transition-colors",
          payment.wrapper,
        )}
      >
        {payment.icon}
      </div>

      <div
        title={
          healthCardFilled ? "Karta zdrowia wypełniona" : "Brak karty zdrowia"
        }
        className={cn(
          "flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 rounded-full border shrink-0 transition-colors",
          healthCardFilled
            ? "bg-rose-50 border-rose-200/60 shadow-[0_2px_10px_-4px_rgba(244,63,94,0.3)]"
            : "bg-gray-50/50 border-gray-200/50",
        )}
      >
        <HeartStraight
          size={18}
          weight={healthCardFilled ? "fill" : "regular"}
          className={healthCardFilled ? "text-rose-500" : "text-gray-400"}
        />
      </div>

      <div
        title={
          hasExtraServices
            ? "Wykupiono usługi dodatkowe"
            : "Brak usług dodatkowych"
        }
        className={cn(
          "flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 rounded-full border shrink-0 transition-colors",
          hasExtraServices
            ? "bg-purple-50 border-purple-200/60 shadow-[0_2px_10px_-4px_rgba(168,85,247,0.3)]"
            : "bg-gray-50/50 border-gray-200/50",
        )}
      >
        <Sparkle
          size={18}
          weight={hasExtraServices ? "fill" : "regular"}
          className={hasExtraServices ? "text-purple-500" : "text-gray-400"}
        />
      </div>

      {p.isCheckedIn && (
        <div
          title="Odprawiona (check-in)"
          className="flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 rounded-full border shrink-0 bg-emerald-50 border-emerald-200/60 shadow-[0_2px_10px_-4px_rgba(16,185,129,0.4)]"
        >
          <SealCheck size={18} weight="fill" className="text-emerald-500" />
        </div>
      )}
    </div>
  );
}

// ==========================================
// 3. GŁÓWNY KOMPONENT
// ==========================================

export function TripParticipantsList({
  initialParticipants,
  tripId,
}: TripParticipantsListProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const filteredParticipants = initialParticipants.filter((p) => {
    const term = searchQuery.toLowerCase();
    const finalName = (p.name || p.user?.name || "").toLowerCase();
    const finalEmail = (p.email || p.user?.email || "").toLowerCase();
    return finalName.includes(term) || finalEmail.includes(term);
  });

  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  const totalPages =
    Math.ceil(filteredParticipants.length / ITEMS_PER_PAGE) || 1;
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const currentParticipants = filteredParticipants.slice(
    startIndex,
    startIndex + ITEMS_PER_PAGE,
  );

  return (
    <div className="flex flex-col bg-white/40 backdrop-blur-xl border border-white/60 shadow-[0_8px_30px_-10px_rgba(3,63,99,0.1)] rounded-[28px] w-full max-w-full relative overflow-hidden">
      <div className="absolute top-0 right-0 w-64 h-64 bg-brand-primary/5 rounded-full blur-[80px] pointer-events-none" />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 sm:p-6 border-b border-white/50 relative z-20">
        <div className="flex items-center justify-between sm:justify-start w-full sm:w-auto">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-[14px] bg-gradient-to-br from-brand-primary to-[#1f646d] shadow-md flex items-center justify-center">
              <User size={20} weight="fill" className="text-white" />
            </div>
            <h3 className="font-jakarta text-xl font-bold text-brand-secondary leading-none">
              Lista rezerwacji
            </h3>
            <span className="px-2.5 py-1 rounded-full bg-brand-primary/10 text-brand-primary text-[12px] font-bold tabular-nums">
              {initialParticipants.length}
            </span>
          </div>

          {/* LEGENDA */}
          <div className="relative group ml-2">
            <button className="flex items-center justify-center w-7 h-7 rounded-full bg-white border border-gray-200 text-gray-400 hover:bg-brand-yellow hover:border-brand-yellow hover:text-white shadow-sm transition-all cursor-help">
              <Question size={14} weight="bold" />
            </button>
            <div className="absolute right-0 sm:left-1/2 sm:-translate-x-1/2 top-[calc(100%+8px)] w-[calc(100vw-40px)] sm:w-[320px] p-5 bg-white/90 backdrop-blur-2xl border border-white/60 shadow-[0_20px_50px_-15px_rgba(3,63,99,0.2)] rounded-[20px] opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 pointer-events-none z-50 flex flex-col gap-4">
              {/* Opis legendy bez zmian */}
              <p className="text-[11px] font-bold text-brand-primary uppercase tracking-widest mb-1">
                Legenda wskaźników
              </p>
              <div className="flex items-start gap-3">
                <CurrencyCircleDollar
                  size={20}
                  weight="fill"
                  className="text-emerald-500 shrink-0 mt-0.5"
                />
                <p className="text-[12.5px] text-brand-secondary/70 leading-relaxed">
                  <strong className="text-brand-secondary block font-bold">
                    Opłacone (Całość)
                  </strong>{" "}
                  Uczestnik uregulował całą należność.
                </p>
              </div>
              <div className="flex items-start gap-3">
                <CurrencyCircleDollar
                  size={20}
                  weight="fill"
                  className="text-amber-500 shrink-0 mt-0.5"
                />
                <p className="text-[12.5px] text-brand-secondary/70 leading-relaxed">
                  <strong className="text-brand-secondary block font-bold">
                    Zadatek (do dopłaty)
                  </strong>{" "}
                  Resztę należy uregulować przed/na wyjeździe.
                </p>
              </div>
              <div className="flex items-start gap-3">
                <Clock
                  size={20}
                  weight="duotone"
                  className="text-blue-500 shrink-0 mt-0.5"
                />
                <p className="text-[12.5px] text-brand-secondary/70 leading-relaxed">
                  <strong className="text-brand-secondary block font-bold">
                    Zaproszenie 24h
                  </strong>{" "}
                  Oczekuje na opłacenie zadatku.
                </p>
              </div>
              <div className="w-full h-px bg-gray-100 my-1" />
              <div className="flex items-start gap-3">
                <HeartStraight
                  size={20}
                  weight="fill"
                  className="text-rose-500 shrink-0 mt-0.5"
                />
                <p className="text-[12.5px] text-brand-secondary/70 leading-relaxed">
                  Wypełniono formularz <strong>Karty Zdrowia</strong>.
                </p>
              </div>
              <div className="flex items-start gap-3">
                <Sparkle
                  size={20}
                  weight="fill"
                  className="text-purple-500 shrink-0 mt-0.5"
                />
                <p className="text-[12.5px] text-brand-secondary/70 leading-relaxed">
                  Dokupiono <strong>Usługi dodatkowe</strong> (np. masaże).
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* WYSZUKIWARKA */}
        <div className="relative w-full sm:w-72 mt-1 sm:mt-0 group">
          <MagnifyingGlass
            size={16}
            weight="bold"
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-brand-secondary/40 group-focus-within:text-brand-primary transition-colors"
          />
          <input
            type="text"
            placeholder="Szukaj po nazwisku lub e-mailu..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white/60 border border-white/50 rounded-[14px] text-[13px] font-medium text-brand-secondary placeholder:text-brand-secondary/40 focus:outline-none focus:ring-4 focus:ring-brand-primary/15 focus:border-brand-primary/30 focus:bg-white transition-all shadow-sm"
          />
        </div>
      </div>

      <div className="p-3 sm:p-4 relative z-10 min-h-[300px]">
        <AnimatePresence mode="wait">
          {filteredParticipants.length === 0 ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="flex flex-col items-center justify-center h-[250px] text-brand-secondary/40"
            >
              <div className="w-16 h-16 bg-white/80 rounded-full flex items-center justify-center shadow-sm border border-gray-100 mb-4">
                <User
                  size={32}
                  weight="duotone"
                  className="text-brand-primary/40"
                />
              </div>
              <p className="text-[14px] font-semibold text-center text-brand-secondary/60">
                Brak wyników wyszukiwania.
              </p>
            </motion.div>
          ) : (
            <motion.div
              key={`page-${currentPage}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="flex flex-col gap-2 w-full max-w-full"
            >
              {currentParticipants.map((participant) => {
                const displayName =
                  participant.name ||
                  participant.user?.name ||
                  "Nieznany uczestnik";
                const displayEmail =
                  participant.email ||
                  participant.user?.email ||
                  "Brak e-maila";
                const avatarUrl = participant.user?.image; // <--- Pobieramy zdjęcie!

                return (
                  <Link
                    key={participant.id}
                    href={`/admin/wyjazdy/${tripId}/uczestnicy/${participant.id}`}
                    className="group block outline-none"
                  >
                    <div className="relative overflow-hidden flex items-center justify-between p-3 sm:p-3.5 rounded-[20px] bg-white/50 border border-white hover:bg-white/90 hover:border-brand-primary/30 transition-all duration-300 shadow-sm hover:shadow-[0_8px_20px_-8px_rgba(40,125,136,0.2)] w-full max-w-full">
                      <div className="absolute -bottom-6 -right-6 w-20 h-20 bg-brand-yellow/0 rounded-full blur-xl pointer-events-none group-hover:bg-brand-yellow/20 transition-colors duration-500" />
                      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-0 bg-brand-primary rounded-r-full transition-all duration-300 group-hover:h-3/4 opacity-0 group-hover:opacity-100" />

                      <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1 pl-1 pr-2 z-10">
                        {/* ZDJĘCIE LUB INICJAŁY */}
                        <div className="relative w-10 h-10 sm:w-11 sm:h-11 rounded-[14px] overflow-hidden bg-gradient-to-br from-brand-primary from-[40%] to-brand-yellow flex items-center justify-center text-white font-bold text-[13px] sm:text-[14px] shrink-0 shadow-[0_2px_10px_-2px_rgba(40,125,136,0.5)] group-hover:scale-105 transition-transform duration-300">
                          {avatarUrl ? (
                            /* Używamy standardowego img dla bezproblemowej obsługi zewnętrznych URLi z Google/Fb */
                            <img
                              src={avatarUrl}
                              alt={displayName}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span>
                              {displayName
                                .split(" ")
                                .map((n) => n[0])
                                .join("")
                                .substring(0, 2)
                                .toUpperCase()}
                            </span>
                          )}
                        </div>

                        <div className="flex flex-col min-w-0 flex-1">
                          <span className="font-bold text-brand-secondary text-[13.5px] sm:text-[14.5px] truncate block w-full group-hover:text-brand-primary transition-colors">
                            {displayName}
                          </span>
                          <span className="text-brand-secondary/50 font-medium text-[11.5px] sm:text-[12px] truncate block w-full mt-0.5">
                            {displayEmail}
                          </span>
                          {participant.packagePartner && (
                            <span
                              title={`W pakiecie z: ${participant.packagePartner.name || "—"}`}
                              className={cn(
                                "inline-flex items-center gap-1 mt-1 w-fit max-w-full px-2 py-0.5 rounded-full text-[10px] font-bold truncate",
                                participant.packagePartner.active
                                  ? "bg-emerald-50 text-emerald-600 border border-emerald-100"
                                  : "bg-amber-50 text-amber-600 border border-amber-100",
                              )}
                            >
                              <UsersThree size={12} weight="fill" className="shrink-0" />
                              <span className="truncate">
                                {participant.packagePartner.name || "Pakiet"}
                              </span>
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 sm:gap-6 shrink-0 z-10">
                        <ParticipantStatusIcons p={participant} />

                        <div className="hidden sm:flex flex-col items-end min-w-[70px]">
                          <span className="text-[14.5px] font-bold text-brand-secondary tabular-nums leading-none">
                            {(
                              (participant.amountPaid || 0) / 100
                            ).toLocaleString("pl-PL")}{" "}
                            zł
                          </span>
                          <span className="text-[9px] text-brand-primary font-bold mt-1.5 uppercase tracking-widest">
                            Wpłacono
                          </span>
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between p-4 sm:p-5 border-t border-white/50 bg-white/30 mt-auto z-20">
          <span className="text-[12px] font-bold text-brand-secondary/50 tracking-wider uppercase">
            Strona {currentPage} z {totalPages}
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="flex items-center justify-center w-9 h-9 rounded-[12px] bg-white border border-gray-200 text-brand-secondary shadow-sm hover:bg-brand-primary hover:border-brand-primary hover:text-white disabled:opacity-40 disabled:hover:bg-white disabled:hover:border-gray-200 disabled:hover:text-brand-secondary disabled:cursor-not-allowed transition-all"
            >
              <CaretLeft size={16} weight="bold" />
            </button>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="flex items-center justify-center w-9 h-9 rounded-[12px] bg-white border border-gray-200 text-brand-secondary shadow-sm hover:bg-brand-primary hover:border-brand-primary hover:text-white disabled:opacity-40 disabled:hover:bg-white disabled:hover:border-gray-200 disabled:hover:text-brand-secondary disabled:cursor-not-allowed transition-all"
            >
              <CaretRight size={16} weight="bold" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
