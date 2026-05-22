"use client";

import React, { useState, useTransition } from "react";
import { motion } from "framer-motion";
import {
  ArrowRight,
  CircleNotch,
  Warning,
  ShieldCheck,
  CreditCard,
} from "@phosphor-icons/react/dist/ssr";
import { createCheckoutSession } from "@/app/actions/stripe";

interface Props {
  campId: string;
  depositLabel?: string;
}

interface FormState {
  name: string;
  email: string;
  phone: string;
  acceptTerms: boolean;
}

const initialState: FormState = {
  name: "",
  email: "",
  phone: "",
  acceptTerms: false,
};

export default function SingleCampForm({
  campId,
  depositLabel = "Zadatek 1000 zł",
}: Props) {
  const [form, setForm] = useState<FormState>(initialState);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((s) => ({ ...s, [key]: value }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!form.acceptTerms) {
      setError("Musisz zaakceptować warunki rezerwacji.");
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
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="rounded-[28px] bg-white/80 backdrop-blur-xl border border-white/40 shadow-[0_20px_60px_-25px_rgba(3,63,99,0.3)] p-6 md:p-10"
    >
      <div className="text-center">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-primary/10 text-brand-primary text-[10px] font-bold uppercase tracking-wider">
          <ShieldCheck size={11} weight="fill" />
          Rezerwacja online
        </div>
        <h3 className="font-jakarta font-bold text-[26px] md:text-[32px] text-brand-secondary mt-3">
          Zarezerwuj{" "}
          <span className="text-brand-primary font-medium">miejsce</span>
        </h3>
        <p className="font-montserrat text-[13.5px] leading-[1.7] text-brand-secondary/60 mt-2 max-w-md mx-auto">
          Wypełnij formularz i przejdź do bezpiecznej płatności. Po zaksięgowaniu
          zadatku otrzymasz dostęp do swojego panelu klientki.
        </p>
      </div>

      <form className="flex flex-col gap-4 mt-8" onSubmit={handleSubmit}>
        <Field
          label="Imię i nazwisko *"
          name="name"
          type="text"
          value={form.name}
          onChange={(v) => set("name", v)}
          placeholder="Anna Kowalska"
          disabled={isPending}
          autoComplete="name"
        />
        <Field
          label="Adres e-mail *"
          name="email"
          type="email"
          value={form.email}
          onChange={(v) => set("email", v)}
          placeholder="twoj@email.com"
          disabled={isPending}
          autoComplete="email"
        />
        <Field
          label="Numer telefonu *"
          name="phone"
          type="tel"
          value={form.phone}
          onChange={(v) => set("phone", v)}
          placeholder="+48 000 000 000"
          disabled={isPending}
          autoComplete="tel"
        />

        <label className="flex items-start gap-3 mt-2 p-4 rounded-2xl bg-white/60 border border-white/40 cursor-pointer">
          <input
            type="checkbox"
            checked={form.acceptTerms}
            onChange={(e) => set("acceptTerms", e.target.checked)}
            disabled={isPending}
            className="mt-0.5 w-4 h-4 accent-brand-primary"
          />
          <span className="text-[12.5px] text-brand-secondary/75 leading-relaxed">
            Akceptuję <a className="underline font-semibold text-brand-primary" href="/regulamin" target="_blank" rel="noreferrer">regulamin</a>{" "}
            oraz <a className="underline font-semibold text-brand-primary" href="/polityka-prywatnosci" target="_blank" rel="noreferrer">politykę prywatności</a>.
            Wiem, że zadatek jest bezzwrotny.
          </span>
        </label>

        {error && (
          <div className="flex items-start gap-2 p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 text-[13px]">
            <Warning size={16} weight="fill" className="shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <button
          type="submit"
          disabled={isPending}
          className="relative mt-4 w-full inline-flex items-center justify-center gap-2 px-6 py-4 rounded-2xl bg-brand-primary text-white text-[14px] font-bold hover:bg-brand-secondary transition shadow-[0_14px_30px_-10px_rgba(40,125,136,0.6)] disabled:opacity-80 disabled:cursor-not-allowed"
        >
          {isPending ? (
            <>
              <CircleNotch
                size={18}
                weight="bold"
                className="animate-spin"
              />
              Przekierowuję do Stripe…
            </>
          ) : (
            <>
              <CreditCard size={18} weight="duotone" />
              Przejdź do płatności · {depositLabel}
              <ArrowRight size={16} weight="bold" />
            </>
          )}
        </button>

        <div className="flex items-center justify-center gap-2 text-[11px] text-brand-secondary/55 mt-2">
          <ShieldCheck size={14} weight="duotone" className="text-brand-primary" />
          Płatność obsługiwana przez Stripe · karta, BLIK, Przelewy24
        </div>
      </form>
    </motion.div>
  );
}

interface FieldProps {
  label: string;
  name: string;
  type: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  disabled?: boolean;
  autoComplete?: string;
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
}: FieldProps) {
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
        required
        className="w-full px-5 py-3.5 rounded-2xl bg-white/70 border border-white/50 text-[14px] text-brand-secondary placeholder:text-brand-secondary/40 focus:outline-none focus:border-brand-primary focus:bg-white transition disabled:opacity-60"
      />
    </div>
  );
}
