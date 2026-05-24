"use client";

import React, { useMemo, useState } from "react";
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

const COLORS = {
  text: "#0B3B4C",
  accent: "#287D88",
} as const;

const EASE = [0.22, 1, 0.36, 1] as const;
const SPRING = { type: "spring", stiffness: 320, damping: 32 } as const;

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

interface CampBookingFormProps {
  campId: string;
  campTitle: string;
  price: number;
  deposit: number;
  allowBringFriend: boolean;
  currentUser: CurrentUser | null;
  initialVariant?: Variant;
  initialStep?: number;
}

function formatPLN(value: number) {
  return value.toLocaleString("pl-PL", {
    style: "currency",
    currency: "PLN",
    maximumFractionDigits: 0,
  });
}

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

function splitName(full: string | null): { firstName: string; lastName: string } {
  if (!full) return { firstName: "", lastName: "" };
  const parts = full.trim().split(/\s+/);
  if (parts.length === 1) return { firstName: parts[0], lastName: "" };
  return { firstName: parts[0], lastName: parts.slice(1).join(" ") };
}

function clampStep(n: number | undefined, isLogged: boolean): Step {
  if (!n) return 1;
  // Niezalogowany nie może być dalej niż na kroku 2.
  const max: Step = isLogged ? 5 : 2;
  const clamped = Math.min(Math.max(1, Math.floor(n)), max);
  return clamped as Step;
}

export default function CampBookingForm({
  campId,
  campTitle,
  price,
  deposit,
  allowBringFriend,
  currentUser,
  initialVariant,
  initialStep,
}: CampBookingFormProps) {
  const isLogged = !!currentUser;
  const initialNameParts = splitName(currentUser?.name ?? null);

  const [step, setStep] = useState<Step>(
    clampStep(initialStep, isLogged),
  );
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

  const isDuo = variant === "duo";

  const step3Errors = useMemo(() => {
    const e: Partial<Record<string, string>> = {};
    if (!customer.firstName.trim()) e.firstName = "Podaj imię.";
    if (!customer.lastName.trim()) e.lastName = "Podaj nazwisko.";
    if (customer.phone.trim().length < 6) e.phone = "Podaj numer telefonu.";
    if (!rodo) e.rodo = "Wymagana zgoda RODO.";
    if (!health) e.health = "Wymagane oświadczenie zdrowotne.";
    if (isDuo) {
      if (!friend.firstName.trim()) e.friendFirstName = "Podaj imię przyjaciółki.";
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

  function handleGoogleLogin() {
    const callbackUrl = `/campy/${campId}?variant=${variant}&step=3#formularz-rezerwacji`;
    signIn("google", { callbackUrl });
  }

  function handleNext() {
    if (step === 1) {
      // Po wariancie zawsze logowanie. Jeśli zalogowany — można od razu przeskoczyć do danych.
      goTo(isLogged ? 3 : 2);
      return;
    }
    if (step === 2) {
      if (!isLogged) return;
      goTo(3);
      return;
    }
    if (step === 3) {
      if (!step3Valid) return;
      goTo(4);
      return;
    }
  }

  function handleBack() {
    if (step === 3 && isLogged) {
      // Zalogowany pominął krok logowania — wracamy do wariantu.
      goTo(1);
      return;
    }
    goTo(Math.max(1, step - 1) as Step);
  }

  async function handleCreatePayment() {
    if (!currentUser) {
      goTo(2);
      return;
    }
    setSubmitting(true);
    setSubmitError(null);
    try {
      const res = await fetch("/api/bookings/create-payment-intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          campId,
          variant,
          customer: {
            firstName: customer.firstName,
            lastName: customer.lastName,
            phone: customer.phone,
          },
          consents: { rodo: true, health: true },
          friend: isDuo ? friend : undefined,
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
      const { clientSecret: secret } = (await res.json()) as {
        clientSecret: string;
      };
      setClientSecret(secret);
      setSubmitting(false);
      goTo(5);
    } catch (err) {
      console.error(err);
      setSubmitError("Brak połączenia z serwerem. Sprawdź internet i spróbuj ponownie.");
      setSubmitting(false);
    }
  }

  const slideVariants = {
    enter: (dir: 1 | -1) => ({
      opacity: 0,
      x: dir * 40,
      filter: "blur(6px)",
    }),
    center: {
      opacity: 1,
      x: 0,
      filter: "blur(0px)",
    },
    exit: (dir: 1 | -1) => ({
      opacity: 0,
      x: dir * -40,
      filter: "blur(6px)",
    }),
  };

  return (
    <section
      id="formularz-rezerwacji"
      className="scroll-mt-24"
      style={{ color: COLORS.text }}
    >
      <motion.div
        layout
        transition={SPRING}
        className="rounded-3xl bg-white border border-gray-100 shadow-[0_30px_80px_-40px_rgba(11,59,76,0.25)] overflow-hidden"
      >
        <header className="px-6 sm:px-10 pt-8 pb-6 border-b border-gray-100">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-gray-400 font-montserrat">
            <span
              className="inline-block w-6 h-[2px]"
              style={{ background: COLORS.accent }}
            />
            Zarezerwuj miejsce
          </div>
          <h2
            className="mt-3 text-2xl sm:text-3xl font-jakarta font-bold"
            style={{ color: COLORS.text }}
          >
            Twój wyjazd, krok po kroku
          </h2>
          <Stepper step={step} />
        </header>

        <motion.div layout transition={SPRING} className="px-6 sm:px-10 py-8 min-h-[420px]">
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
                  price={price}
                  allowBringFriend={allowBringFriend}
                />
              )}

              {step === 2 && (
                <Step2Login
                  currentUser={currentUser}
                  onLogin={handleGoogleLogin}
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
                  campTitle={campTitle}
                  isDuo={isDuo}
                  currentUser={currentUser!}
                  customer={customer}
                  friend={friend}
                  price={price}
                  deposit={deposit}
                  submitError={submitError}
                />
              )}

              {step === 5 && clientSecret && (
                <Step5Payment
                  clientSecret={clientSecret}
                  deposit={deposit}
                  price={price}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </motion.div>

        {step !== 5 && (
          <motion.footer
            layout
            transition={SPRING}
            className="px-6 sm:px-10 py-5 bg-gray-50/60 border-t border-gray-100 flex flex-col-reverse sm:flex-row gap-3 sm:items-center sm:justify-between"
          >
            {step > 1 ? (
              <button
                type="button"
                onClick={handleBack}
                disabled={submitting}
                className="inline-flex items-center justify-center gap-2 text-sm font-semibold text-gray-500 hover:text-gray-800 transition px-4 py-2 disabled:opacity-50"
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
                  (step === 2 && !isLogged) ||
                  (step === 3 && !step3Valid)
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
                loadingLabel="Przygotowujemy płatność…"
              >
                <CreditCard size={16} weight="bold" />
                Przejdź do płatności · {formatPLN(deposit)}
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
    { n: 4, label: "Podsumowanie" },
    { n: 5, label: "Płatność" },
  ];
  const progress = ((step - 1) / (items.length - 1)) * 100;

  return (
    <div className="mt-6">
      <div className="relative">
        <div className="h-[2px] w-full bg-gray-100 rounded-full" />
        <motion.div
          className="absolute top-0 left-0 h-[2px] rounded-full"
          style={{ background: COLORS.accent }}
          initial={false}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.5, ease: EASE }}
        />
      </div>
      <ol className="mt-3 flex items-center justify-between gap-1">
        {items.map((it) => {
          const active = it.n === step;
          const done = it.n < step;
          return (
            <li
              key={it.n}
              className="flex flex-col items-center gap-1 flex-1 min-w-0"
            >
              <motion.span
                initial={false}
                animate={{
                  scale: active ? 1.1 : 1,
                  background:
                    done || active ? COLORS.accent : "#f3f4f6",
                  color: done || active ? "#ffffff" : "#9ca3af",
                }}
                transition={SPRING}
                className="flex items-center justify-center w-7 h-7 rounded-full text-[11px] font-bold shadow-sm"
              >
                {done ? <CheckCircle size={14} weight="fill" /> : it.n}
              </motion.span>
              <span
                className={cn(
                  "text-[10px] sm:text-xs font-semibold text-center truncate w-full",
                  active ? "" : "text-gray-400",
                )}
                style={active ? { color: COLORS.text } : undefined}
              >
                {it.label}
              </span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

/* ───────────────────────── Step 1: Variant ───────────────────────── */

function Step1Variant({
  variant,
  setVariant,
  price,
  allowBringFriend,
}: {
  variant: Variant;
  setVariant: (v: Variant) => void;
  price: number;
  allowBringFriend: boolean;
}) {
  return (
    <Stagger>
      <Item>
        <h3 className="font-jakarta font-bold text-lg">Wybierz wariant</h3>
        <p className="text-sm text-gray-500 mt-1">
          Możesz pojechać sama lub zabrać przyjaciółkę i dzielić pokój.
        </p>
      </Item>
      <Item>
        <VariantCard
          selected={variant === "standard"}
          onClick={() => setVariant("standard")}
          icon={<UserIcon size={22} weight="duotone" />}
          title="Standard"
          subtitle="Tylko ja"
          pricePerPerson={price}
        />
      </Item>
      {allowBringFriend && (
        <Item>
          <VariantCard
            selected={variant === "duo"}
            onClick={() => setVariant("duo")}
            icon={<UsersThree size={22} weight="duotone" />}
            title="Zabierz przyjaciółkę"
            subtitle="Wspólny pokój. Każda płaci za siebie."
            pricePerPerson={price}
            badge="Duo"
          />
        </Item>
      )}
    </Stagger>
  );
}

/* ───────────────────────── Step 2: Login ───────────────────────── */

function Step2Login({
  currentUser,
  onLogin,
  variant,
}: {
  currentUser: CurrentUser | null;
  onLogin: () => void;
  variant: Variant;
}) {
  if (currentUser) {
    return (
      <Stagger>
        <Item>
          <h3 className="font-jakarta font-bold text-lg">Konto</h3>
          <p className="text-sm text-gray-500 mt-1">
            Jesteś zalogowana — przejdź dalej, aby uzupełnić dane.
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
        <h3 className="font-jakarta font-bold text-lg">
          Zaloguj się, żeby kontynuować
        </h3>
        <p className="text-sm text-gray-500 mt-1 max-w-prose">
          Twoje konto powiążemy z rezerwacją — dzięki temu zobaczysz harmonogram,
          QR-bilet i opłacisz pozostałą część w panelu uczestniczki.
        </p>
      </Item>

      <Item>
        <button
          type="button"
          onClick={onLogin}
          className="group w-full rounded-2xl border-2 border-gray-200 hover:border-[#287D88] bg-white px-5 py-4 flex items-center justify-between gap-4 transition shadow-sm hover:shadow-md"
        >
          <div className="flex items-center gap-4">
            <span className="flex items-center justify-center w-12 h-12 rounded-xl bg-white border border-gray-100">
              <GoogleLogo size={22} weight="bold" />
            </span>
            <div className="text-left">
              <div className="font-jakarta font-bold text-base" style={{ color: COLORS.text }}>
                Kontynuuj z Google
              </div>
              <p className="text-xs text-gray-500 mt-0.5">
                Bezpieczne logowanie — bez haseł.
              </p>
            </div>
          </div>
          <ArrowRight
            size={20}
            weight="bold"
            className="text-gray-300 group-hover:text-[#287D88] transition"
          />
        </button>
      </Item>

      <Item>
        <div className="flex items-start gap-3 text-[12px] text-gray-500 rounded-xl bg-gray-50 px-4 py-3">
          <ShieldCheck size={16} weight="duotone" style={{ color: COLORS.accent }} className="shrink-0 mt-0.5" />
          <p>
            Po zalogowaniu wrócisz dokładnie tu, z wybranym wariantem (
            <strong>{variant === "duo" ? "Duo" : "Standard"}</strong>). Twoich
            danych nie używamy do reklam.
          </p>
        </div>
      </Item>
    </Stagger>
  );
}

function LoggedInCard({ user }: { user: CurrentUser }) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-gray-50/60 p-5 flex items-center justify-between gap-4">
      <div className="flex items-center gap-4 min-w-0">
        {user.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={user.image}
            alt=""
            className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-sm"
          />
        ) : (
          <span
            className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold"
            style={{ background: COLORS.accent }}
          >
            {(user.name ?? user.email).slice(0, 1).toUpperCase()}
          </span>
        )}
        <div className="min-w-0">
          <div
            className="font-jakarta font-bold text-base truncate"
            style={{ color: COLORS.text }}
          >
            {user.name ?? "Witaj!"}
          </div>
          <div className="text-sm text-gray-500 truncate">{user.email}</div>
        </div>
      </div>
      <button
        type="button"
        onClick={() => signOut({ callbackUrl: window.location.href })}
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-gray-800 px-3 py-2 rounded-lg hover:bg-white transition shrink-0"
      >
        <SignOut size={14} weight="bold" />
        Zmień konto
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
}: {
  currentUser: CurrentUser;
  customer: Customer;
  setCustomer: (c: Customer) => void;
  friend: Friend;
  setFriend: (f: Friend) => void;
  isDuo: boolean;
  rodo: boolean;
  setRodo: (v: boolean) => void;
  health: boolean;
  setHealth: (v: boolean) => void;
  errors: Partial<Record<string, string>>;
}) {
  return (
    <Stagger>
      <Item>
        <h3 className="font-jakarta font-bold text-lg">Twoje dane</h3>
        <p className="text-sm text-gray-500 mt-1">
          Email pobieramy z konta Google. Uzupełnij telefon i, jeśli trzeba,
          dane przyjaciółki.
        </p>
      </Item>

      <Item>
        <div className="flex items-center gap-3 rounded-xl bg-gray-50 border border-gray-100 px-4 py-3">
          <ShieldCheck size={16} weight="duotone" style={{ color: COLORS.accent }} />
          <span className="text-sm font-semibold truncate" style={{ color: COLORS.text }}>
            {currentUser.email}
          </span>
        </div>
      </Item>

      <Item>
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
          <div className="sm:col-span-2">
            <Field
              label="Telefon"
              type="tel"
              value={customer.phone}
              onChange={(v) => setCustomer({ ...customer, phone: v })}
              error={errors.phone}
            />
          </div>
        </div>
      </Item>

      {isDuo && (
        <Item>
          <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50/50 p-5">
            <div className="flex items-center gap-2 mb-3">
              <UsersThree size={18} weight="duotone" style={{ color: COLORS.accent }} />
              <h4 className="font-jakarta font-bold">Twoja przyjaciółka</h4>
            </div>
            <p className="text-xs text-gray-500 mb-4">
              Wyślemy jej zaproszenie do dołączenia. Ma 24h na opłacenie swojego
              zadatku.
            </p>
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
              <div className="sm:col-span-2">
                <Field
                  label="Email przyjaciółki"
                  type="email"
                  value={friend.email}
                  onChange={(v) => setFriend({ ...friend, email: v })}
                  error={errors.friendEmail}
                />
              </div>
            </div>
          </div>
        </Item>
      )}

      <Item>
        <div className="flex flex-col gap-3">
          <Consent
            checked={rodo}
            onChange={setRodo}
            error={errors.rodo}
            label={
              <>
                Zgadzam się na przetwarzanie moich danych osobowych zgodnie z{" "}
                <strong>polityką prywatności (RODO)</strong>.
              </>
            }
          />
          <Consent
            checked={health}
            onChange={setHealth}
            error={errors.health}
            label={
              <>
                Oświadczam, że nie mam <strong>przeciwwskazań zdrowotnych</strong>{" "}
                do udziału w wyjeździe.
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
  campTitle,
  isDuo,
  currentUser,
  customer,
  friend,
  price,
  deposit,
  submitError,
}: {
  campTitle: string;
  isDuo: boolean;
  currentUser: CurrentUser;
  customer: Customer;
  friend: Friend;
  price: number;
  deposit: number;
  submitError: string | null;
}) {
  return (
    <Stagger>
      <Item>
        <h3 className="font-jakarta font-bold text-lg">Podsumowanie</h3>
        <p className="text-sm text-gray-500 mt-1">Sprawdź dane przed płatnością.</p>
      </Item>

      <Item>
        <div className="rounded-2xl border border-gray-100 p-5">
          <div className="flex items-center gap-2 mb-3">
            <Heart size={16} weight="duotone" style={{ color: COLORS.accent }} />
            <h4 className="font-jakarta font-bold text-base" style={{ color: COLORS.text }}>
              {campTitle}
            </h4>
          </div>
          <dl className="flex flex-col gap-1.5">
            <SummaryRow label="Wariant">
              {isDuo ? "Zabierz przyjaciółkę (Duo)" : "Standard"}
            </SummaryRow>
            <SummaryRow label="Uczestniczka">
              {customer.firstName} {customer.lastName}
            </SummaryRow>
            <SummaryRow label="Kontakt">
              {currentUser.email} · {customer.phone}
            </SummaryRow>
            {isDuo && (
              <SummaryRow label="Przyjaciółka">
                {friend.firstName} {friend.lastName} ({friend.email})
              </SummaryRow>
            )}
          </dl>
        </div>
      </Item>

      <Item>
        <div
          className="rounded-2xl p-5"
          style={{ background: `${COLORS.accent}10` }}
        >
          <div className="flex items-baseline justify-between">
            <span className="text-sm text-gray-600">Cena za osobę</span>
            <span className="font-jakarta font-bold" style={{ color: COLORS.text }}>
              {formatPLN(price)}
            </span>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-sm text-gray-600">Zadatek (do zapłaty teraz)</span>
            <span
              className="text-2xl font-jakarta font-bold"
              style={{ color: COLORS.accent }}
            >
              {formatPLN(deposit)}
            </span>
          </div>
          <p className="text-[12px] text-gray-500 mt-2">
            Pozostałą część opłacisz później w swoim panelu — najpóźniej przed
            wyjazdem.
          </p>
        </div>
      </Item>

      {isDuo && (
        <Item>
          <div className="text-[13px] text-gray-500 leading-relaxed bg-amber-50/60 border border-amber-100 rounded-xl px-4 py-3">
            Twoja przyjaciółka otrzyma osobny link do opłacenia swojego zadatku.
            Jeśli nie zapłaci w ciągu 24 godzin, jej miejsce zostanie zwolnione.
          </div>
        </Item>
      )}

      {submitError && (
        <Item>
          <div className="flex items-start gap-2 text-sm text-rose-600 bg-rose-50 border border-rose-100 rounded-xl px-4 py-3">
            <WarningCircle size={18} weight="fill" className="shrink-0 mt-0.5" />
            <span>{submitError}</span>
          </div>
        </Item>
      )}
    </Stagger>
  );
}

/* ───────────────────────── Step 5: Payment ───────────────────────── */

function Step5Payment({
  clientSecret,
  deposit,
  price,
}: {
  clientSecret: string;
  deposit: number;
  price: number;
}) {
  return (
    <Stagger>
      <Item>
        <h3 className="font-jakarta font-bold text-lg">Płatność</h3>
        <p className="text-sm text-gray-500 mt-1">
          Zadatek: <strong>{formatPLN(deposit)}</strong> · pozostałe{" "}
          {formatPLN(price - deposit)} opłacisz później w panelu.
        </p>
      </Item>
      <Item>
        <StripePaymentStep
          clientSecret={clientSecret}
          depositLabel={formatPLN(deposit)}
          returnUrl={
            typeof window !== "undefined"
              ? `${window.location.origin}/campy/sukces`
              : "/campy/sukces"
          }
        />
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
  pricePerPerson,
  badge,
}: {
  selected: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  pricePerPerson: number;
  badge?: string;
}) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.98 }}
      transition={SPRING}
      className={cn(
        "relative w-full text-left rounded-2xl border-2 p-5 transition-colors",
        "flex items-center justify-between gap-4",
        selected ? "shadow-md" : "border-gray-200 hover:border-gray-300",
      )}
      style={
        selected
          ? { borderColor: COLORS.accent, background: `${COLORS.accent}08` }
          : undefined
      }
    >
      <div className="flex items-center gap-4">
        <motion.span
          initial={false}
          animate={{
            background: selected ? COLORS.accent : "#f3f4f6",
            color: selected ? "#fff" : COLORS.text,
            scale: selected ? 1.05 : 1,
          }}
          transition={SPRING}
          className="flex items-center justify-center w-12 h-12 rounded-xl"
        >
          {icon}
        </motion.span>
        <div>
          <div className="flex items-center gap-2">
            <span
              className="font-jakarta font-bold text-base"
              style={{ color: COLORS.text }}
            >
              {title}
            </span>
            {badge && (
              <span
                className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full text-white"
                style={{ background: COLORS.accent }}
              >
                {badge}
              </span>
            )}
          </div>
          <p className="text-sm text-gray-500 mt-0.5">{subtitle}</p>
        </div>
      </div>
      <div className="text-right">
        <div className="text-[11px] uppercase tracking-wider text-gray-400 font-semibold">
          /os.
        </div>
        <div className="font-jakarta font-bold text-lg" style={{ color: COLORS.text }}>
          {formatPLN(pricePerPerson)}
        </div>
      </div>
      <AnimatePresence>
        {selected && (
          <motion.span
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={SPRING}
            className="absolute -top-2 -right-2 w-6 h-6 rounded-full flex items-center justify-center text-white shadow-md"
            style={{ background: COLORS.accent }}
          >
            <CheckCircle size={14} weight="fill" />
          </motion.span>
        )}
      </AnimatePresence>
    </motion.button>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  error,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: "text" | "email" | "tel";
  error?: string;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-[12px] font-semibold text-gray-500 font-montserrat">
        {label}
      </span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={cn(
          "px-4 py-3 rounded-xl border bg-white text-sm font-medium outline-none transition",
          "focus:ring-2",
          error
            ? "border-rose-300 focus:ring-rose-100"
            : "border-gray-200 focus:ring-[#287D88]/20 focus:border-[#287D88]",
        )}
        style={{ color: COLORS.text }}
      />
      <AnimatePresence>
        {error && (
          <motion.span
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.2 }}
            className="text-[11px] text-rose-500 font-montserrat"
          >
            {error}
          </motion.span>
        )}
      </AnimatePresence>
    </label>
  );
}

function Consent({
  checked,
  onChange,
  label,
  error,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: React.ReactNode;
  error?: string;
}) {
  return (
    <label className="flex items-start gap-3 cursor-pointer group">
      <motion.span
        animate={{
          background: checked ? COLORS.accent : "#ffffff",
          borderColor: checked ? COLORS.accent : "#d1d5db",
          scale: checked ? 1.05 : 1,
        }}
        transition={SPRING}
        className="mt-0.5 flex items-center justify-center w-5 h-5 rounded-md border-2 shrink-0"
      >
        <AnimatePresence>
          {checked && (
            <motion.span
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              <CheckCircle size={14} weight="fill" className="text-white" />
            </motion.span>
          )}
        </AnimatePresence>
      </motion.span>
      <span className="text-[13px] leading-relaxed text-gray-600 font-montserrat">
        {label}
        {error && (
          <span className="block text-[11px] text-rose-500 mt-1">{error}</span>
        )}
      </span>
      <input
        type="checkbox"
        className="sr-only"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />
    </label>
  );
}

function SummaryRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between text-sm">
      <dt className="text-gray-500">{label}</dt>
      <dd className="font-semibold" style={{ color: COLORS.text }}>
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
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  loading?: boolean;
  loadingLabel?: string;
}) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      disabled={disabled}
      whileHover={disabled ? undefined : { y: -1 }}
      whileTap={disabled ? undefined : { scale: 0.97 }}
      transition={SPRING}
      className={cn(
        "inline-flex items-center justify-center gap-2 px-6 py-3 rounded-2xl text-white text-sm font-semibold transition",
        "disabled:opacity-50 disabled:cursor-not-allowed",
      )}
      style={{ background: COLORS.accent }}
    >
      {loading ? (
        <>
          <CircleNotch size={16} weight="bold" className="animate-spin" />
          {loadingLabel ?? "Ładowanie…"}
        </>
      ) : (
        children
      )}
    </motion.button>
  );
}
