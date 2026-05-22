"use client";

import React from "react";
import {
  ArrowRight,
  Heart,
  StarFour,
  User,
  UsersFour,
} from "@phosphor-icons/react/dist/ssr";
import { useBooking } from "./BookingContext";

interface BookingOptionsContent {
  title?: string;
  standardTitle?: string;
  standardText?: string;
  duoTitle?: string;
  duoText?: string;
}

interface BookingOptionsCardProps {
  content: BookingOptionsContent;
}

function stripHtml(html: string | undefined): string {
  if (!html) return "";
  return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

export default function BookingOptionsCard({ content }: BookingOptionsCardProps) {
  const { openSheet, allowDuo } = useBooking();

  const title = content.title?.trim() || "Wybierz swój wariant udziału";
  const standardTitle = content.standardTitle?.trim() || "Pakiet Solo";
  const standardText =
    stripHtml(content.standardText) ||
    "Kupujesz jedno miejsce. W razie potrzeby przydzielimy Cię do innej uczestniczki.";
  const duoTitle = content.duoTitle?.trim() || "Pakiet z przyjaciółką";
  const duoText =
    stripHtml(content.duoText) ||
    "Rezerwujesz dwa miejsca razem. Gwarantujemy Wam wspólny pokój.";

  return (
    <section
      aria-labelledby="booking-options-title"
      className="rounded-[28px] border border-brand-primary/15 bg-white/70 backdrop-blur-xl shadow-[0_20px_60px_-25px_rgba(3,63,99,0.25)] overflow-hidden"
    >
      <header className="px-6 sm:px-8 pt-7 pb-5 border-b border-brand-primary/10 bg-gradient-to-br from-white to-brand-primary/[0.04]">
        <span className="inline-block text-[10px] uppercase tracking-[0.2em] font-bold text-brand-primary">
          Rezerwacja
        </span>
        <h3
          id="booking-options-title"
          className="font-jakarta font-bold text-brand-secondary text-[24px] md:text-[28px] leading-tight mt-2"
        >
          {title}
        </h3>
      </header>

      <div
        className={`grid grid-cols-1 ${allowDuo ? "lg:grid-cols-2" : ""} gap-5 p-5 sm:p-7`}
      >
        <OptionCard
          variant="standard"
          icon={<User size={22} weight="duotone" />}
          title={standardTitle}
          text={standardText}
          ctaLabel="Wybieram Solo"
          onSelect={() => openSheet("solo")}
        />
        {allowDuo && (
          <OptionCard
            variant="duo"
            icon={<UsersFour size={22} weight="duotone" />}
            title={duoTitle}
            text={duoText}
            badge={
              <span className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide text-brand-primary bg-brand-primary/10 px-2.5 py-1 rounded-full border border-brand-primary/20">
                <StarFour size={10} weight="fill" />
                Polecane
              </span>
            }
            ctaLabel="Zabieram przyjaciółkę"
            ctaIcon={<Heart size={14} weight="fill" />}
            onSelect={() => openSheet("duo")}
          />
        )}
      </div>
    </section>
  );
}

interface OptionCardProps {
  variant: "standard" | "duo";
  icon: React.ReactNode;
  title: string;
  text: string;
  ctaLabel: string;
  ctaIcon?: React.ReactNode;
  badge?: React.ReactNode;
  onSelect: () => void;
}

function OptionCard({
  variant,
  icon,
  title,
  text,
  ctaLabel,
  ctaIcon,
  badge,
  onSelect,
}: OptionCardProps) {
  const isDuo = variant === "duo";
  return (
    <article
      className={`relative flex flex-col rounded-[22px] overflow-hidden bg-white transition-shadow ${
        isDuo
          ? "border border-brand-primary/30 shadow-[0_14px_40px_-20px_rgba(40,125,136,0.45)]"
          : "border border-gray-100 shadow-[0_8px_24px_-16px_rgba(3,63,99,0.2)]"
      }`}
    >
      {isDuo && (
        <div
          aria-hidden="true"
          className="h-1 w-full bg-gradient-to-r from-brand-primary to-brand-secondary"
        />
      )}

      <div className="flex items-start gap-3 px-6 pt-6 pb-4 border-b border-gray-100">
        <div
          className={`w-11 h-11 rounded-[14px] flex items-center justify-center shrink-0 ${
            isDuo
              ? "bg-brand-primary/10 text-brand-primary"
              : "bg-gray-100 text-brand-secondary/60"
          }`}
        >
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h4
              className={`font-jakarta font-bold text-[17px] leading-snug ${
                isDuo ? "text-brand-primary" : "text-brand-secondary"
              }`}
            >
              {title}
            </h4>
            {badge && <div className="shrink-0 mt-0.5">{badge}</div>}
          </div>
        </div>
      </div>

      <p className="px-6 py-5 font-montserrat text-[14px] leading-relaxed text-brand-secondary/75 flex-1">
        {text}
      </p>

      <div className="px-6 pb-6">
        <button
          type="button"
          onClick={onSelect}
          className={`group w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl text-[13.5px] font-bold transition ${
            isDuo
              ? "bg-brand-primary text-white hover:bg-brand-secondary shadow-[0_12px_30px_-10px_rgba(40,125,136,0.55)]"
              : "bg-brand-secondary text-white hover:bg-brand-primary"
          }`}
        >
          {ctaIcon}
          {ctaLabel}
          <ArrowRight
            size={14}
            weight="bold"
            className="transition-transform group-hover:translate-x-0.5"
          />
        </button>
      </div>
    </article>
  );
}
