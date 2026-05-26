"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  MagnifyingGlass,
  Phone,
  Envelope,
  Users,
  ArrowUpRight,
  CheckCircle,
  Warning,
  Clock,
  Sparkle,
  FunnelSimple,
  Heart,
  CurrencyCircleDollar,
  UserPlus,
} from "@phosphor-icons/react/dist/ssr";

type Payment = "PAID_FULL" | "DEPOSIT_ONLY" | "NONE";
type Health = "FILLED" | "PARTIAL" | "MISSING";
type Pack = "SOLO" | "DUO";

interface ParticipantRow {
  id: string;
  name: string;
  initials: string;
  email: string;
  phone: string;
  pack: Pack;
  invitedBy?: string;
  payment: Payment;
  paidAmount: number;
  totalAmount: number;
  health: Health;
  servicesCount: number;
  servicesValue: number;
}

const participants: ParticipantRow[] = [
  {
    id: "b_001",
    name: "Anna Kowalska",
    initials: "AK",
    email: "anna.kowalska@example.com",
    phone: "+48 602 145 880",
    pack: "DUO",
    invitedBy: "Karolina Maj",
    payment: "DEPOSIT_ONLY",
    paidAmount: 600,
    totalAmount: 2400,
    health: "MISSING",
    servicesCount: 2,
    servicesValue: 440,
  },
  {
    id: "b_002",
    name: "Marta Wiśniewska",
    initials: "MW",
    email: "m.wisniewska@example.com",
    phone: "+48 692 813 005",
    pack: "SOLO",
    payment: "PAID_FULL",
    paidAmount: 2400,
    totalAmount: 2400,
    health: "FILLED",
    servicesCount: 1,
    servicesValue: 220,
  },
  {
    id: "b_003",
    name: "Joanna Lis",
    initials: "JL",
    email: "joanna.lis@example.com",
    phone: "+48 514 902 117",
    pack: "SOLO",
    payment: "PAID_FULL",
    paidAmount: 2400,
    totalAmount: 2400,
    health: "PARTIAL",
    servicesCount: 0,
    servicesValue: 0,
  },
  {
    id: "b_004",
    name: "Karolina Maj",
    initials: "KM",
    email: "karolina.maj@example.com",
    phone: "+48 731 200 408",
    pack: "DUO",
    invitedBy: "—",
    payment: "DEPOSIT_ONLY",
    paidAmount: 600,
    totalAmount: 2400,
    health: "FILLED",
    servicesCount: 3,
    servicesValue: 680,
  },
  {
    id: "b_005",
    name: "Patrycja Nowak",
    initials: "PN",
    email: "p.nowak@example.com",
    phone: "+48 502 044 991",
    pack: "SOLO",
    payment: "NONE",
    paidAmount: 0,
    totalAmount: 2400,
    health: "MISSING",
    servicesCount: 0,
    servicesValue: 0,
  },
  {
    id: "b_006",
    name: "Aleksandra Górska",
    initials: "AG",
    email: "ola.gorska@example.com",
    phone: "+48 668 715 220",
    pack: "SOLO",
    payment: "PAID_FULL",
    paidAmount: 2400,
    totalAmount: 2400,
    health: "FILLED",
    servicesCount: 2,
    servicesValue: 480,
  },
  {
    id: "b_007",
    name: "Magdalena Sosna",
    initials: "MS",
    email: "m.sosna@example.com",
    phone: "+48 663 410 902",
    pack: "DUO",
    invitedBy: "Aleksandra Górska",
    payment: "DEPOSIT_ONLY",
    paidAmount: 600,
    totalAmount: 2400,
    health: "PARTIAL",
    servicesCount: 1,
    servicesValue: 200,
  },
  {
    id: "b_008",
    name: "Natalia Krupa",
    initials: "NK",
    email: "n.krupa@example.com",
    phone: "+48 781 200 008",
    pack: "SOLO",
    payment: "PAID_FULL",
    paidAmount: 2400,
    totalAmount: 2400,
    health: "FILLED",
    servicesCount: 2,
    servicesValue: 320,
  },
];

function paymentBadge(p: Payment) {
  if (p === "PAID_FULL")
    return {
      label: "Opłacone",
      cls: "bg-brand-primary/15 text-brand-primary",
      dot: "bg-brand-primary",
    };
  if (p === "DEPOSIT_ONLY")
    return {
      label: "Tylko zadatek",
      cls: "bg-brand-yellow/40 text-brand-secondary",
      dot: "bg-brand-yellow",
    };
  return {
    label: "Brak wpłaty",
    cls: "bg-brand-secondary/15 text-brand-secondary",
    dot: "bg-brand-secondary",
  };
}

function healthBadge(h: Health) {
  if (h === "FILLED")
    return {
      label: "Karta OK",
      cls: "bg-brand-primary/10 text-brand-primary",
      glow: false,
    };
  if (h === "PARTIAL")
    return {
      label: "Karta — niekompletna",
      cls: "bg-brand-yellow/30 text-brand-secondary",
      glow: false,
    };
  return {
    label: "Brak ankiety!",
    cls: "bg-brand-secondary text-white",
    glow: true,
  };
}

export default function UczestniczkiListPage() {
  const summary = {
    total: participants.length,
    paid: participants.filter((p) => p.payment === "PAID_FULL").length,
    missingHealth: participants.filter((p) => p.health === "MISSING").length,
    duo: participants.filter((p) => p.pack === "DUO").length,
  };

  return (
    <div className="relative min-h-[calc(100vh-64px)] font-montserrat">
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(to_bottom,#dafbff_0%,#ffffff_60%)]" />
        <div className="absolute -top-40 -left-32 w-[480px] h-[480px] rounded-full bg-brand-primary/15 blur-[120px]" />
        <div className="absolute top-40 -right-40 w-[440px] h-[440px] rounded-full bg-brand-yellow/25 blur-[120px]" />
      </div>

      <div className="p-4 md:p-8 xl:p-10 space-y-6">
        {/* HEADER */}
        <header className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/70 backdrop-blur-md border border-white/40 shadow-[0_4px_16px_-6px_rgba(3,63,99,0.1)]">
              <Users size={12} weight="duotone" className="text-brand-primary" />
              <span className="text-[11px] uppercase tracking-[0.18em] text-brand-secondary font-bold">
                Uczestniczki · Trip Mazury
              </span>
            </div>
            <h1 className="font-jakarta text-[26px] md:text-[32px] font-bold text-brand-secondary leading-tight mt-2">
              {summary.total} kobiet na liście
            </h1>
            <p className="text-[13px] text-brand-secondary/60 mt-1">
              Płatności, karty zdrowia, pakiety „Zabierz Przyjaciółkę”
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button className="hidden md:inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white/70 backdrop-blur-md border border-white/40 text-[13px] font-semibold text-brand-secondary hover:bg-white transition shadow-[0_4px_14px_-6px_rgba(3,63,99,0.15)]">
              <FunnelSimple size={16} weight="duotone" />
              Filtruj
            </button>
            <button className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-brand-primary text-white text-[13px] font-bold hover:bg-brand-secondary transition shadow-[0_8px_22px_-8px_rgba(40,125,136,0.5)]">
              <UserPlus size={16} weight="bold" />
              Dodaj ręcznie
            </button>
          </div>
        </header>

        {/* QUICK STATS */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
          {[
            {
              label: "Wszystkie",
              value: summary.total,
              icon: <Users size={18} weight="duotone" />,
              accent: "text-brand-primary bg-brand-primary/10",
            },
            {
              label: "Opłacone w pełni",
              value: summary.paid,
              icon: <CheckCircle size={18} weight="duotone" />,
              accent: "text-brand-primary bg-brand-primary/10",
            },
            {
              label: "Bez Karty Zdrowia",
              value: summary.missingHealth,
              icon: <Warning size={18} weight="duotone" />,
              accent: "text-brand-secondary bg-brand-yellow/40",
            },
            {
              label: "Pakiet DUO",
              value: summary.duo,
              icon: <Heart size={18} weight="duotone" />,
              accent: "text-brand-secondary bg-brand-secondary/10",
            },
          ].map((s, i) => (
            <div
              key={i}
              className="rounded-2xl bg-white/70 backdrop-blur-xl border border-white/40 p-4 shadow-[0_8px_30px_-12px_rgba(3,63,99,0.12)] flex items-center gap-3"
            >
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center ${s.accent}`}
              >
                {s.icon}
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wider text-brand-secondary/50 font-bold">
                  {s.label}
                </p>
                <p className="font-jakarta text-[22px] font-bold text-brand-secondary leading-none mt-0.5">
                  {s.value}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* SEARCH */}
        <div className="rounded-2xl bg-white/70 backdrop-blur-xl border border-white/40 shadow-[0_8px_30px_-12px_rgba(3,63,99,0.12)] flex items-center gap-3 px-4 py-3">
          <MagnifyingGlass
            size={18}
            className="text-brand-secondary/40"
            weight="duotone"
          />
          <input
            type="text"
            placeholder="Szukaj po imieniu, emailu, telefonie…"
            className="flex-1 bg-transparent text-[13px] text-brand-secondary placeholder:text-brand-secondary/40 focus:outline-none"
          />
          <span className="text-[11px] text-brand-secondary/40 font-semibold hidden md:inline">
            ⌘K
          </span>
        </div>

        {/* MOBILE LIST */}
        <ul className="md:hidden space-y-3">
          {participants.map((p, i) => {
            const pay = paymentBadge(p.payment);
            const hp = healthBadge(p.health);
            return (
              <motion.li
                key={p.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: i * 0.04 }}
              >
                <Link
                  href={`/admin/wyjazdy/123/uczestniczki/${p.id}`}
                  className="block relative rounded-2xl bg-white/70 backdrop-blur-xl border border-white/40 p-4 shadow-[0_8px_30px_-12px_rgba(3,63,99,0.12)] overflow-hidden"
                >
                  {hp.glow && (
                    <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full bg-brand-secondary/30 blur-2xl" />
                  )}
                  <div className="relative flex items-start gap-3">
                    <div className="relative shrink-0">
                      <div className="absolute -inset-[2px] rounded-full bg-gradient-to-br from-brand-primary to-brand-secondary opacity-80" />
                      <div className="relative w-12 h-12 rounded-full bg-white flex items-center justify-center font-bold text-[13px] text-brand-secondary">
                        {p.initials}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="font-jakarta font-bold text-[15px] text-brand-secondary truncate">
                          {p.name}
                        </p>
                        {p.pack === "DUO" && (
                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-brand-secondary/10 text-brand-secondary">
                            DUO
                          </span>
                        )}
                      </div>
                      <p className="text-[12px] text-brand-secondary/60 truncate mt-0.5">
                        {p.email}
                      </p>
                      <div className="flex flex-wrap items-center gap-1.5 mt-2">
                        <span
                          className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${pay.cls}`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${pay.dot}`}
                          />
                          {pay.label}
                        </span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${hp.cls}`}
                        >
                          {hp.label}
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2 shrink-0">
                      <a
                        href={`tel:${p.phone}`}
                        onClick={(e) => e.stopPropagation()}
                        className="w-9 h-9 rounded-xl bg-brand-primary/10 text-brand-primary flex items-center justify-center"
                      >
                        <Phone size={16} weight="duotone" />
                      </a>
                      <a
                        href={`mailto:${p.email}`}
                        onClick={(e) => e.stopPropagation()}
                        className="w-9 h-9 rounded-xl bg-brand-secondary/10 text-brand-secondary flex items-center justify-center"
                      >
                        <Envelope size={16} weight="duotone" />
                      </a>
                    </div>
                  </div>
                </Link>
              </motion.li>
            );
          })}
        </ul>

        {/* DESKTOP TABLE */}
        <div className="hidden md:block rounded-3xl bg-white/70 backdrop-blur-xl border border-white/40 shadow-[0_8px_30px_-12px_rgba(3,63,99,0.12)] overflow-hidden">
          <div className="grid grid-cols-[2.2fr_1.4fr_1.6fr_1.6fr_1.4fr_60px] gap-4 px-6 py-4 text-[10px] uppercase tracking-wider font-bold text-brand-secondary/40">
            <span>Uczestniczka</span>
            <span>Pakiet</span>
            <span>Płatność</span>
            <span>Karta zdrowia</span>
            <span>Usługi</span>
            <span />
          </div>
          <ul>
            {participants.map((p, i) => {
              const pay = paymentBadge(p.payment);
              const hp = healthBadge(p.health);
              const progress = Math.round((p.paidAmount / p.totalAmount) * 100);
              return (
                <li key={p.id}>
                  <Link
                    href={`/admin/wyjazdy/123/uczestniczki/${p.id}`}
                    className="group grid grid-cols-[2.2fr_1.4fr_1.6fr_1.6fr_1.4fr_60px] gap-4 items-center px-6 py-4 transition hover:bg-white/80 border-t border-white/30"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="relative shrink-0">
                        <div className="absolute -inset-[2px] rounded-full bg-gradient-to-br from-brand-primary to-brand-secondary opacity-80" />
                        <div className="relative w-10 h-10 rounded-full bg-white flex items-center justify-center font-bold text-[12px] text-brand-secondary">
                          {p.initials}
                        </div>
                      </div>
                      <div className="min-w-0">
                        <p className="font-jakarta font-bold text-[14px] text-brand-secondary truncate">
                          {p.name}
                        </p>
                        <p className="text-[12px] text-brand-secondary/50 truncate">
                          {p.email}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-col">
                      <span className="text-[12px] font-semibold text-brand-secondary">
                        {p.pack === "DUO" ? "Duo (Przyjaciółka)" : "Solo"}
                      </span>
                      {p.pack === "DUO" && (
                        <span className="text-[11px] text-brand-secondary/50 truncate">
                          z {p.invitedBy}
                        </span>
                      )}
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <span
                        className={`inline-flex items-center gap-1 self-start text-[10px] font-bold px-2 py-0.5 rounded-full ${pay.cls}`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${pay.dot}`}
                        />
                        {pay.label}
                      </span>
                      <div className="flex items-center gap-2 text-[11px] text-brand-secondary/60">
                        <div className="w-20 h-1 bg-brand-secondary/10 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-brand-primary to-brand-secondary rounded-full"
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                        <span className="font-semibold">{progress}%</span>
                      </div>
                    </div>

                    <div className="relative">
                      <span
                        className={`inline-flex items-center text-[10px] font-bold px-2 py-1 rounded-full ${hp.cls}`}
                      >
                        {hp.label}
                      </span>
                      {hp.glow && (
                        <div className="absolute -inset-2 bg-brand-secondary/15 blur-xl rounded-full -z-10" />
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <Sparkle
                        size={14}
                        weight="duotone"
                        className="text-brand-primary"
                      />
                      <span className="text-[13px] font-semibold text-brand-secondary">
                        {p.servicesCount}
                      </span>
                      <span className="text-[11px] text-brand-secondary/50">
                        ·{" "}
                        {p.servicesValue.toLocaleString("pl-PL")} zł
                      </span>
                    </div>

                    <div className="flex justify-end">
                      <div className="w-9 h-9 rounded-full bg-white/60 group-hover:bg-brand-primary group-hover:text-white text-brand-primary flex items-center justify-center transition shadow-[0_4px_12px_-4px_rgba(3,63,99,0.15)]">
                        <ArrowUpRight size={14} weight="bold" />
                      </div>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>

          <div className="flex items-center justify-between px-6 py-4 border-t border-white/30 text-[12px] text-brand-secondary/60">
            <span>
              Wyświetlono <b className="text-brand-secondary">{participants.length}</b>{" "}
              z <b className="text-brand-secondary">{participants.length}</b>
            </span>
            <div className="flex items-center gap-2">
              <Clock size={14} weight="duotone" />
              <span>Ostatnia synchronizacja: przed chwilą</span>
            </div>
          </div>
        </div>

        <p className="text-[11px] text-brand-secondary/40 text-center md:hidden">
          <CurrencyCircleDollar size={12} className="inline -mt-0.5" /> Wartości
          mocków · podpięcie do bazy w kroku 2.
        </p>
      </div>
    </div>
  );
}
