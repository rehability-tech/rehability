"use client";

import { useState } from "react";
import {
  Check,
  User,
  Buildings,
  ArrowRight,
} from "@phosphor-icons/react/dist/ssr";
import { OrderSummary } from "./OrderSummary";
import type { Course } from "../_data/courses";

type BuyerType = "private" | "company";

const STEPS = ["Konto", "Dane do płatności", "Płatność", "Podsumowanie"];

function Stepper() {
  // Krok 1 ukończony, krok 2 aktywny (zgodnie z projektem).
  const activeStep = 2;
  return (
    <div className="flex flex-wrap items-center justify-center gap-6 md:gap-8 px-2 py-8">
      {STEPS.map((label, i) => {
        const step = i + 1;
        const isDone = step < activeStep;
        const isActive = step === activeStep;
        return (
          <div key={label} className="flex items-center gap-2">
            <span
              className={`flex items-center justify-center size-[30px] rounded-full text-[15px] font-semibold ${
                isDone || isActive
                  ? "bg-brand-primary text-white"
                  : "border border-brand-primary text-brand-primary"
              }`}
            >
              {isDone ? <Check size={16} weight="bold" /> : step}
            </span>
            <span className="font-montserrat text-[14px] text-brand-secondary whitespace-nowrap">
              {label}
            </span>
          </div>
        );
      })}
    </div>
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
      <span className="font-montserrat text-[11px] tracking-[-0.3px] text-brand-secondary/70">
        {label}
      </span>
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="h-12 px-3 rounded-md border border-brand-primary/20 bg-white font-montserrat text-[13px] text-brand-secondary placeholder:text-brand-secondary/40 outline-none focus:border-brand-primary"
      />
    </label>
  );
}

export function CheckoutClient({ course }: { course: Course }) {
  const [buyer, setBuyer] = useState<BuyerType>("private");
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: walidacja + utworzenie sesji płatności Stripe dla `course`.
  };

  const buyerOptions: { id: BuyerType; label: string; icon: React.ReactNode }[] =
    [
      { id: "private", label: "Osoba prywatna", icon: <User size={24} weight="duotone" /> },
      { id: "company", label: "Firma", icon: <Buildings size={24} weight="duotone" /> },
    ];

  return (
    <div className="flex flex-col gap-8">
      <Stepper />

      <div className="flex flex-col lg:flex-row gap-10 lg:gap-[39px] items-start justify-center">
        {/* LEWA: formularz */}
        <form
          onSubmit={handleSubmit}
          className="flex-1 max-w-[731px] w-full flex flex-col gap-8"
        >
          <div className="border-b border-brand-primary/20 pb-6">
            <h2 className="font-montserrat font-semibold text-[20px] text-black">
              Dane do płatności
            </h2>
          </div>

          {/* Toggle typu nabywcy */}
          <div className="flex flex-wrap gap-4">
            {buyerOptions.map((opt) => {
              const isActive = buyer === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setBuyer(opt.id)}
                  className={`flex items-center gap-4 px-[18px] py-2 rounded-xl transition-colors ${
                    isActive
                      ? "bg-[#d4e5e7] text-brand-primary"
                      : "border border-brand-primary/20 text-brand-primary hover:border-brand-primary/50"
                  }`}
                >
                  <span className="flex items-center justify-center size-[45px] rounded-lg bg-white text-brand-primary">
                    {opt.icon}
                  </span>
                  <span className="font-montserrat font-semibold text-[16px]">
                    {opt.label}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Pola */}
          <div className="flex flex-col gap-6">
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

          <button
            type="submit"
            className="self-start inline-flex items-center gap-2 bg-brand-primary text-white font-montserrat font-semibold text-[16px] px-6 py-3.5 rounded-3xl rounded-tr-[2px] shadow-[0_4px_15px_0px_rgba(40,125,136,0.35)] transition-colors hover:bg-brand-secondary"
          >
            Przejdź do płatności
            <ArrowRight size={18} weight="bold" />
          </button>
        </form>

        {/* PRAWA: podsumowanie */}
        <OrderSummary course={course} />
      </div>
    </div>
  );
}
