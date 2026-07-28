"use client";

import { useState } from "react";
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
  amountLabel: string;
  returnUrl: string;
}

export function OrderPaymentStep({
  clientSecret,
  amountLabel,
  returnUrl,
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
      <PaymentForm amountLabel={amountLabel} returnUrl={returnUrl} />
    </Elements>
  );
}

function PaymentForm({
  amountLabel,
  returnUrl,
}: {
  amountLabel: string;
  returnUrl: string;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [paying, setPaying] = useState(false);
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
      <PaymentElement
        options={{
          layout: { type: "tabs", defaultCollapsed: false },
        }}
      />

      {error && (
        <div className="flex items-start gap-2 text-sm text-rose-600 bg-rose-50 border border-rose-100 rounded-xl px-4 py-3">
          <WarningCircle size={18} weight="fill" className="shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      <button
        type="button"
        onClick={handlePay}
        disabled={!stripe || !elements || paying}
        className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl text-white text-sm font-bold transition disabled:opacity-50 disabled:cursor-not-allowed"
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
            Zapłać {amountLabel}
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
