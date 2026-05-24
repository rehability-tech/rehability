"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  CalendarBlank,
  CheckCircle,
  Hourglass,
  MapPin,
  Sparkle,
} from "@phosphor-icons/react/dist/ssr";

const EASE = [0.22, 1, 0.36, 1] as const;
const SPRING = { type: "spring", stiffness: 280, damping: 28 } as const;
const ACCENT = "#287D88";
const TEXT = "#0B3B4C";

interface Props {
  name: string;
  isConfirmed: boolean;
  panelHref: string;
  campTitle: string | null;
  dateRange: string | null;
  location: string | null;
  amountPaidLabel: string | null;
}

export default function SuccessAnimation({
  name,
  isConfirmed,
  panelHref,
  campTitle,
  dateRange,
  location,
  amountPaidLabel,
}: Props) {
  const router = useRouter();

  // Płatności asynchroniczne (BLIK, P24) bywają potwierdzone z lekkim
  // opóźnieniem przez webhook — łagodnie odświeżamy stronę co 4s aż status
  // przeskoczy na DEPOSIT_PAID.
  useEffect(() => {
    if (isConfirmed) return;
    const t = setInterval(() => router.refresh(), 4000);
    return () => clearInterval(t);
  }, [isConfirmed, router]);

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={{
        hidden: {},
        visible: { transition: { staggerChildren: 0.08, delayChildren: 0.1 } },
      }}
      className="w-full max-w-xl rounded-[32px] bg-white/80 backdrop-blur-xl border border-white/60 shadow-[0_40px_120px_-50px_rgba(11,59,76,0.35)] px-6 sm:px-10 py-10 text-center"
      style={{ color: TEXT }}
    >
      <Item>
        <IconHero confirmed={isConfirmed} />
      </Item>

      <Item>
        <h1
          className="mt-6 font-jakarta font-bold text-3xl sm:text-4xl leading-tight"
          style={{ color: TEXT }}
        >
          {isConfirmed
            ? `Dziękujemy, ${name}!`
            : "Płatność w drodze…"}
        </h1>
      </Item>

      <Item>
        <p className="mt-3 text-sm sm:text-base text-gray-600 max-w-md mx-auto">
          {isConfirmed ? (
            <>
              Twoja rezerwacja jest potwierdzona
              {amountPaidLabel && (
                <>
                  {" "}— zaksięgowaliśmy zadatek{" "}
                  <strong style={{ color: ACCENT }}>{amountPaidLabel}</strong>
                </>
              )}
              . QR-bilet i harmonogram znajdziesz w swoim panelu.
            </>
          ) : (
            <>
              Potwierdzamy Twoją płatność z bankiem — to chwila. Strona odświeży
              się automatycznie.
            </>
          )}
        </p>
      </Item>

      {(campTitle || dateRange || location) && (
        <Item>
          <div className="mt-7 rounded-2xl bg-white/60 border border-gray-100 p-5 text-left">
            {campTitle && (
              <div
                className="font-jakarta font-bold text-base"
                style={{ color: TEXT }}
              >
                {campTitle}
              </div>
            )}
            <div className="mt-2 flex flex-col gap-1.5">
              {dateRange && (
                <Row icon={<CalendarBlank size={16} weight="duotone" />}>
                  {dateRange}
                </Row>
              )}
              {location && (
                <Row icon={<MapPin size={16} weight="duotone" />}>
                  {location}
                </Row>
              )}
            </div>
          </div>
        </Item>
      )}

      <Item>
        <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href={panelHref}
            className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-2xl text-white text-sm font-semibold transition hover:opacity-90"
            style={{ background: ACCENT }}
          >
            <Sparkle size={16} weight="fill" />
            {isConfirmed ? "Przejdź do panelu" : "Sprawdź status w panelu"}
          </Link>
          <Link
            href="/campy"
            className="inline-flex items-center justify-center px-6 py-3 rounded-2xl bg-white/70 border border-gray-200 text-sm font-semibold transition hover:bg-white"
            style={{ color: TEXT }}
          >
            Inne wyjazdy
          </Link>
        </div>
      </Item>
    </motion.div>
  );
}

function IconHero({ confirmed }: { confirmed: boolean }) {
  return (
    <div className="mx-auto relative flex items-center justify-center w-24 h-24">
      <motion.span
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ ...SPRING, delay: 0.05 }}
        className="absolute inset-0 rounded-full"
        style={{
          background: confirmed ? `${ACCENT}15` : "#f5e8c2",
        }}
      />
      <motion.span
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ ...SPRING, delay: 0.15 }}
        className="relative flex items-center justify-center w-16 h-16 rounded-full text-white shadow-lg"
        style={{ background: confirmed ? ACCENT : "#d4a72c" }}
      >
        {confirmed ? (
          <CheckCircle size={32} weight="fill" />
        ) : (
          <Hourglass size={28} weight="fill" />
        )}
      </motion.span>
    </div>
  );
}

function Item({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 12 },
        visible: {
          opacity: 1,
          y: 0,
          transition: { duration: 0.5, ease: EASE },
        },
      }}
    >
      {children}
    </motion.div>
  );
}

function Row({
  icon,
  children,
}: {
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-2 text-sm text-gray-600">
      <span style={{ color: ACCENT }}>{icon}</span>
      <span>{children}</span>
    </div>
  );
}
