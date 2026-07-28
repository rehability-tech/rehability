"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Star,
  Clock,
  Users,
  Coins,
  PlayCircle,
  ArrowSquareOut,
  CheckCircle,
  Stack,
  ListChecks,
  VideoCamera,
  WarningCircle,
  Tag,
  Quotes,
  Hash,
  CalendarBlank,
  ClockCounterClockwise,
  FilmSlate,
  PencilSimple,
  Trash,
  CircleNotch,
  Trophy,
  ChartLineUp,
  Timer,
  MagnifyingGlass,
  EnvelopeSimple,
  Lightning,
  Gear,
} from "@phosphor-icons/react/dist/ssr";
import {
  COURSE_BENEFITS,
  DEFAULT_FAQ,
  formatCourseDuration,
  type CourseBlock,
} from "@/app/(site)/kursy/_data/courses";
import type {
  DashboardData,
  CourseTab,
  ParticipantsData,
  ParticipantRow,
} from "./types";

const plnFmt = new Intl.NumberFormat("pl-PL");

const STATUS: Record<string, { label: string; badge: string; dot: string }> = {
  PUBLISHED: {
    label: "Opublikowany",
    badge: "text-emerald-700 bg-emerald-400/20 border-emerald-500/30",
    dot: "bg-emerald-500",
  },
  DRAFT: {
    label: "Wersja robocza",
    badge: "text-amber-700 bg-amber-400/20 border-amber-500/30",
    dot: "bg-amber-500",
  },
  ARCHIVED: {
    label: "Zarchiwizowany",
    badge: "text-slate-600 bg-slate-400/20 border-slate-400/30",
    dot: "bg-slate-400",
  },
};

const fmtDate = (iso: string) =>
  new Intl.DateTimeFormat("pl-PL", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(new Date(iso));

const inputCls =
  "w-full h-11 px-4 rounded-xl rounded-tr-[3px] bg-white/80 border border-brand-secondary/10 font-montserrat text-[13.5px] text-brand-secondary placeholder:text-brand-secondary/35 outline-none focus:border-brand-primary/40 focus:ring-4 focus:ring-brand-primary/10 transition-all";

// ---------- pomocnicze prezentacyjne (stabilne, poza komponentem) ----------

// Podgląd treści „O kursie" — render HTML (z RichTextInput) 1:1 jak na froncie.
function Block({ block }: { block: CourseBlock }) {
  if (block.type === "heading") {
    return (
      <h3
        className="font-jakarta font-bold text-[16px] text-brand-secondary mt-2 [&_p]:m-0"
        dangerouslySetInnerHTML={{ __html: block.text }}
      />
    );
  }
  if (block.type === "list") {
    return (
      <ul className="flex flex-col gap-1.5">
        {block.items.map((item, i) => (
          <li
            key={i}
            className="flex items-start gap-2 text-[13.5px] leading-[1.6] font-montserrat text-brand-secondary/75"
          >
            <CheckCircle size={16} weight="fill" className="text-brand-primary/60 shrink-0 mt-0.5" />
            <span
              className="[&_p]:m-0"
              dangerouslySetInnerHTML={{ __html: item }}
            />
          </li>
        ))}
      </ul>
    );
  }
  if (block.type === "highlight") {
    return (
      <div className="w-full border-l-4 border-brand-primary pl-3.5 py-1">
        <div
          className="font-jakarta font-medium text-[14px] text-brand-secondary/85 leading-relaxed [&_p]:m-0"
          dangerouslySetInnerHTML={{ __html: block.text }}
        />
      </div>
    );
  }
  if (block.type === "quote") {
    return (
      <div className="ps-3.5 border-l-[3px] border-brand-yellow">
        <div
          className="text-[13.5px] leading-[1.6] font-montserrat italic text-brand-secondary/75 [&_p]:m-0"
          dangerouslySetInnerHTML={{ __html: block.text }}
        />
      </div>
    );
  }
  if (block.type === "spacer") {
    return <div className="h-4" />;
  }
  return (
    <div
      className="text-[13.5px] leading-[1.7] font-montserrat text-brand-secondary/75 [&_p]:m-0 [&_p+p]:mt-2"
      dangerouslySetInnerHTML={{ __html: block.text }}
    />
  );
}

function Section({
  title,
  icon: Icon,
  action,
  children,
}: {
  title: string;
  icon: React.ElementType;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-[24px] rounded-tr-none bg-white/70 backdrop-blur-xl border border-white/60 shadow-[0_20px_55px_-36px_rgba(3,63,99,0.3)] p-5 sm:p-6">
      <div className="flex items-center justify-between gap-3 mb-4">
        <h2 className="font-jakarta font-bold text-[16px] text-brand-secondary inline-flex items-center gap-2">
          <span className="flex items-center justify-center size-8 rounded-xl rounded-tr-none bg-brand-primary/10 text-brand-primary">
            <Icon size={17} weight="duotone" />
          </span>
          {title}
        </h2>
        {action}
      </div>
      {children}
    </div>
  );
}

const STAT_TONE: Record<string, { gradient: string; iconShadow: string }> = {
  teal: {
    gradient: "from-[#287d88] to-[#1a5c66]",
    iconShadow: "shadow-[0_6px_16px_-6px_rgba(40,125,136,0.6)]",
  },
  violet: {
    gradient: "from-[#7c3aed] to-[#5b21b6]",
    iconShadow: "shadow-[0_6px_16px_-6px_rgba(124,58,237,0.5)]",
  },
  emerald: {
    gradient: "from-[#10b981] to-[#059669]",
    iconShadow: "shadow-[0_6px_16px_-6px_rgba(16,185,129,0.55)]",
  },
  amber: {
    gradient: "from-[#c9993a] to-[#a87928]",
    iconShadow: "shadow-[0_6px_16px_-6px_rgba(201,153,58,0.6)]",
  },
};

function StatTile({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  tone: keyof typeof STAT_TONE;
}) {
  const t = STAT_TONE[tone];
  return (
    <div className="relative overflow-hidden rounded-[20px] rounded-tr-none bg-gradient-to-br from-white/75 to-white/40 backdrop-blur-2xl border border-white/70 shadow-[0_20px_55px_-36px_rgba(3,63,99,0.3)] p-4">
      <div className={`absolute -left-5 -top-5 w-24 h-24 rounded-full bg-gradient-to-br ${t.gradient} opacity-15 blur-2xl pointer-events-none`} />
      <span className={`relative flex items-center justify-center size-10 rounded-2xl rounded-tr-none bg-gradient-to-br text-white mb-3 ${t.gradient} ${t.iconShadow}`}>
        <Icon size={20} weight="duotone" />
      </span>
      <p className="relative font-jakarta font-bold text-[22px] text-brand-secondary leading-none">{value}</p>
      <p className="relative font-montserrat text-[12px] text-brand-secondary/45 mt-1">{label}</p>
    </div>
  );
}

// ============================= GŁÓWNY KOMPONENT =============================

export function CourseDashboard({
  data,
  active,
  participants,
}: {
  data: DashboardData;
  active: CourseTab;
  participants?: ParticipantsData;
}) {
  const status = STATUS[data.status] ?? STATUS.DRAFT;
  const { lessonsCount, lessonsWithVideo } = data.stats;
  const videoPending =
    data.format === "single"
      ? !data.video
      : lessonsCount === 0 || lessonsWithVideo < lessonsCount;
  const missingCount =
    data.format === "single" ? 1 : lessonsCount - lessonsWithVideo;

  return (
    <div className="w-full max-w-6xl mx-auto p-6 animate-in fade-in duration-500">
      {/* Pasek górny */}
      <div className="flex items-center justify-between gap-3 mb-5">
        <Link
          href="/admin/kursy/lista"
          className="inline-flex items-center gap-2 font-montserrat font-semibold text-[13px] text-brand-secondary/60 hover:text-brand-primary transition-colors"
        >
          <ArrowLeft size={16} weight="bold" />
          Wszystkie kursy
        </Link>
        <div className="flex items-center gap-2">
          {/* Edycja danych/programu/treści w kreatorze (jak przy wydarzeniach) */}
          <Link
            href={`/admin/kursy/${data.slug}/edytuj`}
            className="group relative inline-flex items-center gap-2 bg-brand-primary text-white font-montserrat font-bold text-[13px] px-4 py-2.5 rounded-2xl rounded-tr-[3px] border border-brand-yellow/30 shadow-[0_8px_22px_-6px_rgba(40,125,136,0.5)] hover:shadow-[0_10px_26px_0px_rgba(242,217,103,0.45)] transition-all overflow-hidden"
          >
            <span className="pointer-events-none absolute -right-2 -bottom-2 size-9 rounded-full bg-brand-yellow/50 blur-[12px]" />
            <span className="relative inline-flex items-center gap-2">
              <PencilSimple size={16} weight="fill" />
              Edytuj kurs
            </span>
          </Link>
          <Link
            href={`/panel/vod/${data.slug}`}
            className="inline-flex items-center gap-2 bg-white/70 backdrop-blur-md border border-white/60 text-brand-secondary/70 font-montserrat font-bold text-[13px] px-4 py-2.5 rounded-2xl rounded-tr-[3px] hover:text-brand-primary transition-colors shadow-sm"
          >
            <PlayCircle size={16} weight="fill" />
            Odtwarzacz
          </Link>
          <Link
            href={`/kursy/${data.slug}`}
            className="inline-flex items-center gap-2 bg-white/70 backdrop-blur-md border border-white/60 text-brand-secondary/70 font-montserrat font-bold text-[13px] px-4 py-2.5 rounded-2xl rounded-tr-[3px] hover:text-brand-primary transition-colors shadow-sm"
          >
            <ArrowSquareOut size={16} weight="bold" />
            Podgląd
          </Link>
        </div>
      </div>

      {/* HERO */}
      <div className="rounded-[28px] rounded-tr-none bg-white/70 backdrop-blur-xl border border-white/60 shadow-[0_20px_55px_-36px_rgba(3,63,99,0.3)] overflow-hidden mb-4">
        <div className="flex flex-col md:flex-row">
          <div className="relative w-full md:w-[300px] lg:w-[340px] shrink-0 aspect-[16/10] md:aspect-auto md:min-h-[220px]">
            <Image
              src={data.image}
              alt={data.title}
              fill
              sizes="(max-width: 768px) 100vw, 340px"
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t md:bg-gradient-to-r from-brand-secondary/30 to-transparent" />
          </div>
          <div className="flex flex-col flex-1 p-5 sm:p-6">
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <span className={`inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border ${status.badge}`}>
                <span className={`size-1.5 rounded-full ${status.dot}`} />
                {status.label}
              </span>
              <span className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-brand-primary/10 text-brand-primary">
                {data.category}
              </span>
            </div>
            <h1 className="font-jakarta font-bold text-[22px] md:text-[26px] text-brand-secondary leading-tight">
              {data.title}
            </h1>
            <p className="font-montserrat text-[14px] text-brand-secondary/55 mt-2 leading-relaxed max-w-2xl">
              {data.excerpt}
            </p>
            <div className="flex flex-wrap items-center gap-x-5 gap-y-2 mt-4 text-[13px] font-montserrat text-brand-secondary/55">
              <span className="inline-flex items-center gap-1.5">
                <Star size={15} weight="fill" className="text-brand-yellow" />
                {data.reviews > 0 ? (
                  <>
                    <span className="font-semibold text-brand-secondary">{data.rating.toFixed(1)}</span>
                    ({data.reviews} opinii)
                  </>
                ) : (
                  <span className="font-semibold text-brand-secondary/70">Brak opinii</span>
                )}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Clock size={15} weight="duotone" className="text-brand-primary" />
                {formatCourseDuration(data.durationMin)}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Stack size={15} weight="duotone" className="text-brand-primary" />
                {data.stats.modulesCount} moduły
              </span>
              <span className="inline-flex items-center gap-1.5">
                <ListChecks size={15} weight="duotone" className="text-brand-primary" />
                {data.stats.lessonsCount} lekcji
              </span>
            </div>
            <div className="mt-auto pt-5">
              <p className="font-montserrat text-[10px] uppercase tracking-wider font-bold text-brand-secondary/40">
                Cena dożywotnia
              </p>
              <p className="font-jakarta font-bold text-[24px] text-brand-secondary leading-none mt-1">
                {plnFmt.format(data.price)} <span className="text-[15px] text-brand-secondary/50">zł</span>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Informacja: brak nagrań (publikacja dozwolona, ale sygnalizujemy) */}
      {videoPending && (
        <div className="flex items-start gap-3 rounded-[20px] rounded-tr-none bg-amber-50/80 border border-amber-200/70 p-4 mb-4">
          <span className="flex items-center justify-center size-9 shrink-0 rounded-xl rounded-tr-none bg-amber-400/20 text-amber-600">
            <VideoCamera size={18} weight="duotone" />
          </span>
          <div className="flex-1">
            <p className="font-jakarta font-bold text-[14px] text-amber-800">
              Nagrania w przygotowaniu
            </p>
            <p className="font-montserrat text-[12.5px] text-amber-700/90 leading-snug mt-0.5">
              {data.format === "single"
                ? "Ten kurs nie ma jeszcze głównego wideo. "
                : lessonsCount === 0
                  ? "Ten kurs nie ma jeszcze żadnych lekcji z nagraniem. "
                  : `Brakuje nagrań do ${missingCount} z ${lessonsCount} lekcji. `}
              Kurs może być opublikowany, ale kursanci zobaczą informację, że
              materiały są jeszcze uzupełniane.
            </p>
            <Link
              href={`/admin/kursy/${data.slug}/edytuj`}
              className="inline-flex items-center gap-1.5 mt-2 font-montserrat font-bold text-[12.5px] text-amber-700 hover:text-amber-900 transition-colors"
            >
              <FilmSlate size={14} weight="bold" />
              Uzupełnij nagrania
            </Link>
          </div>
        </div>
      )}

      {/* PANELE (nawigacja w sidebarze → osobne podstrony) */}
      {active === "overview" && <OverviewPanel data={data} />}
      {active === "participants" && (
        <ParticipantsPanel data={participants ?? { lessonsTotal: 0, participants: [] }} />
      )}
    </div>
  );
}

// ================================ PRZEGLĄD ================================

function OverviewPanel({ data }: { data: DashboardData }) {
  const blocks: CourseBlock[] = data.description ?? [
    { type: "paragraph", text: data.excerpt },
    { type: "heading", text: "Co otrzymujesz, dołączając do kursu?" },
    { type: "list", items: COURSE_BENEFITS },
  ];
  const testimonials = data.testimonials ?? [];
  const faq = data.faq ?? DEFAULT_FAQ;
  const { stats } = data;

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatTile icon={Users} label="Kursanci" value={plnFmt.format(stats.students)} tone="violet" />
        <StatTile icon={Coins} label="Przychód kursu" value={`${plnFmt.format(stats.revenue)} zł`} tone="emerald" />
        <StatTile icon={Star} label="Średnia ocena" value={data.reviews > 0 ? data.rating.toFixed(1) : "—"} tone="amber" />
        <StatTile icon={VideoCamera} label="Lekcje z wideo" value={`${stats.lessonsWithVideo}/${stats.lessonsCount}`} tone="teal" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 flex flex-col gap-4">
          <Section title="O kursie" icon={Tag}>
            <div className="flex flex-col gap-3">
              {blocks.map((block, i) => (
                <Block key={i} block={block} />
              ))}
            </div>
          </Section>

          <Section title="Program kursu" icon={Stack}>
            {data.modules.length === 0 ? (
              <EmptyHint text="Ten kurs nie ma jeszcze dodanych modułów ani lekcji. Kliknij „Edytuj kurs”, aby je dodać." />
            ) : (
              <div className="flex flex-col gap-3">
                {data.modules.map((mod, i) => (
                  <div key={mod.id} className="rounded-[18px] rounded-tr-none bg-white/60 border border-white/60 p-4">
                    <div className="flex items-center gap-2.5 mb-2.5">
                      <span className="flex items-center justify-center size-7 shrink-0 rounded-full bg-brand-primary text-white font-jakarta font-bold text-[13px]">
                        {i + 1}
                      </span>
                      <h3 className="font-jakarta font-bold text-[14.5px] text-brand-secondary leading-snug">{mod.title}</h3>
                      <span className="ml-auto shrink-0 font-montserrat text-[11px] text-brand-secondary/40">
                        {mod.lessons.length} lekcji
                      </span>
                    </div>
                    <ul className="flex flex-col gap-1.5 ps-1">
                      {mod.lessons.map((lesson) => (
                        <li key={lesson.id} className="flex items-center gap-2.5 text-[13px] leading-[1.5] font-montserrat text-brand-secondary/75">
                          <PlayCircle size={16} weight="fill" className={lesson.video ? "text-brand-primary shrink-0" : "text-brand-secondary/20 shrink-0"} />
                          <span className="flex-1">{lesson.title}</span>
                          {!lesson.video && (
                            <span className="shrink-0 text-[10px] font-bold uppercase tracking-wider text-amber-600 bg-amber-400/15 rounded-full px-2 py-0.5">
                              brak wideo
                            </span>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            )}
          </Section>

          <Section title="Opinie kursantów" icon={Quotes}>
            {testimonials.length === 0 ? (
              <EmptyHint text="Ten kurs nie ma jeszcze opinii. Pojawią się tu, gdy kursanci ocenią kurs w odtwarzaczu VOD." />
            ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {testimonials.map((review, i) => (
                <div key={i} className="rounded-[18px] rounded-tr-none bg-white/60 border border-white/60 p-4">
                  <div className="flex items-center gap-1 mb-2">
                    {Array.from({ length: 5 }).map((_, s) => (
                      <Star key={s} size={13} weight="fill" className={s < review.rating ? "text-brand-yellow" : "text-brand-secondary/15"} />
                    ))}
                  </div>
                  <p className="font-montserrat text-[13px] leading-[1.6] text-brand-secondary/75 mb-3">{review.text}</p>
                  <div className="flex items-center gap-2">
                    <span className="flex items-center justify-center size-8 rounded-full bg-brand-primary/10 text-brand-primary font-jakarta font-bold text-[13px]">
                      {review.author.charAt(0)}
                    </span>
                    <span className="font-montserrat font-semibold text-[13px] text-brand-secondary">{review.author}</span>
                  </div>
                </div>
              ))}
            </div>
            )}
          </Section>

          <Section title="Najczęstsze pytania" icon={ListChecks}>
            <div className="flex flex-col gap-2.5">
              {faq.map((item, i) => (
                <div key={i} className="rounded-[16px] rounded-tr-none bg-white/60 border border-white/60 p-4">
                  <p className="font-montserrat font-semibold text-[13.5px] text-brand-secondary mb-1.5">{item.q}</p>
                  <p className="font-montserrat text-[13px] leading-[1.6] text-brand-secondary/65">{item.a}</p>
                </div>
              ))}
            </div>
          </Section>
        </div>

        <div className="flex flex-col gap-4">
          <Section title="Szczegóły" icon={Hash}>
            <div className="divide-y divide-brand-secondary/[0.06] -my-2.5">
              <MetaRow icon={Hash} label="Slug">{data.slug}</MetaRow>
              <MetaRow icon={Tag} label="Kategoria">{data.category}</MetaRow>
              <MetaRow icon={FilmSlate} label="Format">{data.format === "single" ? "Pojedynczy film" : "Moduły i lekcje"}</MetaRow>
              <MetaRow icon={CheckCircle} label="Status">{(STATUS[data.status] ?? STATUS.DRAFT).label}</MetaRow>
              <MetaRow icon={Coins} label="Cena">{plnFmt.format(data.price)} zł</MetaRow>
              <MetaRow icon={CalendarBlank} label="Utworzono">{fmtDate(data.createdAt)}</MetaRow>
              <MetaRow icon={ClockCounterClockwise} label="Aktualizacja">{fmtDate(data.updatedAt)}</MetaRow>
            </div>
          </Section>

          <CourseAdminControls data={data} />
        </div>
      </div>
    </div>
  );
}

// Sterowanie kursem zostaje w dashboardzie (edycja treści jest w kreatorze):
// zmiana statusu publikacji + nieodwracalne usunięcie kursu.
function CourseAdminControls({ data }: { data: DashboardData }) {
  const router = useRouter();
  const [statusVal, setStatusVal] = useState(data.status);
  const [saving, setSaving] = useState(false);
  const [confirmDel, setConfirmDel] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  async function changeStatus(next: string) {
    const prev = statusVal;
    setStatusVal(next);
    setSaving(true);
    setMsg(null);
    try {
      const res = await fetch(`/api/admin/kursy/${data.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: next }),
      });
      if (!res.ok) throw new Error();
      setMsg({ type: "ok", text: "Zaktualizowano status." });
      router.refresh();
    } catch {
      setStatusVal(prev);
      setMsg({ type: "err", text: "Nie udało się zmienić statusu." });
    } finally {
      setSaving(false);
    }
  }

  async function del() {
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/kursy/${data.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      router.push("/admin/kursy/lista");
    } catch {
      setMsg({ type: "err", text: "Nie udało się usunąć kursu." });
      setDeleting(false);
    }
  }

  return (
    <Section title="Status i zarządzanie" icon={Gear}>
      <div className="flex flex-col gap-4">
        <div>
          <span className="font-montserrat font-semibold text-[12px] text-brand-secondary/60 mb-1.5 inline-flex items-center gap-1.5">
            Status publikacji
            {saving && <CircleNotch size={13} weight="bold" className="animate-spin text-brand-primary" />}
          </span>
          <select
            value={statusVal}
            onChange={(e) => changeStatus(e.target.value)}
            disabled={saving}
            className={`${inputCls} disabled:opacity-60`}
          >
            <option value="PUBLISHED">Opublikowany</option>
            <option value="DRAFT">Wersja robocza</option>
            <option value="ARCHIVED">Zarchiwizowany</option>
          </select>
          {msg && (
            <span
              className={`mt-2 inline-flex items-center gap-1.5 font-montserrat font-semibold text-[12px] ${
                msg.type === "ok" ? "text-emerald-600" : "text-rose-500"
              }`}
            >
              {msg.type === "ok" ? (
                <CheckCircle size={14} weight="fill" />
              ) : (
                <WarningCircle size={14} weight="fill" />
              )}
              {msg.text}
            </span>
          )}
        </div>

        <div className="h-px bg-brand-secondary/[0.06]" />

        <div>
          <p className="font-montserrat text-[12.5px] text-brand-secondary/55 mb-3 leading-snug">
            Usunięcie kursu jest nieodwracalne — skasuje moduły, lekcje, nagrania
            i dostępy kursantów.
          </p>
          {!confirmDel ? (
            <button
              type="button"
              onClick={() => setConfirmDel(true)}
              className="inline-flex items-center gap-1.5 bg-rose-500/10 text-rose-600 font-montserrat font-bold text-[12.5px] px-3.5 py-2.5 rounded-xl rounded-tr-[3px] hover:bg-rose-500 hover:text-white transition-colors"
            >
              <Trash size={15} weight="bold" />
              Usuń kurs
            </button>
          ) : (
            <div className="flex flex-col gap-2">
              <p className="font-montserrat font-semibold text-[12.5px] text-rose-600">
                Na pewno? Tej operacji nie cofniesz.
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={del}
                  disabled={deleting}
                  className="inline-flex items-center gap-1.5 bg-rose-500 text-white font-montserrat font-bold text-[12.5px] px-3.5 py-2.5 rounded-xl rounded-tr-[3px] hover:bg-rose-600 transition-colors disabled:opacity-60"
                >
                  {deleting ? <CircleNotch size={15} weight="bold" className="animate-spin" /> : <Trash size={15} weight="bold" />}
                  Tak, usuń
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmDel(false)}
                  disabled={deleting}
                  className="inline-flex items-center gap-1.5 bg-white border border-brand-secondary/15 text-brand-secondary/70 font-montserrat font-bold text-[12.5px] px-3.5 py-2.5 rounded-xl rounded-tr-[3px] hover:text-brand-secondary transition-colors"
                >
                  Anuluj
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </Section>
  );
}

function MetaRow({ icon: Icon, label, children }: { icon: React.ElementType; label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 py-2.5">
      <span className="inline-flex items-center gap-2 font-montserrat text-[12.5px] text-brand-secondary/50">
        <Icon size={15} weight="duotone" className="text-brand-primary/60" />
        {label}
      </span>
      <span className="font-montserrat font-semibold text-[12.5px] text-brand-secondary text-right truncate max-w-[55%]">
        {children}
      </span>
    </div>
  );
}

function EmptyHint({ text }: { text: string }) {
  return (
    <div className="flex items-center gap-2.5 rounded-xl bg-amber-50/70 border border-amber-200/60 px-4 py-3 font-montserrat text-[13px] text-amber-700">
      <WarningCircle size={18} weight="fill" className="shrink-0" />
      {text}
    </div>
  );
}

// ============================== UCZESTNICY ==============================

const fmtShortDate = (iso: string) =>
  new Intl.DateTimeFormat("pl-PL", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(iso));

/** Czas oglądania w czytelnej formie (godz/min). */
function fmtWatch(sec: number): string {
  if (!sec) return "—";
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  if (h > 0) return `${h} godz ${m} min`;
  if (m > 0) return `${m} min`;
  return "<1 min";
}

/** Względny czas ostatniej aktywności (np. „3 dni temu"). */
function fmtRelative(iso: string | null): string {
  if (!iso) return "Brak aktywności";
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return "przed chwilą";
  if (min < 60) return `${min} min temu`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${h} godz temu`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d} dni temu`;
  return fmtShortDate(iso);
}

function progressStatus(progress: number, lastActivity: string | null) {
  if (progress >= 100)
    return { label: "Ukończony", cls: "text-emerald-700 bg-emerald-400/15", bar: "from-emerald-400 to-emerald-500" };
  if (progress > 0 || lastActivity)
    return { label: "W trakcie", cls: "text-brand-primary bg-brand-primary/10", bar: "from-brand-primary to-brand-yellow" };
  return { label: "Nie rozpoczęty", cls: "text-slate-500 bg-slate-400/15", bar: "from-slate-300 to-slate-300" };
}

function ParticipantsPanel({ data }: { data: ParticipantsData }) {
  const [query, setQuery] = useState("");
  const { lessonsTotal, participants } = data;

  const total = participants.length;
  const completed = participants.filter((p) => p.progress >= 100).length;
  const avgProgress = total
    ? Math.round(participants.reduce((s, p) => s + p.progress, 0) / total)
    : 0;
  const weekAgo = Date.now() - 7 * 24 * 3600 * 1000;
  const activeWeek = participants.filter(
    (p) => p.lastActivity && new Date(p.lastActivity).getTime() >= weekAgo,
  ).length;

  const q = query.trim().toLowerCase();
  const rows = q
    ? participants.filter(
        (p) =>
          (p.name ?? "").toLowerCase().includes(q) ||
          (p.email ?? "").toLowerCase().includes(q),
      )
    : participants;

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatTile icon={Users} label="Uczestnicy" value={plnFmt.format(total)} tone="violet" />
        <StatTile icon={Trophy} label="Ukończyli kurs" value={plnFmt.format(completed)} tone="emerald" />
        <StatTile icon={ChartLineUp} label="Średni postęp" value={`${avgProgress}%`} tone="teal" />
        <StatTile icon={Lightning} label="Aktywni (7 dni)" value={plnFmt.format(activeWeek)} tone="amber" />
      </div>

      <Section
        title="Lista uczestników"
        icon={Users}
        action={
          total > 0 ? (
            <div className="relative">
              <MagnifyingGlass size={15} weight="bold" className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-secondary/35" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Szukaj…"
                className="h-9 w-40 sm:w-56 pl-9 pr-3 rounded-xl rounded-tr-[3px] bg-white/80 border border-brand-secondary/10 font-montserrat text-[13px] text-brand-secondary placeholder:text-brand-secondary/35 outline-none focus:border-brand-primary/40 focus:ring-4 focus:ring-brand-primary/10 transition-all"
              />
            </div>
          ) : undefined
        }
      >
        {total === 0 ? (
          <div className="flex flex-col items-center justify-center text-center py-10">
            <span className="flex items-center justify-center size-14 rounded-2xl rounded-tr-none bg-brand-primary/10 text-brand-primary mb-3">
              <Users size={26} weight="duotone" />
            </span>
            <p className="font-jakarta font-bold text-[15px] text-brand-secondary">Brak uczestników</p>
            <p className="font-montserrat text-[13px] text-brand-secondary/55 mt-1 max-w-sm">
              Nikt nie kupił jeszcze dostępu do tego kursu. Uczestnicy pojawią się
              tu automatycznie po pierwszym zakupie.
            </p>
          </div>
        ) : rows.length === 0 ? (
          <EmptyHint text={`Brak uczestników pasujących do „${query}".`} />
        ) : (
          <div className="flex flex-col gap-2.5">
            {/* Nagłówek tabeli (desktop) */}
            <div className="hidden lg:grid grid-cols-[1.6fr_1.4fr_0.9fr_0.9fr_1fr] gap-3 px-3 pb-1 font-montserrat font-semibold text-[11px] uppercase tracking-wider text-brand-secondary/40">
              <span>Uczestnik</span>
              <span>Postęp</span>
              <span>Czas oglądania</span>
              <span>Ostatnia aktywność</span>
              <span className="text-right">Dołączył</span>
            </div>
            {rows.map((p) => (
              <ParticipantCard key={p.userId} p={p} lessonsTotal={lessonsTotal} />
            ))}
          </div>
        )}
      </Section>
    </div>
  );
}

function ParticipantCard({ p, lessonsTotal }: { p: ParticipantRow; lessonsTotal: number }) {
  const status = progressStatus(p.progress, p.lastActivity);
  const initial = (p.name?.trim() || p.email || "?").charAt(0).toUpperCase();

  return (
    <div className="rounded-[18px] rounded-tr-none bg-white/60 border border-white/60 p-3.5 lg:px-3 lg:py-3 lg:grid lg:grid-cols-[1.6fr_1.4fr_0.9fr_0.9fr_1fr] lg:items-center gap-3">
      {/* Uczestnik */}
      <div className="flex items-center gap-3 min-w-0">
        <span className="relative flex items-center justify-center size-10 shrink-0 rounded-full bg-brand-primary/10 text-brand-primary font-jakarta font-bold text-[15px] overflow-hidden">
          {p.image ? (
            <Image src={p.image} alt="" fill sizes="40px" className="object-cover" />
          ) : (
            initial
          )}
        </span>
        <div className="min-w-0">
          <p className="font-jakarta font-bold text-[13.5px] text-brand-secondary truncate">
            {p.name?.trim() || "Uczestnik"}
          </p>
          <p className="inline-flex items-center gap-1 font-montserrat text-[12px] text-brand-secondary/50 truncate">
            <EnvelopeSimple size={12} weight="duotone" className="shrink-0" />
            <span className="truncate">{p.email || "—"}</span>
          </p>
        </div>
      </div>

      {/* Postęp */}
      <div className="mt-3 lg:mt-0">
        <div className="flex items-center justify-between gap-2 mb-1">
          <span className={`inline-flex items-center text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${status.cls}`}>
            {status.label}
          </span>
          <span className="font-montserrat text-[11.5px] text-brand-secondary/55">
            {p.lessonsCompleted}/{lessonsTotal} lekcji · <span className="font-semibold text-brand-secondary">{p.progress}%</span>
          </span>
        </div>
        <div className="h-2 w-full rounded-full bg-brand-secondary/10 overflow-hidden">
          <div className={`h-full rounded-full bg-gradient-to-r ${status.bar}`} style={{ width: `${p.progress}%` }} />
        </div>
      </div>

      {/* Czas oglądania */}
      <div className="mt-3 lg:mt-0 inline-flex items-center gap-1.5 font-montserrat text-[12.5px] text-brand-secondary/70">
        <Timer size={15} weight="duotone" className="text-brand-primary/60 lg:hidden" />
        <span className="lg:hidden text-brand-secondary/45">Czas:</span>
        {fmtWatch(p.watchSeconds)}
      </div>

      {/* Ostatnia aktywność */}
      <div className="mt-1.5 lg:mt-0 inline-flex items-center gap-1.5 font-montserrat text-[12.5px] text-brand-secondary/70">
        <ClockCounterClockwise size={15} weight="duotone" className="text-brand-primary/60 lg:hidden" />
        <span className="lg:hidden text-brand-secondary/45">Aktywność:</span>
        {fmtRelative(p.lastActivity)}
      </div>

      {/* Dołączył */}
      <div className="mt-1.5 lg:mt-0 inline-flex items-center gap-1.5 lg:justify-end font-montserrat text-[12.5px] text-brand-secondary/70">
        <CalendarBlank size={15} weight="duotone" className="text-brand-primary/60 lg:hidden" />
        <span className="lg:hidden text-brand-secondary/45">Dołączył:</span>
        {fmtShortDate(p.enrolledAt)}
      </div>
    </div>
  );
}
