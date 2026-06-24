"use client";

import React, { useEffect, useState } from "react";
import {
  Tent,
  CreditCard,
  WarningCircle,
  ClockCounterClockwise,
  CircleNotch,
  Sparkle,
  X,
} from "@phosphor-icons/react/dist/ssr";
import StripePaymentStep from "@/app/(site)/wyjazdy/[slug]/_components/StripePaymentStep";
import Portal from "@/components/ui/Portal";

const DEFAULT_TRIP_IMAGE = "/images/camp-background.jpg";

export default function PendingTripState({ booking }: { booking: any }) {
  const [now, setNow] = useState(new Date().getTime());

  // Stany dla modalu płatności
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPaymentLoading, setIsPaymentLoading] = useState(false);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [depositAmount, setDepositAmount] = useState<number>(0);

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date().getTime()), 60000);
    return () => clearInterval(interval);
  }, []);

  const trip = booking.trip;
  const updatedAtTime = new Date(booking.updatedAt).getTime();
  const minutesSinceUpdate = (now - updatedAtTime) / (1000 * 60);
  const isProcessing = minutesSinceUpdate < 15;
  const bgImage = trip?.heroImage || DEFAULT_TRIP_IMAGE;

  // Funkcja uruchamiana po kliknięciu "Opłać zadatek"
  const handleOpenPayment = async () => {
    setIsModalOpen(true);
    setIsPaymentLoading(true);
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

      setClientSecret(data.clientSecret);
      setDepositAmount(data.deposit);
    } catch (err: any) {
      setPaymentError(err.message);
    } finally {
      setIsPaymentLoading(false);
    }
  };

  // STAN A: PRZETWARZANIE PŁATNOŚCI (< 15 min)
  if (isProcessing) {
    return (
      <div
        className="relative overflow-hidden rounded-3xl border border-white/20 shadow-[0_20px_60px_-30px_rgba(3,63,99,0.25)] p-5 sm:p-6 flex flex-col bg-cover bg-center mt-4"
        style={{ backgroundImage: `url(${bgImage})` }}
      >
        <div className="absolute inset-0 bg-brand-secondary/90 z-0" />
        <div className="absolute inset-0 bg-sky-500/10 mix-blend-overlay z-0" />
        <div className="absolute -top-12 -right-12 w-32 h-32 rounded-full bg-sky-500/20 blur-3xl pointer-events-none z-0" />

        <div className="flex justify-between items-start mb-8 relative z-10">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-full bg-sky-500/20 border border-sky-500/30 shadow-sm backdrop-blur-md">
            <CircleNotch
              size={12}
              weight="bold"
              className="text-sky-400 animate-spin"
            />
            <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-[0.15em] text-sky-400">
              Oczekujemy
            </span>
          </div>
          <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-2xl rounded-tr-none bg-white border border-white/80 shadow-md flex items-center justify-center shrink-0">
            <Tent
              size={32}
              weight="duotone"
              className="text-brand-secondary/40 sm:w-10 sm:h-10 w-8 h-8"
            />
            <span className="absolute -top-2 -right-2 sm:-top-2.5 sm:-right-2.5 w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-sky-500 flex items-center justify-center shadow-[0_4px_15px_0px_rgba(14,165,233,0.4)]">
              <ClockCounterClockwise
                size={14}
                weight="bold"
                className="text-white animate-spin-slow sm:w-4 sm:h-4 w-3.5 h-3.5"
              />
            </span>
          </div>
        </div>

        <div className="flex-1 flex flex-col justify-end relative z-10">
          <h3 className="font-jakarta font-bold text-xl sm:text-[22px] text-white leading-tight mb-2">
            Przetwarzanie płatności
          </h3>
          <p className="text-white/80 text-xs sm:text-[13.5px] leading-relaxed max-w-sm mb-4">
            Czekamy na potwierdzenie z banku za{" "}
            <strong>{trip?.title}</strong>.
          </p>
          <div className="inline-flex items-start sm:items-center gap-2 text-sky-400 font-semibold text-[11px] sm:text-[12px] bg-sky-950/40 px-3.5 py-2.5 rounded-xl border border-sky-500/20 w-fit backdrop-blur-sm">
            <Sparkle
              size={14}
              weight="fill"
              className="shrink-0 mt-0.5 sm:mt-0"
            />
            <span className="leading-snug">
              Panel odblokuje się automatycznie po potwierdzeniu.
            </span>
          </div>
        </div>
      </div>
    );
  }

  // STAN B: WYMAGANE DZIAŁANIE (> 15 min) + MODAL
  return (
    <>
      <div
        className="relative overflow-hidden rounded-3xl border border-white/20 shadow-[0_20px_60px_-30px_rgba(3,63,99,0.25)] p-5 sm:p-6 flex flex-col bg-cover bg-center mt-4"
        style={{ backgroundImage: `url(${bgImage})` }}
      >
        <div className="absolute inset-0 bg-brand-secondary/95 z-0" />
        <div className="absolute inset-0 bg-amber-500/10 mix-blend-overlay z-0" />
        <div className="absolute -top-12 -right-12 w-32 h-32 rounded-full bg-amber-500/20 blur-3xl pointer-events-none z-0" />

        <div className="flex justify-between items-start mb-8 relative z-10">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-full bg-amber-500/20 border border-amber-500/30 shadow-sm backdrop-blur-md">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
            <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-[0.15em] text-amber-400">
              Działanie
            </span>
          </div>
          <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-2xl rounded-tr-none bg-white border border-white/80 shadow-md flex items-center justify-center shrink-0">
            <Tent
              size={32}
              weight="duotone"
              className="text-brand-secondary/40 sm:w-10 sm:h-10 w-8 h-8"
            />
            <span className="absolute -top-2 -right-2 sm:-top-2.5 sm:-right-2.5 w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-amber-500 flex items-center justify-center shadow-[0_4px_15px_0px_rgba(245,158,11,0.4)]">
              <WarningCircle
                size={14}
                weight="fill"
                className="text-white sm:w-4 sm:h-4 w-3.5 h-3.5"
              />
            </span>
          </div>
        </div>

        <div className="flex-1 flex flex-col justify-end relative z-10">
          <h3 className="font-jakarta font-bold text-xl sm:text-[22px] text-white leading-tight mb-2">
            Dokończ rezerwację
          </h3>
          <p className="text-white/80 text-xs sm:text-[13.5px] leading-relaxed max-w-sm mb-5">
            Płatność za <strong>{trip?.title}</strong> nie powiodła się.
            Opłać zadatek, aby zabezpieczyć miejsce.
          </p>

          <div>
            <button
              onClick={handleOpenPayment}
              className="group inline-flex items-center gap-2 px-5 py-2.5 sm:px-6 sm:py-3 rounded-xl sm:rounded-2xl bg-amber-500 text-white font-semibold text-sm shadow-[0_4px_15px_0px_rgba(245,158,11,0.35)] hover:shadow-[0_6px_20px_0px_rgba(245,158,11,0.5)] hover:bg-amber-400 transition overflow-hidden"
            >
              <CreditCard size={18} weight="fill" />
              <span className="relative z-10">Opłać zadatek</span>
            </button>
          </div>
        </div>
      </div>

      {/* OVERLAY / MODAL Z PŁATNOŚCIĄ */}
      {isModalOpen && (
        <Portal>
        <div className="fixed inset-0 z-[700] flex items-center justify-center p-4 bg-brand-secondary/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-300">
            {/* Nagłówek Modala */}
            <div className="flex items-center justify-between p-5 border-b border-gray-100 bg-gray-50/50">
              <div>
                <h4 className="font-jakarta font-bold text-brand-secondary">
                  Dokończ płatność
                </h4>
                <p className="text-xs text-gray-500 mt-0.5">
                  {trip?.title}
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 transition-colors"
              >
                <X size={16} weight="bold" />
              </button>
            </div>

            {/* Ciało Modala (Przewijane) */}
            <div className="p-6 overflow-y-auto">
              {isPaymentLoading ? (
                <div className="flex flex-col items-center justify-center py-10 gap-3">
                  <CircleNotch
                    size={32}
                    className="text-brand-primary animate-spin"
                  />
                  <p className="text-sm font-semibold text-brand-secondary">
                    Sprawdzamy dostępność miejsc...
                  </p>
                </div>
              ) : paymentError ? (
                <div className="flex flex-col items-center justify-center text-center py-6 gap-3">
                  <WarningCircle
                    size={40}
                    className="text-rose-500"
                    weight="duotone"
                  />
                  <h5 className="font-bold text-brand-secondary text-lg">
                    Rezerwacja anulowana
                  </h5>
                  <p className="text-sm text-gray-600">{paymentError}</p>
                  <button
                    onClick={() => window.location.reload()}
                    className="mt-4 px-6 py-2.5 bg-gray-100 font-semibold text-sm rounded-xl hover:bg-gray-200 transition"
                  >
                    Odśwież stronę
                  </button>
                </div>
              ) : clientSecret ? (
                <div className="flex flex-col gap-5">
                  <div className="bg-brand-primary/5 border border-brand-primary/10 rounded-2xl p-4 flex justify-between items-center">
                    <span className="text-sm font-semibold text-brand-secondary">
                      Kwota zadatku:
                    </span>
                    <span className="text-lg font-jakarta font-bold text-brand-primary">
                      {depositAmount} zł
                    </span>
                  </div>

                  {/* Komponent Stripe Elements */}
                  <StripePaymentStep
                    clientSecret={clientSecret}
                    depositLabel={`${depositAmount} zł`}
                    returnUrl={`${window.location.origin}/panel/wyjazdy/${booking.id}?status=processing`}
                  />
                </div>
              ) : null}
            </div>
          </div>
        </div>
        </Portal>
      )}
    </>
  );
}
