"use client";

import React, { useEffect, useState, useTransition } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  CalendarBlank,
  CheckCircle,
  CircleNotch,
  CreditCard,
  Heart,
  MapPin,
  ShieldCheck,
  User,
  UsersFour,
  Warning,
  X,
} from "@phosphor-icons/react/dist/ssr";
import { createCheckoutSession } from "@/app/actions/stripe";
import { useBooking, type BookingMode } from "./BookingContext";

interface BookingFlowSheetProps {
  campId: string;
  campTitle: string;
  location: string;
  dateRange: string;
  price: number | null;
  deposit: number | null;
  allowDuo: boolean;
}

type Step = "details" | "summary";

interface FormState {
  name: string;
  email: string;
  phone: string;
  friendEmail: string;
  acceptTerms: boolean;
}

const initialForm: FormState = {
  name: "",
  email: "",
  phone: "",
  friendEmail: "",
  acceptTerms: false,
};

export default function BookingFlowSheet({
  campId,
  campTitle,
  location,
  dateRange,
  price,
  deposit,
  allowDuo,
}: BookingFlowSheetProps) {
  const { isOpen, mode, closeSheet, setMode } = useBooking();
  const [step, setStep] = useState<Step>("details");
  const [form, setForm] = useState<FormState>(initialForm);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (isOpen) {
      setStep("details");
      setError(null);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeSheet();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, closeSheet]);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((s) => ({ ...s, [key]: value }));

  const isDuo = mode === "duo" && allowDuo;
  const seatCount = isDuo ? 2 : 1;
  const totalDeposit = (deposit ?? 0) * seatCount;
  const totalPrice = (price ?? 0) * seatCount;

  const validateDetails = (): string | null => {
    if (!form.name || form.name.trim().length < 3)
      return "Podaj imię i nazwisko.";
    if (!form.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      return "Podaj poprawny adres e-mail.";
    if (!form.phone || form.phone.replace(/\s+/g, "").length < 7)
      return "Podaj poprawny numer telefonu.";
    if (isDuo) {
      if (
        !form.friendEmail ||
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.friendEmail)
      )
        return "Podaj adres e-mail przyjaciółki.";
      if (form.friendEmail.trim().toLowerCase() === form.email.trim().toLowerCase())
        return "Adres e-mail przyjaciółki musi być inny niż Twój.";
    }
    return null;
  };

  const goNext = () => {
    setError(null);
    const err = validateDetails();
    if (err) {
      setError(err);
      return;
    }
    setStep("summary");
  };

  const handleSubmit = () => {
    setError(null);
    if (!form.acceptTerms) {
      setError("Musisz zaakceptować regulamin, aby kontynuować.");
      return;
    }
    startTransition(async () => {
      const result = await createCheckoutSession({
        campId,
        name: form.name,
        email: form.email,
        phone: form.phone,
      });
      if (!result.ok || !result.checkoutUrl) {
        setError(result.error ?? "Nie udało się utworzyć płatności.");
        return;
      }
      window.location.href = result.checkoutUrl;
    });
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={closeSheet}
          aria-hidden="true"
          className="fixed inset-0 z-[120] bg-[#071f28]/70 backdrop-blur-sm"
        />
      )}
      {isOpen && (
        <motion.div
          key="sheet"
          role="dialog"
          aria-modal="true"
          aria-label="Rezerwacja wyjazdu"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 40 }}
          transition={{ type: "spring", damping: 26, stiffness: 280 }}
          className="fixed inset-x-0 bottom-0 sm:inset-0 sm:flex sm:items-center sm:justify-center z-[121] pointer-events-none p-0 sm:p-4"
        >
          <div className="pointer-events-auto w-full sm:max-w-[560px] bg-white rounded-t-[28px] sm:rounded-[28px] shadow-[0_30px_80px_-20px_rgba(3,63,99,0.5)] max-h-[92vh] sm:max-h-[88vh] flex flex-col overflow-hidden">
            <SheetHeader campTitle={campTitle} onClose={closeSheet} step={step} />

            <StepIndicator step={step} />

            <div className="flex-1 overflow-y-auto px-6 py-5">
              {step === "details" && (
                <DetailsStep
                  mode={mode}
                  allowDuo={allowDuo}
                  onModeChange={setMode}
                  form={form}
                  setField={set}
                  isPending={isPending}
                />
              )}
              {step === "summary" && (
                <SummaryStep
                  campTitle={campTitle}
                  location={location}
                  dateRange={dateRange}
                  mode={mode}
                  seatCount={seatCount}
                  totalPrice={totalPrice}
                  totalDeposit={totalDeposit}
                  acceptTerms={form.acceptTerms}
                  onAcceptChange={(v) => set("acceptTerms", v)}
                  isPending={isPending}
                />
              )}

              {error && (
                <div className="mt-4 flex items-start gap-2 p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 text-[13px]">
                  <Warning size={16} weight="fill" className="shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}
            </div>

            <SheetFooter
              step={step}
              isPending={isPending}
              onBack={() => setStep("details")}
              onNext={goNext}
              onSubmit={handleSubmit}
              depositLabel={
                totalDeposit > 0
                  ? `Zadatek ${totalDeposit.toLocaleString("pl-PL")} zł`
                  : "Przejdź do płatności"
              }
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function SheetHeader({
  campTitle,
  onClose,
  step,
}: {
  campTitle: string;
  onClose: () => void;
  step: Step;
}) {
  return (
    <div className="relative flex items-start justify-between gap-4 px-6 pt-6 pb-3 border-b border-gray-100">
      <div className="flex flex-col">
        <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-brand-primary">
          Rezerwacja
        </span>
        <h2 className="font-jakarta font-bold text-brand-secondary text-[18px] leading-tight mt-1 line-clamp-2">
          {campTitle}
        </h2>
        <span className="text-[12px] text-brand-secondary/60 mt-0.5">
          Krok {step === "details" ? "1" : "2"} z 2
        </span>
      </div>
      <button
        type="button"
        onClick={onClose}
        aria-label="Zamknij"
        className="shrink-0 w-9 h-9 rounded-full bg-gray-100 hover:bg-gray-200 text-brand-secondary flex items-center justify-center transition-colors"
      >
        <X size={16} weight="bold" />
      </button>
    </div>
  );
}

function StepIndicator({ step }: { step: Step }) {
  const stepIndex = step === "details" ? 0 : 1;
  return (
    <div className="px-6 pt-3" aria-hidden="true">
      <div className="grid grid-cols-2 gap-2">
        {[0, 1].map((i) => (
          <div
            key={i}
            className={`h-1 rounded-full transition-colors ${
              i <= stepIndex ? "bg-brand-primary" : "bg-gray-200"
            }`}
          />
        ))}
      </div>
    </div>
  );
}

function DetailsStep({
  mode,
  allowDuo,
  onModeChange,
  form,
  setField,
  isPending,
}: {
  mode: BookingMode;
  allowDuo: boolean;
  onModeChange: (m: BookingMode) => void;
  form: FormState;
  setField: <K extends keyof FormState>(key: K, value: FormState[K]) => void;
  isPending: boolean;
}) {
  return (
    <div className="flex flex-col gap-4">
      {allowDuo && (
        <ModeSwitcher mode={mode} onChange={onModeChange} disabled={isPending} />
      )}

      <Field
        label="Imię i nazwisko *"
        name="name"
        type="text"
        value={form.name}
        onChange={(v) => setField("name", v)}
        placeholder="Anna Kowalska"
        disabled={isPending}
        autoComplete="name"
      />
      <Field
        label="Adres e-mail *"
        name="email"
        type="email"
        value={form.email}
        onChange={(v) => setField("email", v)}
        placeholder="twoj@email.com"
        disabled={isPending}
        autoComplete="email"
      />
      <Field
        label="Numer telefonu *"
        name="phone"
        type="tel"
        value={form.phone}
        onChange={(v) => setField("phone", v)}
        placeholder="+48 000 000 000"
        disabled={isPending}
        autoComplete="tel"
      />
      {mode === "duo" && allowDuo && (
        <Field
          label="E-mail przyjaciółki *"
          name="friendEmail"
          type="email"
          value={form.friendEmail}
          onChange={(v) => setField("friendEmail", v)}
          placeholder="przyjaciolka@email.com"
          disabled={isPending}
          hint="Wyślemy jej zaproszenie po opłaceniu zadatku."
        />
      )}
    </div>
  );
}

function ModeSwitcher({
  mode,
  onChange,
  disabled,
}: {
  mode: BookingMode;
  onChange: (m: BookingMode) => void;
  disabled?: boolean;
}) {
  return (
    <div>
      <span className="text-[11px] font-bold text-brand-secondary uppercase tracking-wider ml-1">
        Wybierz pakiet
      </span>
      <div className="mt-2 grid grid-cols-2 gap-2 p-1 rounded-2xl bg-gray-50 border border-gray-100">
        <button
          type="button"
          disabled={disabled}
          onClick={() => onChange("solo")}
          className={`text-[12.5px] font-bold py-2.5 rounded-xl transition inline-flex items-center justify-center gap-1.5 ${
            mode === "solo"
              ? "bg-brand-primary text-white shadow-[0_6px_16px_-6px_rgba(40,125,136,0.5)]"
              : "text-brand-secondary/60 hover:text-brand-secondary"
          }`}
        >
          <User size={14} weight="duotone" />
          Solo
        </button>
        <button
          type="button"
          disabled={disabled}
          onClick={() => onChange("duo")}
          className={`text-[12.5px] font-bold py-2.5 rounded-xl transition inline-flex items-center justify-center gap-1.5 ${
            mode === "duo"
              ? "bg-brand-primary text-white shadow-[0_6px_16px_-6px_rgba(40,125,136,0.5)]"
              : "text-brand-secondary/60 hover:text-brand-secondary"
          }`}
        >
          <Heart size={13} weight="fill" />
          Z przyjaciółką
        </button>
      </div>
    </div>
  );
}

function SummaryStep({
  campTitle,
  location,
  dateRange,
  mode,
  seatCount,
  totalPrice,
  totalDeposit,
  acceptTerms,
  onAcceptChange,
  isPending,
}: {
  campTitle: string;
  location: string;
  dateRange: string;
  mode: BookingMode;
  seatCount: number;
  totalPrice: number;
  totalDeposit: number;
  acceptTerms: boolean;
  onAcceptChange: (v: boolean) => void;
  isPending: boolean;
}) {
  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-2xl border border-brand-primary/15 bg-brand-primary/5 p-5">
        <div className="flex items-center gap-2 mb-3">
          {mode === "duo" ? (
            <UsersFour size={20} weight="duotone" className="text-brand-primary" />
          ) : (
            <User size={20} weight="duotone" className="text-brand-primary" />
          )}
          <span className="font-jakarta font-bold text-brand-secondary text-[15px]">
            {mode === "duo" ? "Pakiet z przyjaciółką" : "Pakiet Solo"}
          </span>
          <span className="ml-auto text-[11px] font-bold uppercase tracking-wide text-brand-primary bg-white px-2 py-0.5 rounded-full">
            {seatCount} {seatCount === 1 ? "miejsce" : "miejsca"}
          </span>
        </div>
        <p className="font-montserrat text-[14px] text-brand-secondary leading-snug">
          {campTitle}
        </p>
        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[12.5px] text-brand-secondary/70">
          <span className="inline-flex items-center gap-1.5">
            <CalendarBlank size={13} weight="duotone" />
            {dateRange}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <MapPin size={13} weight="duotone" />
            {location}
          </span>
        </div>
      </div>

      <div className="rounded-2xl border border-gray-100 bg-gray-50/60 p-5">
        <SummaryRow
          label={`Cena × ${seatCount}`}
          value={
            totalPrice > 0
              ? `${totalPrice.toLocaleString("pl-PL")} zł`
              : "Wkrótce"
          }
        />
        {totalDeposit > 0 && (
          <SummaryRow
            label="Zadatek (płatne teraz)"
            value={`${totalDeposit.toLocaleString("pl-PL")} zł`}
            highlight
          />
        )}
        {totalDeposit > 0 && totalPrice > 0 && (
          <SummaryRow
            label="Pozostała kwota"
            value={`${(totalPrice - totalDeposit).toLocaleString("pl-PL")} zł`}
            muted
          />
        )}
      </div>

      <label className="flex items-start gap-3 p-4 rounded-2xl bg-white border border-gray-100 cursor-pointer">
        <input
          type="checkbox"
          checked={acceptTerms}
          onChange={(e) => onAcceptChange(e.target.checked)}
          disabled={isPending}
          className="mt-0.5 w-4 h-4 accent-brand-primary"
        />
        <span className="text-[12.5px] text-brand-secondary/75 leading-relaxed">
          Akceptuję{" "}
          <a
            className="underline font-semibold text-brand-primary"
            href="/regulamin"
            target="_blank"
            rel="noreferrer"
          >
            regulamin
          </a>{" "}
          oraz{" "}
          <a
            className="underline font-semibold text-brand-primary"
            href="/polityka-prywatnosci"
            target="_blank"
            rel="noreferrer"
          >
            politykę prywatności
          </a>
          . Wiem, że zadatek jest bezzwrotny.
        </span>
      </label>

      <div className="flex items-center gap-2 text-[11px] text-brand-secondary/55">
        <ShieldCheck size={14} weight="duotone" className="text-brand-primary" />
        Płatność obsługiwana przez Stripe · karta, BLIK, Przelewy24
      </div>
    </div>
  );
}

function SummaryRow({
  label,
  value,
  highlight,
  muted,
}: {
  label: string;
  value: string;
  highlight?: boolean;
  muted?: boolean;
}) {
  return (
    <div className="flex items-center justify-between py-1.5">
      <span
        className={`text-[12.5px] ${
          muted
            ? "text-brand-secondary/50"
            : "text-brand-secondary/70 font-medium"
        }`}
      >
        {label}
      </span>
      <span
        className={`text-[14px] font-bold ${
          highlight ? "text-brand-primary" : "text-brand-secondary"
        } ${muted ? "text-brand-secondary/50 font-medium" : ""}`}
      >
        {value}
      </span>
    </div>
  );
}

function SheetFooter({
  step,
  isPending,
  onBack,
  onNext,
  onSubmit,
  depositLabel,
}: {
  step: Step;
  isPending: boolean;
  onBack: () => void;
  onNext: () => void;
  onSubmit: () => void;
  depositLabel: string;
}) {
  return (
    <div className="border-t border-gray-100 px-6 py-4 bg-white/95 backdrop-blur-md flex items-center gap-3">
      {step === "summary" && (
        <button
          type="button"
          onClick={onBack}
          disabled={isPending}
          className="inline-flex items-center gap-1.5 px-4 py-3 rounded-2xl text-[13px] font-bold text-brand-secondary bg-gray-100 hover:bg-gray-200 transition disabled:opacity-60"
        >
          <ArrowLeft size={14} weight="bold" />
          Wstecz
        </button>
      )}
      {step === "details" ? (
        <button
          type="button"
          onClick={onNext}
          className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-2xl bg-brand-primary text-white text-[14px] font-bold hover:bg-brand-secondary transition shadow-[0_14px_30px_-10px_rgba(40,125,136,0.6)]"
        >
          Dalej
          <ArrowRight size={14} weight="bold" />
        </button>
      ) : (
        <button
          type="button"
          onClick={onSubmit}
          disabled={isPending}
          className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-2xl bg-brand-primary text-white text-[14px] font-bold hover:bg-brand-secondary transition shadow-[0_14px_30px_-10px_rgba(40,125,136,0.6)] disabled:opacity-80 disabled:cursor-not-allowed"
        >
          {isPending ? (
            <>
              <CircleNotch size={16} weight="bold" className="animate-spin" />
              Przekierowuję do Stripe…
            </>
          ) : (
            <>
              <CreditCard size={16} weight="duotone" />
              {depositLabel}
              <ArrowRight size={14} weight="bold" />
            </>
          )}
        </button>
      )}
    </div>
  );
}

function Field({
  label,
  name,
  type,
  value,
  onChange,
  placeholder,
  disabled,
  autoComplete,
  hint,
}: {
  label: string;
  name: string;
  type: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  disabled?: boolean;
  autoComplete?: string;
  hint?: string;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label
        htmlFor={name}
        className="text-[11px] font-bold text-brand-secondary uppercase tracking-wider ml-1"
      >
        {label}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        autoComplete={autoComplete}
        className="w-full px-5 py-3.5 rounded-2xl bg-white border border-gray-200 text-[14px] text-brand-secondary placeholder:text-brand-secondary/35 focus:outline-none focus:border-brand-primary focus:bg-white transition disabled:opacity-60"
      />
      {hint && (
        <span className="text-[11.5px] text-brand-secondary/55 ml-1 inline-flex items-center gap-1.5">
          <CheckCircle size={12} weight="duotone" className="text-brand-primary" />
          {hint}
        </span>
      )}
    </div>
  );
}
