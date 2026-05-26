"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  MagnifyingGlass,
  Question,
  CurrencyCircleDollar,
  HeartStraight,
  Sparkle,
  User,
  Clock,
} from "@phosphor-icons/react/dist/ssr";

// ==========================================
// 1. TYPY I DANE TESTOWE
// ==========================================

interface Participant {
  id: string;
  name: string;
  email: string;
  amountPaid: number;
  paymentStatus: "PAID" | "DEPOSIT" | "PENDING_INVITATION" | "PENDING";
  healthCardFilled: boolean;
  hasExtraServices: boolean;
}

const MOCK_PARTICIPANTS: Participant[] = [
  {
    id: "1",
    name: "Anna Kowalska",
    email: "anna.k@example.com",
    amountPaid: 1800,
    paymentStatus: "PAID",
    healthCardFilled: true,
    hasExtraServices: true,
  },
  {
    id: "2",
    name: "Marta Wiśniewska",
    email: "marta.w@example.com",
    amountPaid: 600,
    paymentStatus: "DEPOSIT",
    healthCardFilled: false,
    hasExtraServices: false,
  },
  {
    id: "3",
    name: "Karolina Maj",
    email: "k.maj@example.com",
    amountPaid: 0,
    paymentStatus: "PENDING_INVITATION",
    healthCardFilled: false,
    hasExtraServices: false,
  },
  {
    id: "4",
    name: "Piotr Zając",
    email: "piotr.z@example.com",
    amountPaid: 1800,
    paymentStatus: "PAID",
    healthCardFilled: true,
    hasExtraServices: false,
  },
  {
    id: "5",
    name: "Joanna Lis",
    email: "asia.lis@example.com",
    amountPaid: 600,
    paymentStatus: "DEPOSIT",
    healthCardFilled: true,
    hasExtraServices: true,
  },
];

// ==========================================
// 2. KOMPONENTY IKON STATUSU
// ==========================================

function ParticipantStatusIcons({ p }: { p: Participant }) {
  const getPaymentIcon = () => {
    switch (p.paymentStatus) {
      case "PAID":
        return (
          <CurrencyCircleDollar
            size={18}
            weight="fill"
            className="text-emerald-500"
          />
        );
      case "DEPOSIT":
        return (
          <CurrencyCircleDollar
            size={18}
            weight="fill"
            className="text-amber-500"
          />
        );
      case "PENDING_INVITATION":
        return (
          <Clock
            size={18}
            weight="duotone"
            className="text-blue-500 animate-pulse"
          />
        );
      default:
        return (
          <CurrencyCircleDollar
            size={18}
            weight="regular"
            className="text-gray-300"
          />
        );
    }
  };

  const getPaymentTitle = () => {
    switch (p.paymentStatus) {
      case "PAID":
        return "Całość opłacona";
      case "DEPOSIT":
        return "Opłacono tylko zadatek (do dopłaty)";
      case "PENDING_INVITATION":
        return "Oczekuje na wpłatę (Zaproszenie 24h)";
      default:
        return "Brak wpłaty";
    }
  };

  return (
    <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
      {/* 1. STATUS PŁATNOŚCI */}
      <div
        title={getPaymentTitle()}
        className="flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gray-50 border border-gray-100 shrink-0"
      >
        {getPaymentIcon()}
      </div>

      {/* 2. STATUS KARTY ZDROWIA */}
      <div
        title={
          p.healthCardFilled ? "Karta zdrowia wypełniona" : "Brak karty zdrowia"
        }
        className="flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gray-50 border border-gray-100 shrink-0"
      >
        <HeartStraight
          size={18}
          weight={p.healthCardFilled ? "fill" : "regular"}
          className={p.healthCardFilled ? "text-rose-500" : "text-gray-300"}
        />
      </div>

      {/* 3. STATUS USŁUG DODATKOWYCH */}
      <div
        title={
          p.hasExtraServices
            ? "Wykupiono usługi dodatkowe"
            : "Brak usług dodatkowych"
        }
        className="flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gray-50 border border-gray-100 shrink-0"
      >
        <Sparkle
          size={18}
          weight={p.hasExtraServices ? "fill" : "regular"}
          className={p.hasExtraServices ? "text-purple-500" : "text-gray-300"}
        />
      </div>
    </div>
  );
}

// ==========================================
// 3. GŁÓWNY KOMPONENT
// ==========================================

export function TripParticipantsList() {
  const [searchQuery, setSearchQuery] = useState("");
  const params = useParams();

  // Pobieramy ID wyjazdu z URL (żeby zbudować poprawny link do profilu)
  // Fallback na "1" jeśli jesteśmy na stronie bez parametru ID
  const tripId = params?.id || params?.slug || "1";

  const filteredParticipants = MOCK_PARTICIPANTS.filter((p) =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <div className="flex flex-col h-[500px] sm:h-[450px] bg-white/70 backdrop-blur-xl border border-white/40 shadow-sm rounded-[24px] overflow-visible w-full max-w-full">
      {/* TOPBAR SEKCJI */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 sm:p-6 border-b border-gray-100/60 bg-white/50 relative z-20 rounded-t-[24px]">
        <div className="flex items-center justify-between sm:justify-start w-full sm:w-auto">
          <div className="flex items-center gap-3">
            <h3 className="font-jakarta text-[17px] sm:text-[18px] font-bold text-[#0B3B4C] leading-none">
              Uczestnicy
            </h3>
            <span className="px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 text-[12px] font-bold tabular-nums">
              {MOCK_PARTICIPANTS.length}
            </span>
          </div>

          {/* LEGENDA (Pytajnik z dropdownem na hover) */}
          <div className="relative group ml-1">
            <button className="flex items-center justify-center w-6 h-6 rounded-full bg-gray-100 text-gray-400 hover:bg-[#0B3B4C] hover:text-white transition-colors cursor-help">
              <Question size={14} weight="bold" />
            </button>

            <div className="absolute right-0 sm:left-0 sm:right-auto top-full mt-2 w-[calc(100vw-32px)] sm:w-72 max-w-[280px] p-4 bg-white border border-gray-100 shadow-[0_10px_40px_rgba(0,0,0,0.15)] rounded-[16px] opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all pointer-events-none z-50 flex flex-col gap-3">
              <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                Legenda wskaźników
              </p>

              <div className="flex items-start gap-3">
                <CurrencyCircleDollar
                  size={18}
                  weight="fill"
                  className="text-emerald-500 shrink-0 mt-0.5"
                />
                <p className="text-[12px] text-gray-600 leading-tight">
                  <strong className="text-gray-900 block">
                    Opłacone (Całość)
                  </strong>
                  Uczestniczka uregulowała całą należność.
                </p>
              </div>

              <div className="flex items-start gap-3">
                <CurrencyCircleDollar
                  size={18}
                  weight="fill"
                  className="text-amber-500 shrink-0 mt-0.5"
                />
                <p className="text-[12px] text-gray-600 leading-tight">
                  <strong className="text-gray-900 block">
                    Zadatek (do dopłaty)
                  </strong>
                  Resztę należy uregulować przed/na wyjeździe.
                </p>
              </div>

              <div className="flex items-start gap-3">
                <Clock
                  size={18}
                  weight="duotone"
                  className="text-blue-500 shrink-0 mt-0.5"
                />
                <p className="text-[12px] text-gray-600 leading-tight">
                  <strong className="text-gray-900 block">
                    Zaproszenie 24h
                  </strong>
                  Oczekuje na opłacenie zadatku.
                </p>
              </div>

              <div className="flex items-start gap-3 mt-1 pt-3 border-t border-gray-100">
                <HeartStraight
                  size={18}
                  weight="fill"
                  className="text-rose-500 shrink-0 mt-0.5"
                />
                <p className="text-[12px] text-gray-600 leading-tight">
                  Wypełniono formularz <strong>Karty Zdrowia</strong>.
                </p>
              </div>

              <div className="flex items-start gap-3">
                <Sparkle
                  size={18}
                  weight="fill"
                  className="text-purple-500 shrink-0 mt-0.5"
                />
                <p className="text-[12px] text-gray-600 leading-tight">
                  Dokupiono <strong>Usługi dodatkowe</strong> (np. masaże).
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* WYSZUKIWARKA */}
        <div className="relative w-full sm:w-64 mt-2 sm:mt-0">
          <MagnifyingGlass
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            type="text"
            placeholder="Szukaj uczestnika..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-white/60 border border-gray-200/60 rounded-xl text-[13px] text-[#0B3B4C] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-primary/30 transition-shadow"
          />
        </div>
      </div>

      {/* LISTA UCZESTNIKÓW (Scrollowalna zawartość) */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar p-2 sm:p-3 relative z-10">
        {filteredParticipants.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-400">
            <User size={32} weight="duotone" className="mb-2 opacity-50" />
            <p className="text-[13px] font-medium text-center">
              Nie znaleziono uczestników.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-1 w-full max-w-full">
            {filteredParticipants.map((participant, index) => (
              /* ZMIANA: Cały wiersz to teraz nawigujący Link */
              <Link
                key={participant.id}
                href={`/admin/wyjazdy/${tripId}/uczestnik/${participant.id}`}
                className="block outline-none"
              >
                <motion.div
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="flex items-center justify-between p-2.5 sm:p-3 rounded-[16px] hover:bg-white/80 transition-colors group cursor-pointer border border-transparent hover:border-gray-100 shadow-sm hover:shadow-md w-full max-w-full"
                >
                  {/* Info o uczestniku */}
                  <div className="flex items-center gap-2.5 sm:gap-3.5 min-w-0 flex-1 pr-2">
                    <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-[10px] sm:rounded-[12px] bg-gradient-to-br from-brand-primary/10 to-brand-secondary/10 flex items-center justify-center text-brand-secondary font-bold text-[12px] sm:text-[13px] shrink-0">
                      {participant.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")
                        .substring(0, 2)}
                    </div>

                    <div className="flex flex-col min-w-0 flex-1">
                      <span className="font-semibold text-[#0B3B4C] text-[13px] sm:text-[14px] truncate block w-full group-hover:text-brand-primary transition-colors">
                        {participant.name}
                      </span>
                      <span className="text-gray-400 text-[11px] sm:text-[12px] truncate block w-full">
                        {participant.email}
                      </span>
                    </div>
                  </div>

                  {/* Wskaźniki */}
                  <div className="flex items-center gap-2 sm:gap-6 shrink-0 pr-1">
                    <ParticipantStatusIcons p={participant} />

                    <div className="hidden sm:flex flex-col items-end min-w-[60px]">
                      <span className="text-[14px] font-bold text-[#0B3B4C] tabular-nums leading-none">
                        {participant.amountPaid} zł
                      </span>
                      <span className="text-[9px] text-gray-400 font-bold mt-1 uppercase tracking-wider">
                        Wpłacono
                      </span>
                    </div>
                  </div>
                </motion.div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
