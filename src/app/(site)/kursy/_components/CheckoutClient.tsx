"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Check,
  User,
  Buildings,
  ArrowRight,
  ArrowLeft,
  SignIn,
  UserCircle,
  CircleNotch,
  WarningCircle,
  CreditCard,
  ShieldCheck,
} from "@phosphor-icons/react/dist/ssr";
import { OrderSummary } from "./OrderSummary";
import StripePaymentStep from "@/app/(site)/wyjazdy/[slug]/_components/StripePaymentStep";
import type { Course } from "../_data/courses";

type BuyerType = "private" | "company";

const STEPS = ["Konto", "Dane do płatności", "Płatność", "Podsumowanie"];

function Stepper({ activeStep }: { activeStep: number }) {
  return (
    <>
      {/* MOBILE: kompaktowy widok z paskiem postępu */}
      <div className="sm:hidden bg-white/60 backdrop-blur-xl border border-white/50 rounded-[20px] rounded-tr-none shadow-[0_12px_30px_-24px_rgba(3,63,99,0.4)] p-4">
        <div className="flex items-center gap-3">
          <span className="relative flex items-center justify-center size-9 shrink-0 rounded-full bg-brand-primary text-white font-jakarta font-bold text-[14px] border border-brand-yellow/30 shadow-[0_4px_15px_0px_rgba(242,217,103,0.35)] overflow-hidden">
            <span className="pointer-events-none absolute -right-1 -bottom-1 size-5 rounded-full bg-brand-yellow/50 blur-[10px]" />
            <span className="relative">{activeStep}</span>
          </span>
          <div className="flex-1 min-w-0">
            <p className="font-montserrat text-[11px] font-semibold uppercase tracking-wider text-brand-secondary/45">
              Krok {activeStep} z {STEPS.length}
            </p>
            <p className="font-jakarta font-bold text-[15px] text-brand-secondary leading-tight truncate">
              {STEPS[activeStep - 1]}
            </p>
          </div>
        </div>
        {/* Pasek postępu */}
        <div className="mt-3 h-1.5 w-full rounded-full bg-brand-secondary/10 overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-brand-primary to-brand-yellow transition-all"
            style={{ width: `${(activeStep / STEPS.length) * 100}%` }}
          />
        </div>
      </div>

      {/* DESKTOP: pełny stepper w pigułkach */}
      <div className="hidden sm:flex items-center gap-3 overflow-x-auto py-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {STEPS.map((label, i) => {
          const step = i + 1;
          const isDone = step < activeStep;
          const isActive = step === activeStep;
          return (
            <div key={label} className="flex items-center gap-3">
              <div
                className={`relative flex items-center gap-2 shrink-0 rounded-full pl-1.5 pr-4 py-1.5 border transition-colors overflow-hidden ${
                  isActive
                    ? "bg-brand-primary border-brand-yellow/30 shadow-[0_4px_15px_0px_rgba(242,217,103,0.35)]"
                    : isDone
                      ? "bg-white/70 backdrop-blur-md border-white/60"
                      : "bg-white/40 backdrop-blur-md border-white/50"
                }`}
              >
                {isActive && (
                  <span className="pointer-events-none absolute -right-1 -bottom-1 size-5 rounded-full bg-brand-yellow/50 blur-[10px]" />
                )}
                <span
                  className={`relative flex items-center justify-center size-7 shrink-0 rounded-full text-[13px] font-bold ${
                    isActive
                      ? "bg-white text-brand-primary"
                      : isDone
                        ? "bg-brand-primary text-white"
                        : "bg-brand-primary/10 text-brand-primary/50"
                  }`}
                >
                  {isDone ? <Check size={15} weight="bold" /> : step}
                </span>
                <span
                  className={`relative font-montserrat font-semibold text-[13px] whitespace-nowrap ${
                    isActive
                      ? "text-white"
                      : isDone
                        ? "text-brand-secondary"
                        : "text-brand-secondary/45"
                  }`}
                >
                  {label}
                </span>
              </div>
              {step < STEPS.length && (
                <span
                  className={`h-px w-6 shrink-0 ${
                    isDone ? "bg-brand-primary/40" : "bg-brand-secondary/15"
                  }`}
                />
              )}
            </div>
          );
        })}
      </div>
    </>
  );
}

function Field({
  label,
  type = "text",
  placeholder,
  value,
  onChange,
}: {
  label: string;
  type?: string;
  placeholder?: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <label className="flex flex-col gap-2 w-full">
      <span className="font-montserrat font-medium text-[12px] tracking-[-0.2px] text-brand-secondary/70">
        {label}
      </span>
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="h-12 px-4 rounded-2xl border border-brand-primary/15 bg-white/80 font-montserrat text-[14px] text-brand-secondary placeholder:text-brand-secondary/35 outline-none transition-all focus:border-brand-primary focus:bg-white focus:ring-4 focus:ring-brand-primary/10"
      />
    </label>
  );
}

export function CheckoutClient({
  course,
  isLoggedIn = true,
  loginUrl = "/logowanie",
}: {
  course: Course;
  isLoggedIn?: boolean;
  loginUrl?: string;
}) {
  const [buyer, setBuyer] = useState<BuyerType>("private");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Po utworzeniu PaymentIntent przechodzimy do kroku „Płatność" (PaymentElement).
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [returnUrl, setReturnUrl] = useState("");
  const [form, setForm] = useState({
    name: "",
    company: "",
    nip: "",
    email: "",
    address: "",
    postal: "",
    city: "",
  });
  const set = (k: keyof typeof form) => (v: string) =>
    setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/kursy/create-payment-intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug: course.slug,
          buyerType: buyer,
          company: form.company,
          nip: form.nip,
        }),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(data.error || "Nie udało się rozpocząć płatności.");
        return;
      }
      // Już kupiony → prosto na platformę.
      if (data.alreadyOwned) {
        window.location.href = `/panel/vod/${course.slug}`;
        return;
      }
      // Kurs darmowy → dostęp nadany, prosto na platformę z popupem sukcesu.
      if (data.free) {
        window.location.href = `/panel/vod?zakup=sukces`;
        return;
      }
      if (data.clientSecret) {
        // Po opłaceniu Stripe wraca na panel VOD — tam sekwencja powitalna
        // (popup sukcesu → instalacja aplikacji). Stripe dokleja payment_intent
        // i redirect_status do tego URL-a.
        setReturnUrl(`${window.location.origin}/panel/vod?zakup=sukces`);
        setClientSecret(data.clientSecret);
        return;
      }
      setError("Nie udało się rozpocząć płatności.");
    } catch {
      setError("Wystąpił błąd. Spróbuj ponownie za chwilę.");
    } finally {
      setLoading(false);
    }
  };

  const buyerOptions: { id: BuyerType; label: string; icon: React.ReactNode }[] =
    [
      { id: "private", label: "Osoba prywatna", icon: <User size={16} weight="bold" /> },
      { id: "company", label: "Firma", icon: <Buildings size={16} weight="bold" /> },
    ];

  return (
    <div className="flex flex-col gap-8">
      <Stepper activeStep={!isLoggedIn ? 1 : clientSecret ? 3 : 2} />

      <div className="flex flex-col lg:flex-row gap-8 lg:gap-10 items-start justify-center">
        {/* LEWA: krok „Konto" (logowanie) gdy niezalogowany */}
        {!isLoggedIn ? (
          <div className="flex-1 max-w-[731px] w-full flex flex-col gap-6 bg-white/60 backdrop-blur-xl border border-white/50 rounded-[28px] rounded-tr-none shadow-[0_20px_60px_-35px_rgba(3,63,99,0.35)] p-6 md:p-8">
            <div className="border-b border-brand-primary/10 pb-5">
              <h2 className="font-jakarta font-bold text-[20px] text-brand-secondary">
                Konto
              </h2>
              <p className="font-montserrat text-[13px] text-brand-secondary/50 mt-1">
                Zaloguj się, aby kontynuować — dostęp do kursu przypiszemy do
                Twojego konta.
              </p>
            </div>

            <div className="flex flex-col items-center text-center gap-4 py-4">
              <span className="relative flex items-center justify-center size-14 rounded-2xl rounded-tr-none bg-brand-primary/10 text-brand-primary">
                <span className="pointer-events-none absolute inset-0 rounded-2xl rounded-tr-none bg-brand-yellow/20 blur-lg" />
                <UserCircle size={30} weight="duotone" className="relative" />
              </span>
              <p className="font-montserrat text-[14px] text-brand-secondary/70 max-w-sm">
                Po zalogowaniu wrócisz prosto tutaj i dokończysz zakup.
              </p>
              <Link
                href={loginUrl}
                className="group relative inline-flex items-center justify-center gap-2 bg-brand-primary text-white font-montserrat font-bold text-[15px] px-7 py-3.5 rounded-2xl rounded-tr-[3px] border border-brand-yellow/30 shadow-[0_10px_30px_-8px_rgba(40,125,136,0.6)] hover:shadow-[0_12px_34px_0px_rgba(242,217,103,0.55)] transition-all overflow-hidden"
              >
                <span className="pointer-events-none absolute -right-2 -bottom-2 size-10 rounded-full bg-brand-yellow/50 blur-[14px]" />
                <span className="relative inline-flex items-center gap-2">
                  <SignIn size={18} weight="bold" />
                  Zaloguj się
                </span>
              </Link>
            </div>
          </div>
        ) : clientSecret ? (
          /* LEWA: krok „Płatność" — osadzony Stripe Payment Element */
          <div className="flex-1 max-w-[731px] w-full flex flex-col gap-6 bg-white/60 backdrop-blur-xl border border-white/50 rounded-[28px] rounded-tr-none shadow-[0_20px_60px_-35px_rgba(3,63,99,0.35)] p-6 md:p-8">
            <div className="flex items-start justify-between gap-3 border-b border-brand-primary/10 pb-5">
              <div>
                <h2 className="font-jakarta font-bold text-[20px] text-brand-secondary inline-flex items-center gap-2">
                  <CreditCard
                    size={20}
                    weight="duotone"
                    className="text-brand-primary"
                  />
                  Płatność
                </h2>
                <p className="font-montserrat text-[13px] text-brand-secondary/50 mt-1">
                  Wybierz metodę i opłać dostęp — karta, BLIK lub Przelewy24.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setClientSecret(null);
                  setError(null);
                }}
                className="shrink-0 inline-flex items-center gap-1.5 font-montserrat font-semibold text-[12.5px] text-brand-secondary/60 hover:text-brand-primary transition-colors"
              >
                <ArrowLeft size={14} weight="bold" />
                Zmień dane
              </button>
            </div>

            <span className="inline-flex items-center gap-1.5 self-start text-[11px] font-semibold text-brand-primary bg-brand-primary/10 border border-brand-primary/15 rounded-full px-2.5 py-1">
              <ShieldCheck size={13} weight="fill" />
              Szyfrowana płatność Stripe
            </span>

            <StripePaymentStep
              clientSecret={clientSecret}
              depositLabel={`${course.price} PLN`}
              returnUrl={returnUrl}
            />
          </div>
        ) : (
          /* LEWA: formularz */
          <form
            onSubmit={handleSubmit}
            className="flex-1 max-w-[731px] w-full flex flex-col gap-7 bg-white/60 backdrop-blur-xl border border-white/50 rounded-[28px] rounded-tr-none shadow-[0_20px_60px_-35px_rgba(3,63,99,0.35)] p-6 md:p-8"
          >
          <div className="border-b border-brand-primary/10 pb-5">
            <h2 className="font-jakarta font-bold text-[20px] text-brand-secondary">
              Dane do płatności
            </h2>
            <p className="font-montserrat text-[13px] text-brand-secondary/50 mt-1">
              Wystawimy dokument zakupu na podane dane.
            </p>
          </div>

          {/* Toggle typu nabywcy */}
          <div className="inline-flex items-center gap-1.5 self-start p-1 rounded-full bg-white/60 border border-white/60 shadow-sm">
            {buyerOptions.map((opt) => {
              const isActive = buyer === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setBuyer(opt.id)}
                  aria-pressed={isActive}
                  className={`relative inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full font-montserrat font-semibold text-[13px] transition-all overflow-hidden ${
                    isActive
                      ? "bg-brand-primary text-white shadow-[0_4px_15px_0px_rgba(242,217,103,0.35)] border border-brand-yellow/30"
                      : "text-brand-secondary/60 hover:text-brand-secondary"
                  }`}
                >
                  {isActive && (
                    <span className="pointer-events-none absolute -right-1 -bottom-1 size-5 rounded-full bg-brand-yellow/50 blur-[10px]" />
                  )}
                  <span className="relative flex items-center gap-1.5">
                    {opt.icon}
                    {opt.label}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Pola */}
          <div className="flex flex-col gap-5">
            {buyer === "company" ? (
              <div className="flex flex-col sm:flex-row gap-6">
                <Field
                  label="Pełna nazwa firmy *"
                  placeholder="Indywidualna praktyka"
                  value={form.company}
                  onChange={set("company")}
                />
                <Field
                  label="NIP *"
                  value={form.nip}
                  onChange={set("nip")}
                />
              </div>
            ) : (
              <Field
                label="Imię i nazwisko *"
                value={form.name}
                onChange={set("name")}
              />
            )}

            <div className="flex flex-col sm:flex-row gap-6">
              <Field
                label="Adres email *"
                type="email"
                value={form.email}
                onChange={set("email")}
              />
              <Field
                label="Adres *"
                value={form.address}
                onChange={set("address")}
              />
            </div>

            <div className="flex flex-col sm:flex-row gap-6">
              <Field
                label="Kod pocztowy *"
                value={form.postal}
                onChange={set("postal")}
              />
              <Field
                label="Miasto *"
                value={form.city}
                onChange={set("city")}
              />
            </div>
          </div>

          {error && (
            <p className="inline-flex items-center gap-2 self-start font-montserrat text-[13px] font-semibold text-rose-600 bg-rose-50 border border-rose-200 rounded-xl px-3.5 py-2">
              <WarningCircle size={16} weight="fill" className="shrink-0" />
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="group relative self-start inline-flex items-center gap-2 bg-brand-primary text-white font-montserrat font-bold text-[13px] px-5 py-2.5 rounded-2xl rounded-tr-[3px] border border-brand-yellow/30 shadow-[0_6px_18px_0px_rgba(40,125,136,0.4)] hover:shadow-[0_8px_22px_0px_rgba(242,217,103,0.45)] transition-all overflow-hidden disabled:opacity-70 disabled:cursor-not-allowed"
          >
            <span className="pointer-events-none absolute -right-2 -bottom-2 size-8 rounded-full bg-brand-yellow/50 blur-[12px]" />
            <span className="relative inline-flex items-center gap-2">
              {loading ? (
                <>
                  Przygotowuję płatność…
                  <CircleNotch size={16} weight="bold" className="animate-spin" />
                </>
              ) : (
                <>
                  Przejdź do płatności
                  <ArrowRight
                    size={16}
                    weight="bold"
                    className="group-hover:translate-x-0.5 transition-transform"
                  />
                </>
              )}
            </span>
          </button>
          </form>
        )}

        {/* PRAWA: podsumowanie */}
        <OrderSummary course={course} />
      </div>
    </div>
  );
}
