import {
  Tent,
  PlayCircle,
  Article,
} from "@phosphor-icons/react/dist/ssr";
import PillarStatCard, {
  type PillarStatCardProps,
} from "./_components/PillarStatCard";
import RecentGlobalActivity, {
  type ActivityEntry,
} from "./_components/RecentGlobalActivity";

const pillars: PillarStatCardProps[] = [
  {
    title: "System Campów",
    subtitle: "Wyjazdy, rezerwacje, usługi, skaner QR",
    icon: <Tent size={28} weight="duotone" />,
    accentColor: "primary",
    href: "/admin/campy",
    badge: "12 Aktywne",
    mainStat: { value: "12", label: "Aktywne wyjazdy" },
    subStats: [
      { label: "Oczekujące wpłaty", value: "14 500 zł", trend: "down" },
      { label: "Łączne wyświetlenia", value: "12 400", trend: "up" },
      { label: "Wolne miejsca", value: "8" },
    ],
  },
  {
    title: "Platforma VOD",
    subtitle: "Kursy online, lekcje wideo, streaming",
    icon: <PlayCircle size={28} weight="duotone" />,
    accentColor: "yellow",
    href: "/admin/vod",
    badge: "240 Sub.",
    mainStat: { value: "240", label: "Aktywne subskrypcje" },
    subStats: [
      { label: "Miesięczny MRR", value: "8 400 zł", trend: "up" },
      { label: "Obejrzane godziny", value: "1 240h", trend: "up" },
    ],
  },
  {
    title: "Blog i SEO",
    subtitle: "Artykuły, harmonogram publikacji, SEO",
    icon: <Article size={28} weight="duotone" />,
    accentColor: "secondary",
    href: "/admin/blog",
    badge: "45 Posty",
    mainStat: { value: "45", label: "Opublikowane artykuły" },
    subStats: [
      { label: "Wyświetlenia w tym tyg.", value: "5 200", trend: "up" },
      { label: "Zaplanowane wpisy", value: "3" },
    ],
  },
];

const activityFeed: ActivityEntry[] = [
  {
    id: "a1",
    pillar: "VOD",
    kind: "VOD_PURCHASE",
    who: "Anna Kowalska",
    text: "Wykupiła kurs „Zdrowy Kręgosłup – Tydzień 1”",
    meta: "+199 zł",
    time: "2 min",
  },
  {
    id: "a2",
    pillar: "CAMP",
    kind: "PAYMENT",
    who: "Katarzyna Wójcik",
    text: "Opłaciła pełną kwotę za Camp Mazury",
    meta: "+1 800 zł",
    time: "12 min",
  },
  {
    id: "a3",
    pillar: "BLOG",
    kind: "POST_PUBLISHED",
    who: "Zespół redakcyjny",
    text: "Opublikowano artykuł „Jak oddychać przeponą”",
    meta: "SEO 92/100",
    time: "38 min",
  },
  {
    id: "a4",
    pillar: "CAMP",
    kind: "HEALTH_FILLED",
    who: "Marta Wiśniewska",
    text: "Uzupełniła Kartę Zdrowia (wegetarianka, brak alergii)",
    time: "1 godz.",
  },
  {
    id: "a5",
    pillar: "VOD",
    kind: "SIGNUP",
    who: "Patrycja Nowak",
    text: "Założyła konto i wykupiła plan miesięczny",
    meta: "+89 zł",
    time: "2 godz.",
  },
  {
    id: "a6",
    pillar: "CAMP",
    kind: "SERVICE_ORDER",
    who: "Karolina Maj",
    text: "Zarezerwowała Masaż Kobido na 13.06 · 14:00",
    meta: "+220 zł",
    time: "3 godz.",
  },
];

export default function AdminHubPage() {
  return (
    <div className="relative min-h-[calc(100vh-64px)] font-montserrat overflow-hidden">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-[linear-gradient(to_bottom,#dafbff_0%,#ffffff_70%)]" />
        <div className="absolute -top-40 left-1/4 w-[600px] h-[600px] rounded-full bg-brand-primary/20 blur-[140px]" />
        <div className="absolute top-1/3 -right-40 w-[500px] h-[500px] rounded-full bg-brand-yellow/30 blur-[140px]" />
        <div className="absolute -bottom-40 left-0 w-[520px] h-[520px] rounded-full bg-brand-secondary/15 blur-[140px]" />
      </div>

      <div className="max-w-[1200px] mx-auto px-4 lg:px-8 py-8 lg:py-14">
        <header className="text-center mb-8 lg:mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/70 backdrop-blur-md border border-white/40 shadow-[0_4px_16px_-6px_rgba(3,63,99,0.1)]">
            <span className="w-1.5 h-1.5 rounded-full bg-brand-primary shadow-[0_0_8px_rgba(40,125,136,0.7)] animate-pulse" />
            <span className="text-[11px] uppercase tracking-[0.2em] text-brand-secondary font-bold">
              Admin Hub · Launcher
            </span>
          </div>
          <h1 className="font-jakarta text-[28px] md:text-[40px] font-bold text-brand-secondary leading-tight mt-4">
            Twoje trzy filary biznesu
          </h1>
          <p className="text-[13.5px] md:text-[15px] text-brand-secondary/60 mt-2 max-w-xl mx-auto">
            Camp, VOD i Blog w jednym miejscu. Wybierz moduł albo zerknij na
            ostatnie zdarzenia poniżej.
          </p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {pillars.map((p, i) => (
            <PillarStatCard key={p.href} {...p} index={i} />
          ))}
        </div>

        <div className="mt-8 lg:mt-10">
          <RecentGlobalActivity entries={activityFeed} />
        </div>
      </div>
    </div>
  );
}
