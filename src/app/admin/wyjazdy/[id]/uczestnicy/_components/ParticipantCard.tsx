"use client";

import React, { useMemo } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  CurrencyCircleDollar,
  HeartStraight,
  Sparkle,
  Phone,
  EnvelopeSimple,
  CaretRight,
  Receipt,
  UsersThree,
} from "@phosphor-icons/react/dist/ssr";

interface ParticipantDTO {
  id: string;
  name?: string;
  email?: string;
  phone?: string;
  status?: string;
  amountPaid?: number;
  user?: {
    name?: string;
    email?: string;
    phone?: string;
    image?: string;
    healthProfile?: any;
  };
  serviceOrders?: any[];
  packagePartner?: {
    name?: string | null;
    relation: "inviter" | "guest";
    active: boolean;
  } | null;
}

interface ParticipantCardProps {
  participant: ParticipantDTO;
  tripId: string;
  index: number;
}

export const ParticipantCard = React.memo(function ParticipantCard({
  participant,
  tripId,
  index,
}: ParticipantCardProps) {
  const data = useMemo(() => {
    const spaCount = participant?.serviceOrders?.length || 0;
    let spaText: string | null = null;
    if (spaCount === 1) spaText = "1 zabieg";
    else if (spaCount >= 2 && spaCount <= 4) spaText = `${spaCount} zabiegi`;
    else if (spaCount > 4) spaText = `${spaCount} zabiegów`;

    const baseAmount = participant?.amountPaid || 0;
    const additionalAmount =
      participant?.serviceOrders?.reduce(
        (sum: number, order: any) => sum + (order.price || 0),
        0,
      ) || 0;

    const formatPLN = (amount: number) => {
      return new Intl.NumberFormat("pl-PL", {
        style: "currency",
        currency: "PLN",
        maximumFractionDigits: 0,
      }).format(amount);
    };

    const rawName =
      participant?.name || participant?.user?.name || "Brak danych";
    const initials =
      rawName !== "Brak danych"
        ? rawName
            .split(" ")
            .map((n) => n[0])
            .join("")
            .substring(0, 2)
            .toUpperCase()
        : "?";

    const phone = participant?.phone || participant?.user?.phone;

    return {
      id: participant?.id,
      name: rawName,
      initials,
      email: participant?.email || participant?.user?.email,
      phone: phone || "Brak telefonu",
      phoneTelUrl: phone ? phone.replace(/\s+/g, "") : "",
      isPaid: participant?.status === "FULLY_PAID",
      hasHealth: !!participant?.user?.healthProfile,
      spaText,
      avatarUrl: participant?.user?.image,
      // amountPaid trzymane jest w GROSZACH → dzielimy przez 100 (inaczej 75000 zamiast 750).
      // Kwoty usług (order.price) są już w złotówkach — ich nie dzielimy.
      baseAmountFormatted: formatPLN(baseAmount / 100),
      additionalAmountFormatted: formatPLN(additionalAmount),
    };
  }, [participant]);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: Math.min(index * 0.04, 0.4), ease: "easeOut" }}
      className="bg-white/90 backdrop-blur-sm p-2.5 rounded-[32px] rounded-tr-none border border-gray-100 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.04)] hover:shadow-md hover:border-brand-primary/20 transition-all duration-300 flex flex-row gap-2 group relative  max-w-[1050px]"
    >
      <div className="absolute inset-0 pointer-events-none z-0">
        <div className="absolute -top-12 -left-10 w-40 h-40 bg-brand-primary/10 rounded-full blur-[32px] group-hover:bg-brand-primary/20 transition-colors duration-500" />
        <div className="absolute -bottom-16 right-10 w-48 h-48 bg-amber-400/10 rounded-full blur-[32px] group-hover:bg-amber-400/20 transition-colors duration-500" />
      </div>

      <div className="relative z-10 flex-1 flex flex-row items-center gap-4 px-2 sm:px-4 py-3 shrink-0 w-fit">
        <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full overflow-hidden bg-white/80 backdrop-blur-sm flex items-center justify-center text-brand-primary shrink-0 border-2 border-white shadow-sm font-bold text-sm sm:text-lg group-hover:border-brand-primary/30 transition-colors">
          {data.avatarUrl ? (
            <img
              src={data.avatarUrl}
              alt={data.name}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          ) : (
            <span>{data.initials}</span>
          )}
        </div>

        <div className="flex flex-col min-w-0">
          <h3
            className="font-extrabold text-slate-800 text-[15px] sm:text-[17px] truncate leading-tight group-hover:text-brand-primary transition-colors mb-1.5"
            title={data.name}
          >
            {data.name}
          </h3>

          {participant.packagePartner && (
            <span
              title={`W pakiecie z: ${participant.packagePartner.name || "—"}`}
              className={`inline-flex items-center gap-1 mb-1.5 w-fit max-w-full px-2 py-0.5 rounded-full text-[10px] font-bold truncate ${
                participant.packagePartner.active
                  ? "bg-emerald-50 text-emerald-600 border border-emerald-100"
                  : "bg-amber-50 text-amber-600 border border-amber-100"
              }`}
            >
              <UsersThree size={12} weight="fill" className="shrink-0" />
              <span className="truncate">
                Pakiet: {participant.packagePartner.name || "—"}
              </span>
            </span>
          )}

          <div className="flex flex-col gap-1.5 text-[11px] sm:text-[12px] text-slate-500 font-medium relative z-10">
            <div className="flex items-center gap-2 truncate">
              <EnvelopeSimple
                size={15}
                weight="bold"
                className="text-brand-primary shrink-0"
              />
              {data.email ? (
                <a
                  href={`mailto:${data.email}`}
                  className="truncate hover:text-brand-primary hover:underline focus:outline-none focus:ring-2 focus:ring-brand-primary/20 rounded"
                  title={`Napisz e-mail do: ${data.email}`}
                  onClick={(e) => e.stopPropagation()}
                >
                  {data.email}
                </a>
              ) : (
                <span className="truncate">Brak e-maila</span>
              )}
            </div>

            <div className="flex items-center gap-2 truncate">
              <Phone
                size={15}
                weight="bold"
                className="text-brand-primary shrink-0"
              />
              {data.phone !== "Brak telefonu" ? (
                <a
                  href={`tel:${data.phoneTelUrl}`}
                  className="truncate hover:text-brand-primary hover:underline focus:outline-none focus:ring-2 focus:ring-brand-primary/20 rounded"
                  title={`Zadzwoń: ${data.phone}`}
                  onClick={(e) => e.stopPropagation()}
                >
                  {data.phone}
                </a>
              ) : (
                <span className="truncate">Brak telefonu</span>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="relative z-10 flex flex-row items-center gap-2 sm:gap-6 shrink-0">
        {/* ==========================================
            STREFA 2A: STATUSY WIDOK MOBILNY (< 707px)
            ========================================== */}
        <div className="flex min-[707px]:hidden sm:flex-row items-center justify-center gap-1.5 px-2 max-[410px]:flex-col max-[410px]:mr-5">
          {/* Status płatności */}
          <div
            className={`flex items-center justify-center w-8 h-8 rounded-full shadow-sm border border-white/50 ${data.isPaid ? "bg-emerald-100 text-emerald-600" : "bg-amber-100 text-amber-600"}`}
            title={data.isPaid ? "Opłacone" : "Zaliczka"}
          >
            <CurrencyCircleDollar size={18} weight="bold" />
          </div>
          {/* Status zdrowia */}
          <div
            className={`flex items-center justify-center w-8 h-8 rounded-full shadow-sm border border-white/50 ${data.hasHealth ? "bg-rose-100 text-rose-600" : "bg-slate-100 text-slate-400"}`}
            title={data.hasHealth ? "Zdrowie: Wypełniono" : "Zdrowie: Brak"}
          >
            <HeartStraight
              size={18}
              weight={data.hasHealth ? "fill" : "bold"}
            />
          </div>
          {/* Opcjonalne dodatki SPA */}
          {data.spaText && (
            <div
              className="flex items-center justify-center w-8 h-8 rounded-full shadow-sm border border-white/50 bg-purple-100 text-purple-600"
              title={`Dodatki: ${data.spaText}`}
            >
              <Sparkle size={18} weight="fill" />
            </div>
          )}
        </div>

        {/* ==========================================
            STREFA 2B: STATUSY WIDOK DESKTOP (>= 707px)
            ========================================== */}
        <div className="hidden min-[707px]:flex bg-slate-50/80 backdrop-blur-sm rounded-[24px] p-4 flex-col justify-center w-[260px] border border-slate-100/50">
          <div className="flex flex-col gap-2 w-full">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Status
              </span>
              <span
                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wide ${
                  data.isPaid
                    ? "bg-emerald-100/80 text-emerald-700"
                    : "bg-amber-100/80 text-amber-700"
                }`}
              >
                <CurrencyCircleDollar size={14} weight="bold" />
                {data.isPaid ? "Opłacone" : "Zaliczka"}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Zdrowie
              </span>
              <span
                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wide ${
                  data.hasHealth
                    ? "bg-rose-100/80 text-rose-700"
                    : "bg-white/80 border border-slate-200/80 text-slate-400"
                }`}
              >
                <HeartStraight
                  size={14}
                  weight={data.hasHealth ? "fill" : "bold"}
                />
                {data.hasHealth ? "Wypełniono" : "Brak"}
              </span>
            </div>

            {data.spaText && (
              <div className="flex items-center justify-between mt-0.5">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Dodatki
                </span>
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-purple-100/80 text-purple-700 text-[10px] font-bold uppercase tracking-wide">
                  <Sparkle size={13} weight="fill" />
                  {data.spaText}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* ==========================================
            STREFA 3: WIDŻET FINANSOWY (>= 1211px)
            ========================================== */}
        <div className="hidden min-[1211px]:flex flex-col justify-center bg-slate-50/80 backdrop-blur-sm rounded-[24px] p-4 w-[220px] border border-slate-100/50">
          <div className="flex flex-col gap-2.5 w-full">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                <Receipt size={14} weight="bold" />
                <span>Wyjazd</span>
              </div>
              <span className="text-sm font-extrabold text-slate-700">
                {data.baseAmountFormatted}
              </span>
            </div>

            <div className="flex items-center justify-between pt-2.5 border-t border-slate-200/60">
              <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                <Sparkle size={14} weight="bold" className="text-purple-500" />
                <span>Usługi</span>
              </div>
              <span className="text-sm font-extrabold text-purple-600">
                {data.additionalAmountFormatted}
              </span>
            </div>
          </div>
        </div>

        {/* PRZYCISK AKCJI */}
        <Link
          href={`/admin/wyjazdy/${tripId}/uczestnicy/${data.id}`}
          className="w-9 h-9 sm:w-11 sm:h-11 mx-2 sm:mx-4 rounded-full bg-gradient-to-r from-brand-primary to-brand-primary/70 text-white flex items-center justify-center shadow-sm hover:shadow-md hover:brightness-110 transition-all shrink-0 focus:outline-none focus:ring-4 focus:ring-brand-primary/30 before:absolute before:inset-0 before:z-0 max-[465px]:absolute max-[465px]:-top-5 max-[465px]:-right-5"
          aria-label={`Otwórz profil uczestnika ${data.name}`}
        >
          <CaretRight
            size={18}
            weight="bold"
            className="group-hover:translate-x-0.5 transition-transform"
          />
        </Link>
      </div>
    </motion.div>
  );
});
