"use client";

import React, { useRef } from "react";
import { motion, AnimatePresence, useInView } from "framer-motion";
import {
  ShoppingCart,
  EnvelopeSimple,
  LockSimple,
} from "@phosphor-icons/react/dist/ssr";

import SingleTripHero from "./SingleTripHero";
import TripBookingForm, { type CurrentUser } from "./TripBookingForm";
import BlockRenderer from "@/components/block-renderer/BlockRenderer";

interface TripPageClientProps {
  tripId: string;
  title: string;
  subtitle: string;
  tags: string[];
  heroImage: string;
  location?: string;
  dateRange?: string;
  price?: string;
  priceValue: number;
  depositValue: number;
  allowBringFriend: boolean;
  blocks: any[];
  mapUrl?: string | null;
  currentUser: CurrentUser | null;
  initialVariant?: "standard" | "duo";
  initialStep?: number;
  /** Imię i nazwisko osoby, która wysłała zaproszenie (gdy wejście z linku ?inv=). */
  inviterName?: string | null;
  /** Czy zapisy są otwarte (formularz vs. karta "zapisy zamknięte"). */
  bookingOpen?: boolean;
  bookingClosedHeadline?: string | null;
  bookingClosedMessage?: string | null;
}

export default function TripPageClient({
  tripId,
  title,
  subtitle,
  tags,
  heroImage,
  location,
  dateRange,
  price,
  priceValue,
  depositValue,
  allowBringFriend,
  blocks,
  mapUrl,
  currentUser,
  initialVariant,
  initialStep,
  inviterName,
  bookingOpen = true,
  bookingClosedHeadline,
  bookingClosedMessage,
}: TripPageClientProps) {
  // Referencja do formularza, by śledzić czy jest widoczny na ekranie
  const formRef = useRef<HTMLDivElement>(null);

  // Hook z framer-motion: zwraca true, gdy formularz pojawia się w polu widzenia
  const isFormInView = useInView(formRef, { margin: "0px" });

  // Funkcja smooth scroll do formularza
  const scrollToForm = () => {
    document.getElementById("formularz-rezerwacji")?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };

  return (
    <main className="min-h-screen bg-gray-50/30 pb-32 font-montserrat relative">
      {/* --- Rozmyte akcenty tła --- */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden -z-10">
        <div className="absolute top-[800px] left-[-200px] w-[600px] h-[600px] bg-brand-primary/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-[200px] right-[-100px] w-[500px] h-[500px] bg-brand-yellow/5 rounded-full blur-[100px]" />
      </div>

      {/* Tag "Zaproszenie od ..." — wejście z linku z maila (?inv=). Desktop: delikatny
          tag w prawym górnym rogu. Mobile: kompaktowa plakietka przy przycisku CTA. */}
      {inviterName && (
        <div className="hidden lg:flex fixed top-24 right-6 z-40 items-center gap-2 px-4 py-2 rounded-full bg-white/85 backdrop-blur-xl border border-brand-yellow/40 shadow-[0_8px_24px_-10px_rgba(3,63,99,0.35)]">
          <EnvelopeSimple size={15} weight="fill" className="text-brand-primary" />
          <span className="text-[12.5px] font-montserrat font-semibold text-brand-secondary">
            Zaproszenie od{" "}
            <span className="text-brand-primary">{inviterName}</span>
          </span>
        </div>
      )}

      <SingleTripHero
        title={title}
        subtitle={subtitle}
        tags={tags}
        heroImage={heroImage}
        location={location}
        dateRange={dateRange}
        price={price}
        onBookClick={scrollToForm}
      />

      <section className="container mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-16">
        <div className="max-w-[1200px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-start">
          {/* ======================================= */}
          {/* LEWA KOLUMNA: Opis i szczegóły wydarzenia */}
          {/* ======================================= */}
          <motion.div
            key="info"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="lg:col-span-7 xl:col-span-8 w-full flex flex-col text-left"
          >
            <BlockRenderer blocks={blocks} mapUrl={mapUrl} />
          </motion.div>

          {/* ======================================= */}
          {/* PRAWA KOLUMNA: Formularz (Przyklejony)  */}
          {/* ======================================= */}
          <motion.div
            ref={formRef}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="lg:col-span-5 xl:col-span-4 lg:sticky lg:top-32 z-30"
          >
            {bookingOpen ? (
              <TripBookingForm
                tripId={tripId}
                tripTitle={title}
                price={priceValue}
                deposit={depositValue}
                allowBringFriend={allowBringFriend}
                currentUser={currentUser}
                initialVariant={initialVariant}
                initialStep={initialStep}
              />
            ) : (
              <BookingClosedCard
                headline={bookingClosedHeadline}
                message={bookingClosedMessage}
              />
            )}
          </motion.div>
        </div>
      </section>

      {/* ======================================= */}
      {/* MOBILE STICKY BAR (Pływający pasek na dole) */}
      {/* ======================================= */}
      <AnimatePresence>
        {/* Renderujemy pasek tylko na małych ekranach (lg:hidden) i TYLKO jeśli formularz NIE jest widoczny na ekranie */}
        {!isFormInView && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-2xl border-t border-white/60 shadow-[0_-15px_40px_-10px_rgba(3,63,99,0.1)] px-5 py-4 pb-safe"
          >
            <div className="flex items-center justify-between max-w-md mx-auto">
              <div className="flex flex-col">
                <span className="text-[10px] font-bold uppercase tracking-widest text-brand-secondary/50">
                  Cena za osobę
                </span>
                <span className="text-lg font-jakarta font-bold text-brand-secondary leading-tight">
                  {priceValue.toLocaleString("pl-PL")} zł
                </span>
              </div>
              {bookingOpen ? (
                <button
                  onClick={scrollToForm}
                  className="relative inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-gradient-to-r from-brand-primary to-brand-primary/90 text-white font-bold text-[14px] shadow-[0_8px_20px_-6px_rgba(40,125,136,0.4)] hover:shadow-lg transition-all"
                >
                  {inviterName && (
                    <span className="absolute -top-2.5 -right-2 px-2 py-0.5 rounded-full rounded-tr-[3px] bg-brand-yellow text-brand-secondary text-[9px] font-bold shadow-sm ring-2 ring-white whitespace-nowrap">
                      od {inviterName.split(" ")[0]}
                    </span>
                  )}
                  Rezerwuję <ShoppingCart size={16} weight="fill" />
                </button>
              ) : (
                <span className="inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-brand-secondary/10 text-brand-secondary/70 font-bold text-[14px]">
                  <LockSimple size={16} weight="fill" />
                  {bookingClosedHeadline ?? "Zapisy zamknięte"}
                </span>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}

/* ───────────────────────── Karta "Zapisy zamknięte" ───────────────────────── */

function BookingClosedCard({
  headline,
  message,
}: {
  headline?: string | null;
  message?: string | null;
}) {
  return (
    <section id="formularz-rezerwacji" className="scroll-mt-32">
      <div className="relative rounded-[32px] bg-white/60 backdrop-blur-2xl border border-white/60 shadow-[0_15px_60px_-15px_rgba(3,63,99,0.15)] overflow-hidden p-8 text-center">
        <div className="absolute -top-20 -right-20 w-56 h-56 bg-brand-secondary/10 rounded-full blur-[60px] pointer-events-none" />
        <div className="relative z-10 flex flex-col items-center gap-4">
          <span className="flex items-center justify-center w-16 h-16 rounded-2xl rounded-tr-none bg-brand-secondary/10 text-brand-secondary">
            <LockSimple size={30} weight="duotone" />
          </span>
          <h2 className="text-[22px] font-jakarta font-bold text-brand-secondary leading-tight">
            {headline ?? "Zapisy zamknięte"}
          </h2>
          <p className="text-[14px] font-medium text-brand-secondary/60 leading-relaxed max-w-sm">
            {message ??
              "Nie przyjmujemy już zgłoszeń na to wydarzenie. Napisz do nas — chętnie pomożemy znaleźć inny termin."}
          </p>
          <a
            href="/wydarzenia"
            className="mt-2 inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-brand-primary text-white font-bold text-[14px] shadow-[0_8px_20px_-6px_rgba(40,125,136,0.45)] hover:shadow-lg transition-all"
          >
            Zobacz inne wydarzenia
          </a>
        </div>
      </div>
    </section>
  );
}
