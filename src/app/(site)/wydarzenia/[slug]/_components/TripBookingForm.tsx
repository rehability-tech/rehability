"use client";

import React, { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { signIn, signOut } from "next-auth/react";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle,
  CircleNotch,
  CreditCard,
  GoogleLogo,
  Heart,
  ShieldCheck,
  SignOut,
  User as UserIcon,
  UsersThree,
  WarningCircle,
} from "@phosphor-icons/react/dist/ssr";
import { cn } from "@/lib/utils";
import StripePaymentStep from "./StripePaymentStep";
import Link from "next/link";
import { MOCK_ACCOUNTS } from "@/lib/auth/mockAccounts";
import {
  pricingFingerprint,
  type PublicPricing,
} from "@/lib/discounts/publicPricing";
import { DiscountCodeBox } from "./DiscountCodeBox";
import { PriceBreakdown } from "./PriceBreakdown";

const EASE = [0.22, 1, 0.36, 1] as const;
const SPRING = { type: "spring", stiffness: 320, damping: 32 } as const;
const IS_DEV = process.env.NODE_ENV === "development";

export type CurrentUser = {
  email: string;
  name: string | null;
  image: string | null;
};

type Variant = "standard" | "duo";
type Step = 1 | 2 | 3 | 4 | 5;

type Customer = { firstName: string; lastName: string; phone: string };
type Friend = { firstName: string; lastName: string; email: string };

const EMPTY_CUSTOMER: Customer = { firstName: "", lastName: "", phone: "" };
const EMPTY_FRIEND: Friend = { firstName: "", lastName: "", email: "" };

interface TripBookingFormProps {
  tripId: string;
  tripTitle: string;
  allowBringFriend: boolean;
  currentUser: CurrentUser | null;
  initialVariant?: Variant;
  initialStep?: number;
  /** Wycena policzona na serwerze (bez kodu). Źródło prawdy dla cen w formularzu. */
  initialPricing: PublicPricing;
  /**
   * Informuje stronę o aktualnym kroku. Od kroku 2 formularz przejmuje główną
   * kolumnę — logowanie, dane, podsumowanie i płatność nie mieszczą się
   * w wąskim boczku.
   */
  onStepChange?: (step: number) => void;
}

/**
 * Formatuje GROSZE. Dwa miejsca po przecinku, bo kwota po rabacie rzadko
 * wychodzi okrągła — a różnica „1 440 zł" vs „1 439,50 zł" to dokładnie ta,
 * o którą klient zapyta.
 */
function formatGroszeExact(grosze: number) {
  return (grosze / 100).toLocaleString("pl-PL", {
    style: "currency",
    currency: "PLN",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
}

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

function splitName(full: string | null): {
  firstName: string;
  lastName: string;
} {
  if (!full) return { firstName: "", lastName: "" };
  const parts = full.trim().split(/\s+/);
  if (parts.length === 1) return { firstName: parts[0], lastName: "" };
  return { firstName: parts[0], lastName: parts.slice(1).join(" ") };
}

function clampStep(n: number | undefined, isLogged: boolean): Step {
  if (!n) return 1;
  const max: Step = isLogged ? 5 : 2;
  return Math.min(Math.max(1, Math.floor(n)), max) as Step;
}

export default function TripBookingForm({
  tripId,
  tripTitle,
  allowBringFriend,
  currentUser,
  initialVariant,
  initialStep,
  initialPricing,
  onStepChange,
}: TripBookingFormProps) {
  const isLogged = !!currentUser;
  const initialNameParts = splitName(currentUser?.name ?? null);

  const [step, setStep] = useState<Step>(clampStep(initialStep, isLogged));
  const [direction, setDirection] = useState<1 | -1>(1);
  const [variant, setVariant] = useState<Variant>(initialVariant ?? "standard");
  const [customer, setCustomer] = useState<Customer>({
    ...EMPTY_CUSTOMER,
    firstName: initialNameParts.firstName,
    lastName: initialNameParts.lastName,
  });
  const [friend, setFriend] = useState<Friend>(EMPTY_FRIEND);
  const [rodo, setRodo] = useState(false);
  const [health, setHealth] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [bookingId, setBookingId] = useState<string | null>(null);

  // ── Rabaty ──────────────────────────────────────────────────────────────
  // `pricing` jest ŹRÓDŁEM PRAWDY dla wszystkich kwot w formularzu. Startuje
  // z wyceny policzonej na serwerze i aktualizuje się po każdej próbie kodu.
  const [pricing, setPricing] = useState<PublicPricing>(initialPricing);
  const [checkingCode, setCheckingCode] = useState(false);
  const [codeStatus, setCodeStatus] = useState<{
    ok: boolean;
    message: string | null;
  } | null>(null);

  // Odcisk wyceny z chwili utworzenia PaymentIntenta. Kwoty PI nie da się
  // zmienić, więc każda zmiana ceny musi unieważnić koszyk.
  const [paidFingerprint, setPaidFingerprint] = useState<string | null>(null);

  const isDuo = variant === "duo";

  const step3Errors = useMemo(() => {
    const e: Partial<Record<string, string>> = {};
    if (!customer.firstName.trim()) e.firstName = "Podaj imię.";
    if (!customer.lastName.trim()) e.lastName = "Podaj nazwisko.";
    if (customer.phone.trim().length < 6) e.phone = "Podaj numer telefonu.";
    if (!rodo) e.rodo = "Wymagana zgoda RODO.";
    if (!health) e.health = "Wymagane oświadczenie zdrowotne.";
    if (isDuo) {
      if (!friend.firstName.trim())
        e.friendFirstName = "Podaj imię osoby towarzyszącej.";
      if (!friend.lastName.trim()) e.friendLastName = "Podaj nazwisko.";
      if (!isValidEmail(friend.email)) e.friendEmail = "Nieprawidłowy email.";
      if (
        currentUser &&
        isValidEmail(friend.email) &&
        friend.email.trim().toLowerCase() === currentUser.email.toLowerCase()
      ) {
        e.friendEmail = "Musi być inny niż Twój.";
      }
    }
    return e;
  }, [customer, friend, rodo, health, isDuo, currentUser]);
  const step3Valid = Object.keys(step3Errors).length === 0;

  function goTo(next: Step) {
    setDirection(next > step ? 1 : -1);
    setStep(next);
  }

  function bookingCallbackUrl() {
    return `/wydarzenia/${tripId}?variant=${variant}&step=3#formularz-rezerwacji`;
  }

  function handleGoogleLogin() {
    signIn("google", { callbackUrl: bookingCallbackUrl() });
  }

  // Dev-only — logowanie przez provider `dev-mock`, wraca do kroku 3 formularza.
  function handleMockLogin(email: string) {
    signIn("dev-mock", { email, callbackUrl: bookingCallbackUrl() });
  }

  function handleNext() {
    if (step === 1) return goTo(isLogged ? 3 : 2);
    if (step === 2 && isLogged) return goTo(3);
    if (step === 3 && step3Valid) return goTo(4);
  }

  function handleBack() {
    if (step === 3 && isLogged) return goTo(1);
    goTo(Math.max(1, step - 1) as Step);
  }

  /**
   * Unieważnia istniejący PaymentIntent i cofa na podsumowanie.
   * Wołane po KAŻDEJ zmianie ceny — inaczej uczestnik zapłaciłby kwotę
   * sprzed zmiany kodu.
   */
  function invalidatePaymentIntent(reason?: string) {
    setClientSecret(null);
    setBookingId(null);
    setPaidFingerprint(null);
    if (reason) setSubmitError(reason);
    if (step === 5) goTo(4);
  }

  async function applyDiscountCode(code: string | null) {
    setCheckingCode(true);
    setCodeStatus(null);
    try {
      const res = await fetch("/api/bookings/validate-discount", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tripId, code }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        setCodeStatus({
          ok: false,
          message: data?.error ?? "Nie udało się sprawdzić kodu.",
        });
        return;
      }

      setPricing({
        baseAmount: data.baseAmount,
        finalAmount: data.finalAmount,
        totalDiscount: data.totalDiscount,
        lines: data.lines,
        depositGrosze: data.depositGrosze,
        remainderGrosze: data.remainderGrosze,
        appliedCode: data.appliedCode,
        couponOutranked: data.couponOutranked,
        isSandbox: pricing.isSandbox,
      });

      setCodeStatus(
        data.codeStatus?.message
          ? { ok: data.codeStatus.ok, message: data.codeStatus.message }
          : null,
      );

      // Cena mogła się zmienić — stary koszyk przestaje być ważny.
      invalidatePaymentIntent();
    } catch (err) {
      console.error(err);
      setCodeStatus({
        ok: false,
        message: "Brak połączenia z serwerem. Spróbuj ponownie.",
      });
    } finally {
      setCheckingCode(false);
    }
  }

  async function handleCreatePayment() {
    if (!currentUser) return goTo(2);

    setSubmitting(true);
    setSubmitError(null);
    try {
      const res = await fetch("/api/bookings/create-payment-intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tripId,
          variant,
          customer: {
            firstName: customer.firstName,
            lastName: customer.lastName,
            phone: customer.phone,
          },
          consents: { rodo: true, health: true },
          friend: isDuo ? friend : undefined,
          discountCode: pricing.appliedCode ?? undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        const msg =
          (data as { error?: string } | null)?.error ??
          "Coś poszło nie tak. Spróbuj ponownie.";
        setSubmitError(msg);
        setSubmitting(false);
        return;
      }
      const data = await res.json();

      // Kwoty bierzemy Z ODPOWIEDZI SERWERA, nie z lokalnego stanu — serwer
      // przeliczył wycenę od nowa i to jego wynik trafił do Stripe.
      const serverPricing: PublicPricing = {
        baseAmount: data.baseAmount,
        finalAmount: data.total,
        totalDiscount: data.totalDiscount,
        lines: data.lines,
        depositGrosze: data.deposit,
        remainderGrosze: data.total - data.deposit,
        appliedCode: data.codeStatus?.ok ? data.codeStatus.code : null,
        couponOutranked: data.couponOutranked,
        isSandbox: pricing.isSandbox,
      };

      setPricing(serverPricing);
      setPaidFingerprint(pricingFingerprint(serverPricing));
      setClientSecret(data.clientSecret);
      setBookingId(data.bookingId);
      setSubmitting(false);
      goTo(5);
    } catch (err) {
      console.error(err);
      setSubmitError(
        "Brak połączenia z serwerem. Sprawdź internet i spróbuj ponownie.",
      );
      setSubmitting(false);
    }
  }

  // Raportujemy krok na zewnątrz — także ten początkowy (powrót z logowania
  // wchodzi na ?step=3 i od razu ma pokazać szeroki układ).
  useEffect(() => {
    onStepChange?.(step);
  }, [step, onStepChange]);

  /**
   * Pas bezpieczeństwa: gdyby cena zmieniła się już po utworzeniu koszyka
   * (np. przecena wygasła w tle), nie pozwalamy zapłacić nieaktualnej kwoty.
   * Serwer i tak przelicza wycenę przy tworzeniu PI, więc to zabezpieczenie
   * jest wyłącznie UX-owe — nie może doprowadzić do zaniżonego obciążenia.
   */
  useEffect(() => {
    if (
      step === 5 &&
      paidFingerprint &&
      paidFingerprint !== pricingFingerprint(pricing)
    ) {
      invalidatePaymentIntent(
        "Cena się zmieniła. Sprawdź podsumowanie i potwierdź ponownie.",
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, paidFingerprint, pricing]);

  const slideVariants = {
    enter: (dir: 1 | -1) => ({ opacity: 0, x: dir * 40, filter: "blur(6px)" }),
    center: { opacity: 1, x: 0, filter: "blur(0px)" },
    exit: (dir: 1 | -1) => ({ opacity: 0, x: dir * -40, filter: "blur(6px)" }),
  };

  return (
    <section id="formularz-rezerwacji" className="scroll-mt-32">
      <motion.div
        layout
        transition={SPRING}
        className="relative rounded-[32px] bg-white/60 backdrop-blur-2xl border border-white/60 shadow-[0_15px_60px_-15px_rgba(3,63,99,0.15)] overflow-hidden"
      >
        {/* Subtelny Glow w Tle Formularza */}
        <div className="absolute -top-20 -right-20 w-56 h-56 bg-brand-yellow/10 rounded-full blur-[60px] pointer-events-none" />

        <header className="px-6 sm:px-8 pt-8 pb-6 border-b border-white/40 relative z-10">
          <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-brand-primary mb-2">
            <span className="inline-block w-4 h-[2px] bg-brand-primary rounded-full" />
            Zarezerwuj wydarzenie
          </div>
          <h2 className="text-2xl sm:text-[28px] font-jakarta font-bold text-brand-secondary leading-tight">
            Krok po kroku
          </h2>
          <Stepper step={step} />
        </header>

        <motion.div
          layout
          transition={SPRING}
          className="px-6 sm:px-8 py-8 min-h-[420px] relative z-10"
        >
          <AnimatePresence mode="wait" initial={false} custom={direction}>
            <motion.div
              key={step}
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.35, ease: EASE }}
              className="flex flex-col gap-6"
            >
              {step === 1 && (
                <Step1Variant
                  variant={variant}
                  setVariant={setVariant}
                  pricing={pricing}
                  allowBringFriend={allowBringFriend}
                />
              )}

              {step === 2 && (
                <Step2Login
                  currentUser={currentUser}
                  onLogin={handleGoogleLogin}
                  onMockLogin={handleMockLogin}
                  variant={variant}
                />
              )}

              {step === 3 && (
                <Step3Details
                  currentUser={currentUser!}
                  customer={customer}
                  setCustomer={setCustomer}
                  friend={friend}
                  setFriend={setFriend}
                  isDuo={isDuo}
                  rodo={rodo}
                  setRodo={setRodo}
                  health={health}
                  setHealth={setHealth}
                  errors={step3Errors}
                />
              )}

              {step === 4 && (
                <Step4Summary
                  tripTitle={tripTitle}
                  isDuo={isDuo}
                  currentUser={currentUser!}
                  customer={customer}
                  friend={friend}
                  pricing={pricing}
                  submitError={submitError}
                  submitting={submitting}
                  checkingCode={checkingCode}
                  codeStatus={codeStatus}
                  onApplyCode={applyDiscountCode}
                />
              )}

              {step === 5 && clientSecret && bookingId && (
                <Step5Payment
                  clientSecret={clientSecret}
                  bookingId={bookingId}
                  pricing={pricing}
                  onChangeCode={() => invalidatePaymentIntent()}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </motion.div>

        {step !== 5 && (
          <motion.footer
            layout
            transition={SPRING}
            className="px-6 sm:px-8 py-5 bg-white/40 border-t border-white/60 flex flex-col-reverse sm:flex-row gap-3 sm:items-center sm:justify-between relative z-10"
          >
            {step > 1 ? (
              <button
                type="button"
                onClick={handleBack}
                disabled={submitting}
                className="inline-flex items-center justify-center gap-2 text-[13px] font-bold text-brand-secondary/60 hover:text-brand-primary transition-colors px-4 py-2 disabled:opacity-50"
              >
                <ArrowLeft size={16} weight="bold" /> Wstecz
              </button>
            ) : (
              <span />
            )}

            {step < 4 && (
              <PrimaryButton
                onClick={handleNext}
                disabled={
                  (step === 2 && !isLogged) || (step === 3 && !step3Valid)
                }
              >
                Dalej <ArrowRight size={16} weight="bold" />
              </PrimaryButton>
            )}

            {step === 4 && (
              <PrimaryButton
                onClick={handleCreatePayment}
                disabled={submitting}
                loading={submitting}
                loadingLabel="Przetwarzanie…"
              >
                <CreditCard size={16} weight="bold" />
                Opłać zadatek · {formatGroszeExact(pricing.depositGrosze)}
              </PrimaryButton>
            )}
          </motion.footer>
        )}
      </motion.div>
    </section>
  );
}

/* ───────────────────────── Stepper ───────────────────────── */

function Stepper({ step }: { step: Step }) {
  const items: Array<{ n: Step; label: string }> = [
    { n: 1, label: "Wariant" },
    { n: 2, label: "Konto" },
    { n: 3, label: "Dane" },
    { n: 4, label: "Podsum." },
    { n: 5, label: "Płatność" },
  ];
  const progress = ((step - 1) / (items.length - 1)) * 100;

  return (
    <div className="mt-7">
      <div className="relative">
        <div className="h-1.5 w-full bg-white/50 rounded-full border border-white/60 shadow-inner" />
        <motion.div
          className="absolute top-0 left-0 h-1.5 rounded-full bg-gradient-to-r from-brand-primary to-brand-yellow shadow-[0_0_10px_rgba(40,125,136,0.5)]"
          initial={false}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.5, ease: EASE }}
        />
      </div>
      <ol className="mt-3 flex items-start justify-between gap-1">
        {items.map((it) => {
          const active = it.n === step;
          const done = it.n < step;
          return (
            <li
              key={it.n}
              className="flex flex-col items-center gap-1.5 flex-1 min-w-0"
            >
              <motion.span
                initial={false}
                animate={{
                  scale: active ? 1.1 : 1,
                  backgroundColor:
                    done || active ? "#287D88" : "rgba(255, 255, 255, 0.6)",
                  borderColor:
                    done || active ? "#287D88" : "rgba(255, 255, 255, 0.8)",
                  color: done || active ? "#ffffff" : "#0B3B4C",
                  opacity: done || active ? 1 : 0.4,
                }}
                transition={SPRING}
                className="flex items-center justify-center w-7 h-7 rounded-full text-[11px] font-bold shadow-sm border"
              >
                {done ? <CheckCircle size={14} weight="fill" /> : it.n}
              </motion.span>
              {/* Etykieta tylko pod aktywnym krokiem */}
              <AnimatePresence mode="wait">
                {active && (
                  <motion.span
                    key={it.n}
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={{ duration: 0.2, ease: EASE }}
                    className="text-[10px] font-bold text-center w-full tracking-wider uppercase text-brand-primary whitespace-nowrap"
                  >
                    {it.label}
                  </motion.span>
                )}
              </AnimatePresence>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

/* ───────────────────────── Step 1: Variant ───────────────────────── */

function Step1Variant({ variant, setVariant, pricing, allowBringFriend }: any) {
  return (
    <Stagger>
      <Item>
        <h3 className="font-jakarta font-bold text-[20px] text-brand-secondary">
          Kto jedzie?
        </h3>
        <p className="text-[13px] font-medium text-brand-secondary/60 mt-1 leading-relaxed">
          Możesz zarezerwować miejsce tylko dla siebie lub zabrać ze sobą
          osobę towarzyszącą.
        </p>
      </Item>
      <Item>
        <VariantCard
          selected={variant === "standard"}
          onClick={() => setVariant("standard")}
          icon={<UserIcon size={22} weight="duotone" />}
          title="Tylko ja"
          subtitle="Jadę solo. Rezerwuję 1 miejsce."
          pricePerPerson={pricing.finalAmount}
          basePricePerPerson={pricing.baseAmount}
        />
      </Item>
      {allowBringFriend && (
        <Item>
          <VariantCard
            selected={variant === "duo"}
            onClick={() => setVariant("duo")}
            icon={<UsersThree size={22} weight="duotone" />}
            title="Zabierz osobę towarzyszącą"
            subtitle="Dzielicie pokój, my zajmiemy się resztą."
            pricePerPerson={pricing.finalAmount}
          basePricePerPerson={pricing.baseAmount}
            badge="Duo"
          />
        </Item>
      )}
    </Stagger>
  );
}

/* ───────────────────────── Step 2: Login ───────────────────────── */

function Step2Login({ currentUser, onLogin, onMockLogin, variant }: any) {
  const [mockEmail, setMockEmail] = useState(MOCK_ACCOUNTS[0].email);

  if (currentUser) {
    return (
      <Stagger>
        <Item>
          <h3 className="font-jakarta font-bold text-[20px] text-brand-secondary">
            Twoje konto
          </h3>
          <p className="text-[13px] font-medium text-brand-secondary/60 mt-1 leading-relaxed">
            Jesteś pomyślnie zalogowana. Możesz przejść do podsumowania danych.
          </p>
        </Item>
        <Item>
          <LoggedInCard user={currentUser} />
        </Item>
      </Stagger>
    );
  }

  return (
    <Stagger>
      <Item>
        <h3 className="font-jakarta font-bold text-[20px] text-brand-secondary">
          Zaloguj się
        </h3>
        <p className="text-[13px] font-medium text-brand-secondary/60 mt-1 leading-relaxed">
          Konto jest wymagane, by móc opłacić resztę wydarzenia, wyświetlić swój
          e-bilet i uzyskać dostęp do panelu uczestnika.
        </p>
      </Item>
      <Item>
        <button
          type="button"
          onClick={onLogin}
          className="group w-full rounded-2xl border border-white/60 bg-white/50 backdrop-blur-sm px-5 py-4 flex items-center justify-between gap-4 transition-all shadow-sm hover:shadow-[0_8px_20px_-8px_rgba(40,125,136,0.2)] hover:border-brand-primary/30"
        >
          <div className="flex items-center gap-4">
            <span className="flex items-center justify-center w-12 h-12 rounded-xl bg-white shadow-sm">
              <GoogleLogo size={22} weight="bold" className="text-gray-700" />
            </span>
            <div className="text-left">
              <div className="font-jakarta font-bold text-[15px] text-brand-secondary">
                Kontynuuj z Google
              </div>
              <p className="text-[12px] font-medium text-brand-secondary/50 mt-0.5">
                Bezpieczne i błyskawiczne logowanie.
              </p>
            </div>
          </div>
          <ArrowRight
            size={20}
            weight="bold"
            className="text-brand-secondary/30 group-hover:text-brand-primary transition-colors"
          />
        </button>
      </Item>
      <Item>
        <div className="flex items-start gap-3 text-[12px] font-medium text-brand-secondary/60 rounded-[16px] bg-brand-primary/5 border border-brand-primary/10 px-4 py-3">
          <ShieldCheck
            size={18}
            weight="duotone"
            className="text-brand-primary shrink-0 mt-0.5"
          />
          <p>
            Po autoryzacji wrócisz dokładnie do tego miejsca z wariantem{" "}
            <strong>{variant === "duo" ? "Duo" : "Standard"}</strong>.
            Obiecujemy, żadnego spamu.
          </p>
        </div>
      </Item>

      {IS_DEV && (
        <Item>
          <div className="rounded-2xl border-2 border-dashed border-yellow-400 bg-yellow-50 px-4 py-3">
            <p className="text-[12px] font-bold text-brand-secondary mb-2">
              🛠️ DEV: Mock Login
            </p>
            <div className="flex flex-col sm:flex-row gap-2">
              <select
                value={mockEmail}
                onChange={(e) => setMockEmail(e.target.value)}
                className="flex-1 text-[13px] px-3 py-2 rounded-lg border border-yellow-400 bg-white text-brand-secondary focus:outline-none focus:ring-2 focus:ring-yellow-400"
              >
                {MOCK_ACCOUNTS.map((acc) => (
                  <option key={acc.email} value={acc.email}>
                    {acc.label}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => onMockLogin(mockEmail)}
                className="text-[13px] font-semibold px-4 py-2 rounded-lg bg-brand-secondary text-white hover:bg-brand-primary transition-colors"
              >
                Zaloguj jako mock
              </button>
            </div>
          </div>
        </Item>
      )}
    </Stagger>
  );
}

function LoggedInCard({ user }: { user: CurrentUser }) {
  return (
    <div className="rounded-[20px] border border-white/60 bg-white/50 backdrop-blur-sm shadow-sm p-4 flex items-center justify-between gap-4">
      <div className="flex items-center gap-4 min-w-0">
        {user.image ? (
          <img
            src={user.image}
            alt=""
            className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-sm"
          />
        ) : (
          <span className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold bg-gradient-to-br from-brand-primary to-brand-yellow shadow-sm">
            {(user.name ?? user.email).slice(0, 1).toUpperCase()}
          </span>
        )}
        <div className="min-w-0">
          <div className="font-jakarta font-bold text-[15px] text-brand-secondary truncate">
            {user.name ?? "Witaj!"}
          </div>
          <div className="text-[12px] font-medium text-brand-secondary/50 truncate">
            {user.email}
          </div>
        </div>
      </div>
      <button
        type="button"
        onClick={() => signOut({ callbackUrl: window.location.href })}
        className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-brand-secondary/40 hover:text-rose-500 px-3 py-2 rounded-xl hover:bg-white transition shrink-0"
      >
        <SignOut size={14} weight="bold" />
        Wyloguj
      </button>
    </div>
  );
}

/* ───────────────────────── Step 3: Details ───────────────────────── */

function Step3Details({
  currentUser,
  customer,
  setCustomer,
  friend,
  setFriend,
  isDuo,
  rodo,
  setRodo,
  health,
  setHealth,
  errors,
}: any) {
  return (
    <Stagger>
      <Item>
        <h3 className="font-jakarta font-bold text-[20px] text-brand-secondary">
          Dane uczestników
        </h3>
        <p className="text-[13px] font-medium text-brand-secondary/60 mt-1 leading-relaxed">
          Uzupełnij brakujące dane. Dbamy o Twoją prywatność.
        </p>
      </Item>

      <Item>
        {/* Imię i nazwisko obok siebie, gdy jest miejsce — formularz od kroku 3
            zajmuje szeroką kolumnę, więc pola na całą szerokość wyglądałyby
            źle. Na wąskim widoku wracają do jednej kolumny. */}
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field
              label="Imię"
              value={customer.firstName}
              onChange={(v) => setCustomer({ ...customer, firstName: v })}
              error={errors.firstName}
            />
            <Field
              label="Nazwisko"
              value={customer.lastName}
              onChange={(v) => setCustomer({ ...customer, lastName: v })}
              error={errors.lastName}
            />
          </div>
          <Field
            label="Numer telefonu"
            type="tel"
            value={customer.phone}
            onChange={(v) => setCustomer({ ...customer, phone: v })}
            error={errors.phone}
          />
        </div>
      </Item>

      {isDuo && (
        <Item>
          <div className="rounded-[20px] border border-brand-primary/20 bg-brand-primary/5 p-5 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-brand-yellow/10 rounded-full blur-[40px] pointer-events-none" />
            <div className="flex items-center gap-2 mb-2 relative z-10">
              <UsersThree
                size={20}
                weight="duotone"
                className="text-brand-primary"
              />
              <h4 className="font-jakarta font-bold text-[15px] text-brand-secondary">
                Dane osoby towarzyszącej
              </h4>
            </div>
            <p className="text-[12px] font-medium text-brand-secondary/60 mb-5 relative z-10 leading-relaxed">
              Prześlemy jej dedykowany link do opłacenia swojego zadatku. Ma na
              to równe 24 godziny.
            </p>
            <div className="flex flex-col gap-4 relative z-10">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field
                  label="Imię"
                  value={friend.firstName}
                  onChange={(v) => setFriend({ ...friend, firstName: v })}
                  error={errors.friendFirstName}
                />
                <Field
                  label="Nazwisko"
                  value={friend.lastName}
                  onChange={(v) => setFriend({ ...friend, lastName: v })}
                  error={errors.friendLastName}
                />
              </div>
              <Field
                label="Adres e-mail"
                type="email"
                value={friend.email}
                onChange={(v) => setFriend({ ...friend, email: v })}
                error={errors.friendEmail}
              />
            </div>
          </div>
        </Item>
      )}

      <Item>
        <div className="flex flex-col gap-3 mt-2">
          <Consent
            checked={rodo}
            onChange={setRodo}
            error={errors.rodo}
            label={
              <>
                Akceptuję{" "}
                <Link
                  target="_blank"
                  onClick={(e) => e.stopPropagation()}
                  className="font-bold hover:text-brand-primary transition"
                  href={"/polityka-prywatnosci"}
                >
                  Regulamin i RODO
                </Link>
                .
              </>
            }
          />
          <Consent
            checked={health}
            onChange={setHealth}
            error={errors.health}
            label={
              <>
                Oświadczam, że nie mam{" "}
                <strong>przeciwwskazań zdrowotnych</strong> do udziału.
              </>
            }
          />
        </div>
      </Item>
    </Stagger>
  );
}

/* ───────────────────────── Step 4: Summary ───────────────────────── */

function Step4Summary({
  tripTitle,
  isDuo,
  currentUser,
  customer,
  friend,
  pricing,
  submitError,
  submitting,
  checkingCode,
  codeStatus,
  onApplyCode,
}: any) {
  return (
    <Stagger>
      <Item>
        <h3 className="font-jakarta font-bold text-[20px] text-brand-secondary">
          Podsumowanie rezerwacji
        </h3>
        <p className="text-[13px] font-medium text-brand-secondary/60 mt-1 leading-relaxed">
          Upewnij się, że wszystkie dane się zgadzają przed przejściem do
          płatności.
        </p>
      </Item>

      <Item>
        <div className="rounded-[20px] bg-white border border-gray-100 shadow-sm p-5">
          <div className="flex items-center gap-2 mb-4 pb-4 border-b border-gray-100">
            <div className="w-8 h-8 rounded-lg bg-brand-primary/10 flex items-center justify-center">
              <Heart size={16} weight="fill" className="text-brand-primary" />
            </div>
            <h4 className="font-jakarta font-bold text-[15px] text-brand-secondary leading-tight">
              {tripTitle}
            </h4>
          </div>
          <dl className="flex flex-col gap-3">
            <SummaryRow label="Wybrany wariant">
              {isDuo ? "Wydarzenie we dwoje (Duo)" : "Wydarzenie Standardowe"}
            </SummaryRow>
            <SummaryRow label="Uczestnik">
              {customer.firstName} {customer.lastName}
            </SummaryRow>
            <SummaryRow label="Kontakt">{currentUser.email}</SummaryRow>
            {isDuo && (
              <SummaryRow label="Osoba towarzysząca">
                {friend.firstName} {friend.lastName}{" "}
                <span className="text-gray-400 font-normal">
                  ({friend.email})
                </span>
              </SummaryRow>
            )}
          </dl>
        </div>
      </Item>

      <Item>
        <DiscountCodeBox
          appliedCode={pricing.appliedCode}
          disabled={submitting}
          checking={checkingCode}
          statusMessage={codeStatus?.message ?? null}
          statusOk={codeStatus?.ok ?? false}
          onApply={(code) => onApplyCode(code)}
          onClear={() => onApplyCode(null)}
        />
      </Item>

      <Item>
        <div className="rounded-[20px] bg-brand-secondary/5 border border-brand-secondary/10 p-5">
          <PriceBreakdown pricing={pricing} />
          <p className="text-[11px] font-medium text-brand-secondary/50 mt-3 leading-relaxed">
            Pozostałą kwotę uregulujesz w wygodnym dla siebie momencie za pomocą
            swojego panelu uczestnika, najpóźniej przed wydarzeniem.
          </p>
        </div>
      </Item>

      {submitError && (
        <Item>
          <div className="flex items-start gap-2 text-[13px] font-semibold text-rose-600 bg-rose-50 border border-rose-100 rounded-[14px] px-4 py-3 shadow-sm">
            <WarningCircle
              size={18}
              weight="fill"
              className="shrink-0 mt-0.5"
            />
            <span>{submitError}</span>
          </div>
        </Item>
      )}
    </Stagger>
  );
}

/* ───────────────────────── Step 5: Payment ───────────────────────── */

function Step5Payment({ clientSecret, bookingId, pricing, onChangeCode }: any) {
  const returnUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/panel/wydarzenia/${bookingId}?status=processing`
      : "";
  const depositLabel = formatGroszeExact(pricing.depositGrosze);

  return (
    <Stagger>
      <Item>
        <h3 className="font-jakarta font-bold text-[20px] text-brand-secondary">
          Płatność bezpieczna
        </h3>
        <p className="text-[13px] font-medium text-brand-secondary/60 mt-1 leading-relaxed">
          Sfinalizuj płatność zadatku ({depositLabel}). Twoja rezerwacja
          zostanie natychmiast potwierdzona.
        </p>
      </Item>

      {pricing.totalDiscount > 0 && (
        <Item>
          <p className="text-[12px] font-semibold text-brand-primary">
            Rabat naliczony — oszczędzasz{" "}
            {formatGroszeExact(pricing.totalDiscount)}.
          </p>
        </Item>
      )}

      <Item>
        <div className="rounded-[24px] bg-white border border-gray-100 p-2 shadow-sm">
          <StripePaymentStep
            clientSecret={clientSecret}
            depositLabel={depositLabel}
            returnUrl={returnUrl}
          />
        </div>
      </Item>

      {/* Kwoty PaymentIntenta nie da się zmienić — powrót do podsumowania
          musi więc unieważnić koszyk i utworzyć go od nowa. */}
      <Item>
        <button
          type="button"
          onClick={onChangeCode}
          className="mx-auto block text-[12px] font-bold text-brand-secondary/50 transition-colors hover:text-brand-primary"
        >
          Zmień dane lub kod rabatowy
        </button>
      </Item>
    </Stagger>
  );
}

/* ───────────────────────── Shared primitives ───────────────────────── */

function Stagger({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      className="flex flex-col gap-6"
      initial="hidden"
      animate="visible"
      variants={{
        hidden: {},
        visible: { transition: { staggerChildren: 0.06, delayChildren: 0.05 } },
      }}
    >
      {children}
    </motion.div>
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
          transition: { duration: 0.4, ease: EASE },
        },
      }}
    >
      {children}
    </motion.div>
  );
}

function VariantCard({
  selected,
  onClick,
  icon,
  title,
  subtitle,
  /** Cena po rabacie, w GROSZACH. */
  pricePerPerson,
  /** Cena z cennika (grosze) — pokazywana przekreśleniem, gdy jest rabat. */
  basePricePerPerson,
  badge,
}: any) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.98 }}
      transition={SPRING}
      className={cn(
        "relative w-full text-left rounded-[20px] p-5 transition-all duration-300 flex flex-col gap-4 border-2",
        selected
          ? "bg-white/80 border-brand-primary shadow-[0_8px_20px_-8px_rgba(40,125,136,0.3)]"
          : "bg-white/40 border-white/60 hover:bg-white/70 hover:border-brand-primary/30",
      )}
    >
      <div className="flex items-start gap-4">
        <div className="relative shrink-0">
          <motion.span
            initial={false}
            animate={{
              background: selected
                ? "linear-gradient(135deg, #287D88, #3DB5C4)"
                : "#ffffff",
              color: selected ? "#fff" : "#287D88",
              scale: selected ? 1.05 : 1,
              boxShadow: selected
                ? "0 4px 12px rgba(40,125,136,0.3)"
                : "0 2px 8px rgba(0,0,0,0.05)",
            }}
            transition={SPRING}
            className="flex items-center justify-center w-12 h-12 rounded-[14px]"
          >
            {icon}
          </motion.span>
          {badge && (
            <span className="absolute -top-2 -right-2 text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-brand-yellow text-brand-secondary shadow-sm ring-2 ring-white">
              {badge}
            </span>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <span className="font-jakarta font-bold text-[15px] text-brand-secondary leading-tight">
            {title}
          </span>
          <p className="text-[12px] font-medium text-brand-secondary/50 mt-0.5 leading-relaxed">
            {subtitle}
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between border-t border-brand-secondary/10 pt-3">
        <span className="text-[11px] uppercase tracking-widest text-brand-secondary/40 font-bold">
          Cena / osoba
        </span>
        <span className="font-jakarta font-bold text-[18px] text-brand-secondary whitespace-nowrap">
          {basePricePerPerson != null &&
            basePricePerPerson > pricePerPerson && (
              <span className="mr-2 text-[13px] font-medium text-brand-secondary/40 line-through">
                {formatGroszeExact(basePricePerPerson)}
              </span>
            )}
          {formatGroszeExact(pricePerPerson)}
        </span>
      </div>
      <AnimatePresence>
        {selected && (
          <motion.span
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={SPRING}
            className="absolute -top-2.5 -right-2.5 w-6 h-6 rounded-full flex items-center justify-center text-white bg-brand-primary shadow-sm ring-4 ring-white"
          >
            <CheckCircle size={14} weight="fill" />
          </motion.span>
        )}
      </AnimatePresence>
    </motion.button>
  );
}

function Field({ label, value, onChange, type = "text", error }: any) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-[12px] font-bold text-brand-secondary/70 tracking-wide pl-1">
        {label}
      </span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={cn(
          "px-4 py-3.5 rounded-[14px] border bg-white/70 backdrop-blur-sm text-[13px] font-semibold text-brand-secondary outline-none transition-all shadow-sm",
          error
            ? "border-rose-300 focus:ring-4 focus:ring-rose-100 bg-rose-50/50"
            : "border-white focus:border-brand-primary/50 focus:ring-4 focus:ring-brand-primary/10 hover:border-gray-200",
        )}
      />
      <AnimatePresence>
        {error && (
          <motion.span
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            className="text-[11px] font-semibold text-rose-500 pl-1 mt-0.5"
          >
            {error}
          </motion.span>
        )}
      </AnimatePresence>
    </label>
  );
}

function Consent({ checked, onChange, label, error }: any) {
  return (
    <div
      role="checkbox"
      aria-checked={checked}
      tabIndex={0}
      onClick={() => onChange(!checked)}
      onKeyDown={(e) => {
        if (e.key === " " || e.key === "Enter") {
          e.preventDefault();
          onChange(!checked);
        }
      }}
      className="flex items-start gap-3.5 cursor-pointer group p-3 rounded-[14px] hover:bg-white/40 transition-colors border border-transparent hover:border-white/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/40"
    >
      <motion.span
        animate={{
          background: checked ? "#287D88" : "#ffffff",
          borderColor: checked ? "#287D88" : "#e5e7eb",
          scale: checked ? 1.05 : 1,
        }}
        transition={SPRING}
        className="mt-0.5 flex items-center justify-center w-[22px] h-[22px] rounded-[6px] border-2 shrink-0 shadow-sm"
      >
        <AnimatePresence>
          {checked && (
            <motion.span
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
            >
              <CheckCircle size={14} weight="bold" className="text-white" />
            </motion.span>
          )}
        </AnimatePresence>
      </motion.span>
      <div className="flex flex-col gap-1">
        <span className="text-[13px] font-medium leading-relaxed text-brand-secondary/70">
          {label}
        </span>
        {error && (
          <span className="text-[11px] font-bold text-rose-500">{error}</span>
        )}
      </div>
    </div>
  );
}

function SummaryRow({ label, children }: any) {
  return (
    <div className="flex flex-col gap-0.5 sm:flex-row sm:items-baseline sm:justify-between sm:gap-3 text-[13px]">
      <dt className="text-brand-secondary/50 font-medium shrink-0">{label}</dt>
      <dd className="font-bold text-brand-secondary text-left sm:text-right break-words min-w-0">
        {children}
      </dd>
    </div>
  );
}

function PrimaryButton({
  children,
  onClick,
  disabled,
  loading,
  loadingLabel,
}: any) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      disabled={disabled}
      whileHover={disabled ? undefined : { y: -1 }}
      whileTap={disabled ? undefined : { scale: 0.98 }}
      transition={SPRING}
      style={{ backgroundSize: "200% auto" }}
      className={cn(
        "inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-[16px] text-white text-[14px] font-bold transition-all duration-500",
        "bg-gradient-to-r from-brand-primary from-0% via-brand-primary via-85% to-brand-yellow to-100% hover:bg-right shadow-[0_8px_20px_-6px_rgba(40,125,136,0.5)] hover:shadow-[0_12px_25px_-6px_rgba(40,125,136,0.6)]",
        "disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:bg-left disabled:hover:shadow-none",
      )}
    >
      {loading ? (
        <>
          <CircleNotch
            size={18}
            weight="bold"
            className="animate-spin text-brand-yellow"
          />
          {loadingLabel ?? "Przetwarzanie…"}
        </>
      ) : (
        children
      )}
    </motion.button>
  );
}
