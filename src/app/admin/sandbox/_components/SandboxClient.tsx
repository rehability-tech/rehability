"use client";

import React, { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import {
  Flask,
  Eye,
  EyeSlash,
  UserPlus,
  Trash,
  ArrowSquareOut,
  RocketLaunch,
  GraduationCap,
  Suitcase,
  CircleNotch,
  Users,
  Info,
  ShieldCheck,
} from "@phosphor-icons/react/dist/ssr";
import { cn } from "@/lib/utils";
import { SANDBOX_PREVIEW_EVENT } from "@/lib/sandbox/constants";

// Wspólny styl „kropli" zgodny z systemem designu paneli admina.
const CARD =
  "rounded-[24px] rounded-tr-none bg-white/70 backdrop-blur-xl border border-white/60 shadow-[0_20px_55px_-36px_rgba(3,63,99,0.3)]";

export type SandboxTrip = {
  id: string;
  title: string;
  status: string;
  location: string | null;
  startDate: string;
  endDate: string;
  updatedAt: string;
  bookings: number;
};

export type SandboxCourse = {
  id: string;
  slug: string;
  title: string;
  status: string;
  category: string;
  price: number;
  updatedAt: string;
  students: number;
};

export type SandboxTester = {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
  grantedAt: string | null;
};

type Props = {
  previewEnabled: boolean;
  trips: SandboxTrip[];
  courses: SandboxCourse[];
  testers: SandboxTester[];
};

const shortDate = (iso: string | null) => {
  if (!iso) return "—";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("pl-PL", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

function StatusPill({ status }: { status: string }) {
  const tone =
    status === "PUBLISHED"
      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
      : status === "DRAFT"
        ? "bg-amber-50 text-amber-700 border-amber-200"
        : "bg-slate-100 text-slate-600 border-slate-200";
  const label =
    status === "PUBLISHED"
      ? "Opublikowane"
      : status === "DRAFT"
        ? "Szkic"
        : "Archiwum";
  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-1 rounded-full border text-[10.5px] font-bold uppercase tracking-wide",
        tone,
      )}
    >
      {label}
    </span>
  );
}

export default function SandboxClient({
  previewEnabled,
  trips,
  courses,
  testers,
}: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [preview, setPreview] = useState(previewEnabled);
  const [togglingPreview, setTogglingPreview] = useState(false);

  const [email, setEmail] = useState("");
  const [addingTester, setAddingTester] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  const totalItems = trips.length + courses.length;
  const hasContent = totalItems > 0;

  const summary = useMemo(
    () => [
      {
        label: "Treści w piaskownicy",
        value: totalItems,
        icon: Flask,
      },
      { label: "Wydarzenia", value: trips.length, icon: Suitcase },
      { label: "Kursy", value: courses.length, icon: GraduationCap },
      { label: "Testerzy", value: testers.length, icon: Users },
    ],
    [totalItems, trips.length, courses.length, testers.length],
  );

  // --- Podgląd piaskownicy (ciasteczko po stronie serwera) -------------------
  async function togglePreview(next: boolean) {
    setTogglingPreview(true);
    try {
      const res = await fetch("/api/sandbox/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled: next }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Nie udało się przełączyć podglądu.");
      }
      setPreview(next);
      // Pasek ostrzegawczy w głównym layoucie nasłuchuje tego zdarzenia.
      window.dispatchEvent(new Event(SANDBOX_PREVIEW_EVENT));
      toast.success(
        next
          ? "Podgląd piaskownicy włączony — widzisz treści testowe."
          : "Podgląd wyłączony — widzisz stronę tak jak klient.",
      );
      // Serwerowe komponenty czytają ciasteczko, więc trzeba odświeżyć drzewo.
      startTransition(() => router.refresh());
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Nie udało się przełączyć podglądu.",
      );
    } finally {
      setTogglingPreview(false);
    }
  }

  // --- Testerzy -------------------------------------------------------------
  async function addTester(e: React.FormEvent) {
    e.preventDefault();
    const value = email.trim().toLowerCase();
    if (!value) return;

    setAddingTester(true);
    try {
      const res = await fetch("/api/admin/sandbox/testerzy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: value }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Nie udało się nadać dostępu.");

      setEmail("");
      toast.success(`Dostęp nadany: ${value}`);
      startTransition(() => router.refresh());
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Nie udało się nadać dostępu.",
      );
    } finally {
      setAddingTester(false);
    }
  }

  async function revokeTester(tester: SandboxTester) {
    setBusyId(tester.id);
    try {
      const res = await fetch(`/api/admin/sandbox/testerzy/${tester.id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Nie udało się odebrać dostępu.");
      }
      toast.success(
        `Dostęp odebrany: ${tester.email ?? tester.name ?? "konto"}`,
      );
      startTransition(() => router.refresh());
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Nie udało się odebrać dostępu.",
      );
    } finally {
      setBusyId(null);
    }
  }

  // --- Wypuszczenie treści na produkcję -------------------------------------
  async function release(entity: "trip" | "course", id: string, title: string) {
    setBusyId(id);
    try {
      const res = await fetch("/api/admin/sandbox/tresci", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ entity, id, sandbox: false }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Nie udało się wypuścić treści.");
      }
      toast.success(`„${title}" jest już poza piaskownicą.`);
      startTransition(() => router.refresh());
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Nie udało się wypuścić treści.",
      );
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 flex flex-col gap-8">
      {/* ============ HERO ============ */}
      <motion.header
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="relative overflow-hidden rounded-[28px] rounded-tr-none p-6 sm:p-8 lg:p-10 shadow-[0_18px_50px_-20px_rgba(3,63,99,0.45)] border border-white/20"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-brand-primary via-brand-secondary to-brand-secondary" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(242,217,103,0.20),transparent_55%)]" />
        <div className="absolute -top-12 -right-10 w-64 h-64 bg-brand-yellow/30 rounded-full blur-[90px] pointer-events-none" />
        <div className="absolute -bottom-24 left-1/4 w-72 h-72 bg-white/10 rounded-full blur-[110px] pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-end justify-between gap-6">
          <div className="max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md border border-white/10 shadow-sm mb-4">
              <Flask size={14} weight="fill" className="text-brand-yellow" />
              <span className="text-[10px] uppercase tracking-widest text-white font-bold">
                Środowisko testowe
              </span>
            </div>
            <h1 className="font-jakarta text-3xl md:text-[40px] font-bold text-white leading-tight drop-shadow-sm">
              Sandbox
            </h1>
            <p className="font-montserrat text-white/70 font-medium text-[14px] mt-3 leading-relaxed">
              Twórz wydarzenia i kursy widoczne wyłącznie dla Ciebie i wskazanych
              osób. Przetestuj całą ścieżkę — od strony sprzedażowej po płatność —
              zanim treść zobaczą klienci.
            </p>
          </div>

          {/* Przełącznik podglądu */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full lg:w-auto shrink-0">
            <button
              type="button"
              onClick={() => togglePreview(!preview)}
              disabled={togglingPreview}
              className={cn(
                "group relative inline-flex w-full sm:w-auto items-center justify-center gap-2 px-6 h-12 rounded-[16px] font-bold text-[13.5px] transition-all duration-300 overflow-hidden shrink-0 border disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer",
                preview
                  ? "bg-white text-brand-secondary border-white/40 shadow-[0_12px_30px_-10px_rgba(0,0,0,0.45)] hover:-translate-y-0.5"
                  : "bg-white/15 backdrop-blur-md text-white border-white/25 hover:bg-white/25",
              )}
            >
              {preview && (
                <div className="absolute -bottom-4 -right-3 w-14 h-14 bg-brand-yellow/40 rounded-full blur-lg pointer-events-none" />
              )}
              <span className="relative z-10 flex items-center gap-2">
                {togglingPreview ? (
                  <CircleNotch size={18} weight="bold" className="animate-spin" />
                ) : preview ? (
                  <Eye size={18} weight="bold" className="text-brand-primary" />
                ) : (
                  <EyeSlash size={18} weight="bold" />
                )}
                {preview ? "Podgląd włączony" : "Włącz podgląd"}
              </span>
            </button>
          </div>
        </div>

        {/* Statystyki */}
        <div className="relative z-10 grid grid-cols-2 lg:grid-cols-4 gap-3 mt-8">
          {summary.map((s) => (
            <div
              key={s.label}
              className="rounded-[18px] rounded-tr-none bg-white/10 backdrop-blur-md border border-white/15 px-4 py-3"
            >
              <div className="flex items-center gap-2 text-white/60">
                <s.icon size={14} weight="fill" />
                <span className="font-montserrat text-[11px] font-semibold tracking-wide">
                  {s.label}
                </span>
              </div>
              <p className="font-jakarta text-white text-2xl font-bold mt-1">
                {s.value}
              </p>
            </div>
          ))}
        </div>
      </motion.header>

      {/* ============ JAK TO DZIAŁA ============ */}
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.05, ease: "easeOut" }}
        className={cn(CARD, "p-5 sm:p-6")}
      >
        <div className="flex items-start gap-3">
          <div className="shrink-0 size-10 rounded-[14px] rounded-tr-none bg-brand-primary/10 flex items-center justify-center">
            <Info size={18} weight="duotone" className="text-brand-primary" />
          </div>
          <div className="min-w-0">
            <h2 className="font-jakarta font-bold text-brand-secondary text-[16px]">
              Jak działa piaskownica
            </h2>
            <ul className="mt-2 flex flex-col gap-1.5 font-montserrat text-[13px] text-brand-secondary/70 leading-relaxed">
              <li>
                <strong className="text-brand-secondary">Tworzenie:</strong> w
                kreatorze wydarzenia lub kursu zaznacz „Tryb sandbox". Treść
                zapisze się normalnie, ale nie zobaczą jej klienci.
              </li>
              <li>
                <strong className="text-brand-secondary">Podgląd:</strong>{" "}
                przełącznik powyżej dokleja treści testowe do katalogów na
                stronie publicznej i w panelu. Wyłączony = widzisz dokładnie to,
                co klient.
              </li>
              <li>
                <strong className="text-brand-secondary">Testerzy:</strong> osoby
                z listy niżej też włączają sobie podgląd i mogą przejść pełną
                ścieżkę zakupu.
              </li>
              <li>
                <strong className="text-brand-secondary">Publikacja:</strong>{" "}
                „Wypuść na produkcję" zdejmuje flagę sandbox. Status treści się
                nie zmienia — opublikowana treść staje się po prostu widoczna.
              </li>
            </ul>
            <p className="mt-3 inline-flex items-center gap-1.5 font-montserrat text-[12px] text-brand-secondary/50">
              <ShieldCheck size={14} weight="fill" className="text-brand-primary" />
              Treści sandbox nie trafiają do sitemapy, nie wysyłają powiadomień
              push i nie liczą się do statystyk wyświetleń.
            </p>
          </div>
        </div>
      </motion.section>

      {/* ============ TREŚCI W PIASKOWNICY ============ */}
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1, ease: "easeOut" }}
        className={cn(CARD, "p-5 sm:p-6")}
      >
        <div className="flex items-center justify-between gap-4 mb-5">
          <h2 className="font-jakarta font-bold text-brand-secondary text-[17px]">
            Treści w piaskownicy
          </h2>
          {isPending && (
            <CircleNotch
              size={16}
              weight="bold"
              className="animate-spin text-brand-primary/50"
            />
          )}
        </div>

        {!hasContent && (
          <div className="rounded-[18px] rounded-tr-none border border-dashed border-brand-primary/20 bg-white/40 px-5 py-8 text-center">
            <Flask
              size={28}
              weight="duotone"
              className="text-brand-primary/40 mx-auto"
            />
            <p className="font-jakarta font-bold text-brand-secondary text-[14px] mt-3">
              Piaskownica jest pusta
            </p>
            <p className="font-montserrat text-[13px] text-brand-secondary/60 mt-1 max-w-md mx-auto leading-relaxed">
              Zaznacz „Tryb sandbox" przy tworzeniu wydarzenia lub kursu, a
              pojawi się tutaj.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-2 mt-4">
              <Link
                href="/admin/wydarzenia/dodaj/dane-podstawowe"
                className="inline-flex items-center gap-2 px-4 h-10 rounded-[14px] bg-white/70 border border-white/60 font-montserrat text-[13px] font-semibold text-brand-secondary hover:bg-white transition-colors"
              >
                <Suitcase size={15} weight="bold" />
                Nowe wydarzenie
              </Link>
              <Link
                href="/admin/kursy/dodaj"
                className="inline-flex items-center gap-2 px-4 h-10 rounded-[14px] bg-white/70 border border-white/60 font-montserrat text-[13px] font-semibold text-brand-secondary hover:bg-white transition-colors"
              >
                <GraduationCap size={15} weight="bold" />
                Nowy kurs
              </Link>
            </div>
          </div>
        )}

        {hasContent && (
          <div className="flex flex-col gap-3">
            <AnimatePresence initial={false}>
              {trips.map((t) => (
                <motion.div
                  key={t.id}
                  layout
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                  transition={{ duration: 0.25, ease: "easeOut" }}
                  className="flex flex-col sm:flex-row sm:items-center gap-3 rounded-[18px] rounded-tr-none bg-white/60 border border-white/70 px-4 py-3"
                >
                  <div className="shrink-0 size-10 rounded-[14px] rounded-tr-none bg-brand-primary/10 flex items-center justify-center">
                    <Suitcase
                      size={18}
                      weight="duotone"
                      className="text-brand-primary"
                    />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-jakarta font-bold text-brand-secondary text-[14px] truncate">
                        {t.title}
                      </p>
                      <StatusPill status={t.status} />
                    </div>
                    <p className="font-montserrat text-[12px] text-brand-secondary/55 mt-0.5">
                      Wydarzenie · {shortDate(t.startDate)}
                      {t.location ? ` · ${t.location}` : ""} · {t.bookings}{" "}
                      rezerwacji testowych
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <Link
                      href={`/wydarzenia/${t.id}`}
                      target="_blank"
                      className="inline-flex items-center gap-1.5 px-3 h-9 rounded-[12px] bg-white/70 border border-white/70 font-montserrat text-[12.5px] font-semibold text-brand-secondary/70 hover:text-brand-primary transition-colors"
                    >
                      <ArrowSquareOut size={14} weight="bold" />
                      Podejrzyj
                    </Link>
                    <button
                      type="button"
                      onClick={() => release("trip", t.id, t.title)}
                      disabled={busyId === t.id}
                      className="inline-flex items-center gap-1.5 px-3 h-9 rounded-[12px] bg-brand-primary text-white font-montserrat text-[12.5px] font-bold shadow-[0_4px_15px_0px_rgba(242,217,103,0.35)] border border-brand-yellow/30 hover:brightness-110 transition-all disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
                    >
                      {busyId === t.id ? (
                        <CircleNotch
                          size={14}
                          weight="bold"
                          className="animate-spin"
                        />
                      ) : (
                        <RocketLaunch size={14} weight="bold" />
                      )}
                      Wypuść
                    </button>
                  </div>
                </motion.div>
              ))}

              {courses.map((c) => (
                <motion.div
                  key={c.id}
                  layout
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                  transition={{ duration: 0.25, ease: "easeOut" }}
                  className="flex flex-col sm:flex-row sm:items-center gap-3 rounded-[18px] rounded-tr-none bg-white/60 border border-white/70 px-4 py-3"
                >
                  <div className="shrink-0 size-10 rounded-[14px] rounded-tr-none bg-brand-primary/10 flex items-center justify-center">
                    <GraduationCap
                      size={18}
                      weight="duotone"
                      className="text-brand-primary"
                    />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-jakarta font-bold text-brand-secondary text-[14px] truncate">
                        {c.title}
                      </p>
                      <StatusPill status={c.status} />
                    </div>
                    <p className="font-montserrat text-[12px] text-brand-secondary/55 mt-0.5">
                      Kurs · {c.category} · {c.price} zł · {c.students} testowych
                      zapisów
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <Link
                      href={`/kursy/${c.slug}`}
                      target="_blank"
                      className="inline-flex items-center gap-1.5 px-3 h-9 rounded-[12px] bg-white/70 border border-white/70 font-montserrat text-[12.5px] font-semibold text-brand-secondary/70 hover:text-brand-primary transition-colors"
                    >
                      <ArrowSquareOut size={14} weight="bold" />
                      Podejrzyj
                    </Link>
                    <button
                      type="button"
                      onClick={() => release("course", c.id, c.title)}
                      disabled={busyId === c.id}
                      className="inline-flex items-center gap-1.5 px-3 h-9 rounded-[12px] bg-brand-primary text-white font-montserrat text-[12.5px] font-bold shadow-[0_4px_15px_0px_rgba(242,217,103,0.35)] border border-brand-yellow/30 hover:brightness-110 transition-all disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
                    >
                      {busyId === c.id ? (
                        <CircleNotch
                          size={14}
                          weight="bold"
                          className="animate-spin"
                        />
                      ) : (
                        <RocketLaunch size={14} weight="bold" />
                      )}
                      Wypuść
                    </button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </motion.section>

      {/* ============ TESTERZY ============ */}
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.15, ease: "easeOut" }}
        className={cn(CARD, "p-5 sm:p-6")}
      >
        <h2 className="font-jakarta font-bold text-brand-secondary text-[17px]">
          Osoby z dostępem
        </h2>
        <p className="font-montserrat text-[13px] text-brand-secondary/60 mt-1 leading-relaxed">
          Konto musi już istnieć — poproś o jednorazowe zalogowanie, potem nadaj
          dostęp. Administratorzy mają go automatycznie.
        </p>

        <form onSubmit={addTester} className="flex flex-col sm:flex-row gap-2 mt-4">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="adres@email.pl"
            className="flex-1 h-11 px-4 rounded-[14px] bg-white/80 border border-white/70 font-montserrat text-[13.5px] text-brand-secondary placeholder:text-brand-secondary/35 outline-none focus:border-brand-primary/40 focus:ring-2 focus:ring-brand-primary/10 transition-all"
          />
          <button
            type="submit"
            disabled={addingTester || !email.trim()}
            className="relative inline-flex items-center justify-center gap-2 px-5 h-11 rounded-[14px] bg-brand-primary text-white font-montserrat text-[13.5px] font-bold shadow-[0_4px_15px_0px_rgba(242,217,103,0.35)] border border-brand-yellow/30 hover:brightness-110 transition-all overflow-hidden disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            <div className="absolute -bottom-3 -right-2 w-10 h-10 bg-brand-yellow/50 blur-[10px] rounded-full pointer-events-none" />
            <span className="relative z-10 flex items-center gap-2">
              {addingTester ? (
                <CircleNotch size={16} weight="bold" className="animate-spin" />
              ) : (
                <UserPlus size={16} weight="bold" />
              )}
              Nadaj dostęp
            </span>
          </button>
        </form>

        <div className="flex flex-col gap-2 mt-5">
          {testers.length === 0 && (
            <p className="font-montserrat text-[13px] text-brand-secondary/45 py-3">
              Nikt jeszcze nie ma dostępu — na razie piaskownicę widzą wyłącznie
              administratorzy.
            </p>
          )}

          <AnimatePresence initial={false}>
            {testers.map((t) => (
              <motion.div
                key={t.id}
                layout
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                transition={{ duration: 0.25, ease: "easeOut" }}
                className="flex items-center gap-3 rounded-[18px] rounded-tr-none bg-white/60 border border-white/70 px-4 py-3"
              >
                <div className="shrink-0 size-9 rounded-full bg-brand-primary/10 flex items-center justify-center overflow-hidden">
                  {t.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={t.image}
                      alt={t.name ?? t.email ?? "Tester"}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Users
                      size={16}
                      weight="duotone"
                      className="text-brand-primary"
                    />
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <p className="font-jakarta font-bold text-brand-secondary text-[13.5px] truncate">
                    {t.name?.trim() || t.email || "Konto bez nazwy"}
                  </p>
                  <p className="font-montserrat text-[12px] text-brand-secondary/55 truncate">
                    {t.email} · dostęp od {shortDate(t.grantedAt)}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => revokeTester(t)}
                  disabled={busyId === t.id}
                  aria-label={`Odbierz dostęp: ${t.email ?? t.name ?? "konto"}`}
                  className="shrink-0 inline-flex items-center justify-center size-9 rounded-[12px] bg-white/70 border border-white/70 text-brand-secondary/40 hover:text-rose-600 hover:border-rose-200 transition-colors disabled:opacity-50 cursor-pointer"
                >
                  {busyId === t.id ? (
                    <CircleNotch
                      size={15}
                      weight="bold"
                      className="animate-spin"
                    />
                  ) : (
                    <Trash size={15} weight="bold" />
                  )}
                </button>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </motion.section>
    </div>
  );
}
