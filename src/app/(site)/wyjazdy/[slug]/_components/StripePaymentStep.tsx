"use client";

import React, { useState } from "react";
import { loadStripe, type Stripe } from "@stripe/stripe-js";
import {
  Elements,
  PaymentElement,
  useElements,
  useStripe,
} from "@stripe/react-stripe-js";
import {
  CircleNotch,
  CreditCard,
  WarningCircle,
} from "@phosphor-icons/react/dist/ssr";

const COLORS = { text: "#0B3B4C", accent: "#287D88" } as const;

let stripePromise: Promise<Stripe | null> | null = null;
function getStripe() {
  if (!stripePromise) {
    const key = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
    if (!key) {
      console.error("NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY nie jest ustawiony.");
      stripePromise = Promise.resolve(null);
    } else {
      stripePromise = loadStripe(key);
    }
  }
  return stripePromise;
}

interface Props {
  clientSecret: string;
  depositLabel: string;
  returnUrl: string;
  /** Wstępnie wypełnia pole email w Payment Element (np. z konta kursanta). */
  email?: string;
}

export default function StripePaymentStep({
  clientSecret,
  depositLabel,
  returnUrl,
  email,
}: Props) {
  return (
    <Elements
      stripe={getStripe()}
      options={{
        clientSecret,
        locale: "pl",
        appearance: {
          theme: "stripe",
          variables: {
            colorPrimary: COLORS.accent,
            colorText: COLORS.text,
            colorTextSecondary: "#6b7280",
            borderRadius: "12px",
            fontFamily: "Montserrat, system-ui, sans-serif",
            fontSizeBase: "14px",
          },
        },
      }}
    >
      <PaymentForm
        depositLabel={depositLabel}
        returnUrl={returnUrl}
        email={email}
      />
    </Elements>
  );
}

// Placeholder pokazywany, dopóki PaymentElement się nie załaduje (onReady).
function PaymentElementSkeleton() {
  return (
    <div className="absolute inset-0 z-10 bg-white animate-pulse flex flex-col gap-4">
      <div className="grid grid-cols-3 gap-2">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="h-[56px] rounded-xl bg-gray-100 border border-gray-200/70"
          />
        ))}
      </div>
      <div className="h-3 w-16 rounded bg-gray-100" />
      <div className="h-12 rounded-xl bg-gray-100" />
      <div className="h-3 w-20 rounded bg-gray-100" />
      <div className="h-12 rounded-xl bg-gray-100" />
    </div>
  );
}

function PaymentForm({
  depositLabel,
  returnUrl,
  email,
}: {
  depositLabel: string;
  returnUrl: string;
  email?: string;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [paying, setPaying] = useState(false);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handlePay() {
    if (!stripe || !elements) return;
    setPaying(true);
    setError(null);

    const { error: submitError } = await elements.submit();
    if (submitError) {
      setError(submitError.message ?? "Sprawdź dane karty.");
      setPaying(false);
      return;
    }

    const { error: confirmError } = await stripe.confirmPayment({
      elements,
      confirmParams: { return_url: returnUrl },
    });

    // Jeśli dotarliśmy tu, znaczy że płatność nie przekierowała — był błąd.
    if (confirmError) {
      setError(
        confirmError.message ??
          "Płatność nie powiodła się. Spróbuj ponownie lub użyj innej metody.",
      );
    }
    setPaying(false);
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="relative min-h-[260px]">
        <PaymentElement
          options={{
            layout: { type: "tabs", defaultCollapsed: false },
            ...(email
              ? { defaultValues: { billingDetails: { email } } }
              : {}),
          }}
          onReady={() => setReady(true)}
        />
        {!ready && <PaymentElementSkeleton />}
      </div>

      {error && (
        <div className="flex items-start gap-2 text-sm text-rose-600 bg-rose-50 border border-rose-100 rounded-xl px-4 py-3">
          <WarningCircle size={18} weight="fill" className="shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      <button
        type="button"
        onClick={handlePay}
        disabled={!stripe || !elements || paying || !ready}
        className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl text-white text-sm font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed"
        style={{ background: COLORS.accent }}
      >
        {paying ? (
          <>
            <CircleNotch size={16} weight="bold" className="animate-spin" />
            Przetwarzamy płatność…
          </>
        ) : (
          <>
            <CreditCard size={16} weight="bold" />
            Zapłać {depositLabel}
          </>
        )}
      </button>

      <p className="text-[11px] text-gray-400 text-center">
        Twoje dane karty są przesyłane bezpośrednio do Stripe. Nie przechodzą
        przez nasze serwery.
      </p>
    </div>
  );
}
