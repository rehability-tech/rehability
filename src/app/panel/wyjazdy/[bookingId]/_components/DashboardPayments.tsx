"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  CurrencyCircleDollar,
  CheckCircle,
  Clock,
  ArrowRight,
  X,
  Spinner,
  WarningCircle,
} from "@phosphor-icons/react/dist/ssr";

import StripePaymentStep from "@/app/(site)/wyjazdy/[slug]/_components/StripePaymentStep";

function PaymentChip({
  label,
  amount,
  paid,
}: {
  label: string;
  amount: number;
  paid: boolean;
}) {
  return (
    <div
      className={`rounded-2xl border p-3 ${
        paid
          ? "bg-brand-primary/5 border-brand-primary/20"
          : "bg-white/60 border-white/40"
      }`}
    >
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-bold uppercase tracking-wider text-brand-secondary/50">
          {label}
        </span>
        {paid ? (
          <CheckCircle size={14} weight="fill" className="text-brand-primary" />
        ) : (
          <Clock
            size={14}
            weight="duotone"
            className="text-brand-secondary/40"
          />
        )}
      </div>
      <p className="font-jakarta font-bold text-[18px] text-brand-secondary mt-1">
        {amount.toLocaleString("pl-PL")} zł
      </p>
    </div>
  );
}

export default function DashboardPayments({ booking, trip }: any) {
  // 1. USTALENIE STATUSU PŁATNOŚCI
  const depositPaid = !!booking.depositPaidAt;
  const remainderPaid = !!booking.remainderPaidAt;
  const paymentProgress = remainderPaid ? 100 : depositPaid ? 50 : 0;

  // 2. WYLICZENIE KWOT NA BAZIE PRAWDZIWYCH DANYCH (Złotówki!)
  // UWAGA: Usunięto dzielenie przez 100. Endpoint klienta wysyła to już w PLN (np. 2500)
  const totalPricePLN =
    booking.amountTotal > 0 ? Number(booking.amountTotal) : Number(trip.price);

  const depositAmountPLN = Number(trip.deposit);
  const remainderAmountPLN = totalPricePLN - depositAmountPLN;

  // Kwota już opłacona (bezpośrednio z bazy, znormalizowana do PLN)
  const paymentValuePLN = Number(booking.amountPaid) || 0;

  // --- STANY DLA OVERLAYA PŁATNOŚCI ---
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [amountToPay, setAmountToPay] = useState<number>(0);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handlePaymentClick = async () => {
    setIsLoading(true);
    setPaymentError(null);

    try {
      const res = await fetch("/api/panel/wyjazdy/resume-payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId: booking.id }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(
          data.error || "Wystąpił błąd podczas przygotowywania płatności.",
        );
      }

      if (data.clientSecret) {
        setClientSecret(data.clientSecret);
        // Nasz backend wysyła tu czyste złotówki (np. 1750), używamy ich bezpośrednio
        setAmountToPay(data.amount);
        setIsModalOpen(true);
      } else if (data.url) {
        window.location.href = data.url;
      }
    } catch (err: any) {
      console.error("Błąd inicjalizacji płatności:", err);
      alert(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, delay: 0.1 }}
        className="rounded-[24px] bg-white/70 backdrop-blur-xl border border-white/40 shadow-[0_12px_40px_-15px_rgba(3,63,99,0.18)] p-5 lg:p-6 h-full flex flex-col"
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-brand-primary/10 text-brand-primary flex items-center justify-center">
              <CurrencyCircleDollar size={20} weight="duotone" />
            </div>
            <div>
              <h3 className="font-jakarta font-bold text-[15px] text-brand-secondary">
                Płatności
              </h3>
              <p className="text-[11px] text-brand-secondary/50">
                {paymentValuePLN.toLocaleString("pl-PL")} zł /{" "}
                {totalPricePLN.toLocaleString("pl-PL")} zł
              </p>
            </div>
          </div>
          {remainderPaid ? (
            <span className="inline-flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1 rounded-full bg-brand-primary text-white shadow-[0_6px_14px_-4px_rgba(40,125,136,0.6)]">
              <CheckCircle size={11} weight="fill" /> Opłacone w pełni
            </span>
          ) : depositPaid ? (
            <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-brand-yellow/40 text-brand-secondary">
              Pozostała dopłata
            </span>
          ) : (
            <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-rose-100 text-rose-600">
              Brak wpłaty
            </span>
          )}
        </div>

        <div className="h-2 bg-brand-secondary/10 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${paymentProgress}%` }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="h-full rounded-full bg-gradient-to-r from-brand-primary to-brand-yellow"
          />
        </div>

        <div className="grid grid-cols-2 gap-3 mt-4 flex-1">
          <PaymentChip
            label="Zadatek"
            amount={depositAmountPLN}
            paid={depositPaid}
          />
          <PaymentChip
            label="Reszta"
            amount={remainderAmountPLN}
            paid={remainderPaid}
          />
        </div>

        {!remainderPaid && (
          <div className="mt-4 pt-1">
            <button
              onClick={handlePaymentClick}
              disabled={isLoading}
              style={{ backgroundSize: "200% auto" }}
              className="group w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-gradient-to-r from-brand-primary from-0% via-brand-primary via-85% to-brand-yellow to-100% hover:bg-right text-white text-[13px] font-bold transition-all duration-700 shadow-[0_10px_24px_-8px_rgba(40,125,136,0.6)] disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <Spinner size={18} className="animate-spin text-brand-yellow" />
              ) : (
                <>
                  {depositPaid
                    ? `Opłać resztę (${remainderAmountPLN.toLocaleString("pl-PL")} zł)`
                    : `Opłać zadatek (${depositAmountPLN.toLocaleString("pl-PL")} zł)`}
                  <ArrowRight
                    size={16}
                    weight="bold"
                    className="group-hover:translate-x-1 transition-transform"
                  />
                </>
              )}
            </button>
          </div>
        )}
      </motion.section>

      {/* --- OVERLAY PŁATNOŚCI (Modal) --- */}
      {mounted &&
        createPortal(
          <AnimatePresence>
            {isModalOpen && clientSecret && (
              <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-brand-secondary/60 backdrop-blur-sm animate-in fade-in duration-200">
                <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-300">
                  {/* Nagłówek Modala */}
                  <div className="flex items-center justify-between p-5 border-b border-gray-100 bg-gray-50/50">
                    <div>
                      <h4 className="font-jakarta font-bold text-brand-secondary flex items-center gap-2">
                        <CurrencyCircleDollar
                          size={20}
                          weight="duotone"
                          className="text-brand-primary"
                        />
                        Dokończ płatność
                      </h4>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {trip?.title}
                      </p>
                    </div>
                    <button
                      onClick={() => setIsModalOpen(false)}
                      className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 transition-colors"
                    >
                      <X size={16} weight="bold" />
                    </button>
                  </div>

                  {/* Ciało Modala */}
                  <div className="p-6 overflow-y-auto">
                    {paymentError ? (
                      <div className="flex flex-col items-center justify-center text-center py-6 gap-3">
                        <WarningCircle
                          size={40}
                          className="text-rose-500"
                          weight="duotone"
                        />
                        <h5 className="font-bold text-brand-secondary text-lg">
                          Błąd płatności
                        </h5>
                        <p className="text-sm text-gray-600">{paymentError}</p>
                        <button
                          onClick={() => setIsModalOpen(false)}
                          className="mt-4 px-6 py-2.5 bg-gray-100 font-semibold text-sm rounded-xl hover:bg-gray-200 transition"
                        >
                          Zamknij
                        </button>
                      </div>
                    ) : (
                      <div className="flex flex-col gap-5">
                        <div className="bg-brand-primary/5 border border-brand-primary/10 rounded-2xl p-4 flex justify-between items-center">
                          <span className="text-sm font-semibold text-brand-secondary">
                            Kwota do zapłaty:
                          </span>
                          <span className="text-lg font-jakarta font-bold text-brand-primary">
                            {amountToPay.toLocaleString("pl-PL")} zł
                          </span>
                        </div>

                        {/* Komponent Stripe Elements */}
                        <StripePaymentStep
                          clientSecret={clientSecret}
                          depositLabel={`${amountToPay.toLocaleString("pl-PL")} zł`}
                          returnUrl={`${window.location.origin}/panel/wyjazdy/${booking.id}?status=processing`}
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </AnimatePresence>,
          document.body,
        )}
    </>
  );
}
