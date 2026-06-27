"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence, type Variants } from "framer-motion";
import { usePathname, useSearchParams } from "next/navigation";
import { FEATURES } from "@/lib/featureFlags";
import { signOut } from "next-auth/react";
import { useChatUnreadLinks } from "@/hooks/useChatUnreadLinks";
import AttentionDot from "@/components/ui/AttentionDot";
import {
  SquaresFour,
  Suitcase,
  Users,
  SignOut,
  Info,
  UserList,
  ListNumbers,
  Image as ImageIcon,
  Article,
  NewspaperClipping,
  TextT,
  MagnifyingGlass,
  CalendarBlank,
  Sparkle,
  ChatCircleDots,
  Envelope,
  GraduationCap,
  ChartLineUp,
  CaretDown,
  PencilSimple,
  PaperPlaneTilt,
} from "@phosphor-icons/react/dist/ssr";
import { cn } from "@/lib/utils";

type IconType = React.ComponentType<{
  size?: number;
  weight?: "thin" | "light" | "regular" | "bold" | "fill" | "duotone";
  className?: string;
}>;

// Pojedyncza pozycja nawigacji (głównego poziomu).
function NavLink({
  href,
  label,
  icon: Icon,
  active,
  onClick,
}: {
  href: string;
  label: string;
  icon: IconType;
  active: boolean;
  onClick?: (e: { preventDefault: () => void }) => void;
}) {
  return (
    <Link href={href} onClick={onClick}>
      <div
        className={cn(
          "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-300 group relative overflow-hidden",
          active
            ? "bg-brand-primary text-white shadow-[0_4px_12px_-2px_rgba(40,125,136,0.25)]"
            : "text-brand-secondary/60 hover:bg-white/40 hover:text-brand-secondary",
        )}
      >
        {active && (
          <div className="absolute -bottom-4 -right-3 w-14 h-14 bg-brand-yellow/30 rounded-full blur-lg pointer-events-none" />
        )}
        <Icon
          size={20}
          weight={active ? "fill" : "duotone"}
          className={cn(
            "relative z-10 transition-colors",
            active
              ? "text-white"
              : "text-brand-secondary/40 group-hover:text-brand-secondary/70",
          )}
        />
        <span className="font-montserrat text-[13px] font-medium tracking-wide relative z-10">
          {label}
        </span>
      </div>
    </Link>
  );
}

// Kaskada (waterfall) pozycji przy rozwijaniu — framer-motion.
const sectionList: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08, delayChildren: 0.05 } },
};
const sectionItem: Variants = {
  hidden: { opacity: 0, y: 8 },
  show: {
    opacity: 1,
    y: 0,
    transition: { type: "spring", stiffness: 340, damping: 26 },
  },
};

// Zwijana sekcja (akordeon „drzewko") — ikona w nagłówku, pozycje wcięte za
// pionową linią; płynne rozwijanie (height) + kaskada (waterfall).
function Section({
  title,
  icon: Icon,
  open,
  onToggle,
  children,
}: {
  title: string;
  icon: IconType;
  open: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  const items = React.Children.toArray(children);
  return (
    <div className="flex flex-col mt-3">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className="group flex items-center gap-2 w-full px-3 py-1.5"
      >
        <span className="flex items-center justify-center size-5 shrink-0 rounded-md bg-brand-primary/10 text-brand-primary">
          <Icon size={12} weight="duotone" />
        </span>
        <span className="flex-1 text-left text-[11px] uppercase tracking-[0.16em] font-bold text-brand-secondary/70 group-hover:text-brand-secondary transition-colors">
          {title}
        </span>
        <CaretDown
          size={12}
          weight="bold"
          className={cn(
            "shrink-0 transition-transform duration-300",
            open ? "text-brand-primary" : "text-brand-secondary/30 -rotate-90",
          )}
        />
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="content"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <motion.div
              variants={sectionList}
              initial="hidden"
              animate="show"
              className="mt-1 ml-[18px] pl-3 border-l border-brand-primary/15 flex flex-col"
            >
              {items.map((child, i) => (
                <motion.div key={i} variants={sectionItem}>
                  {child}
                </motion.div>
              ))}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function AdminSidebar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Nieprzeczytane wiadomości czatu → pulsująca kropka na zakładce "Czat".
  const { links: chatUnreadLinks, refresh: refreshChatUnread } =
    useChatUnreadLinks();
  useEffect(() => {
    refreshChatUnread();
  }, [pathname, refreshChatUnread]);

  // 1. ZAAWANSOWANE POBIERANIE ID WYJAZDU
  const queryId = searchParams.get("id");

  const pathSegments = pathname.split("/").filter(Boolean);
  let pathTripId: string | null = null;
  if (
    pathSegments[0] === "admin" &&
    pathSegments[1] === "wyjazdy" &&
    pathSegments.length >= 3 &&
    !["dodaj", "edycja", "platnosci", "live", "uczestniczki", "lista"].includes(
      pathSegments[2],
    )
  ) {
    pathTripId = pathSegments[2];
  }

  // Ostateczne ID wyjazdu, w którym obecnie "siedzimy"
  const actualTripId = queryId || pathTripId;

  // 2. FLAGI KONTEKSTOWE
  const isInsideCampContext = pathname.startsWith("/admin/wyjazdy");
  const isCreatingCamp = pathname.startsWith("/admin/wyjazdy/dodaj");
  const isManagingCamp =
    !!actualTripId && isInsideCampContext && !isCreatingCamp;
  const isWyjazdyPanel = pathname === "/admin/wyjazdy";
  const isWyjazdyList = pathname.startsWith("/admin/wyjazdy/lista");

  const isCreatingPost = pathname.startsWith("/admin/blog/dodaj");
  const isBlogPanel = pathname === "/admin/blog";
  const isBlogList = pathname.startsWith("/admin/blog/lista");
  const isBlogHarmonogram = pathname === "/admin/blog/harmonogram";

  const isInCrmSection = pathname.startsWith("/admin/klienci");

  const isVodOverview = pathname === "/admin/kursy";
  const isVodList = pathname.startsWith("/admin/kursy/lista");
  const isCreatingCourse = pathname.startsWith("/admin/kursy/dodaj");
  const courseStep = isCreatingCourse
    ? Number(searchParams.get("step")) || 0
    : 0;

  // Kontekst konkretnego kursu: /admin/kursy/[slug] (z pominięciem dodaj/lista).
  let courseSlug: string | null = null;
  if (
    pathSegments[0] === "admin" &&
    pathSegments[1] === "kursy" &&
    pathSegments.length >= 3 &&
    !["dodaj", "lista"].includes(pathSegments[2])
  ) {
    courseSlug = pathSegments[2];
  }
  const isManagingCourse = !!courseSlug;

  // 3. AKORDEON — rozwinięta tylko sekcja, w której aktualnie jesteśmy.
  const activeSection: string | null = isInsideCampContext
    ? "wyjazdy"
    : pathname.startsWith("/admin/blog")
      ? "publikacje"
      : pathname.startsWith("/admin/kursy")
        ? "vod"
        : isInCrmSection
          ? "crm"
          : null;
  const [openSection, setOpenSection] = useState<string | null>(activeSection);
  // Wejście do nowej sekcji (zmiana trasy) → rozwijamy ją automatycznie.
  useEffect(() => {
    setOpenSection(activeSection);
  }, [activeSection]);
  const toggle = (key: string) =>
    setOpenSection((prev) => (prev === key ? null : key));

  // Kolejność/zestaw kroków zależy od formatu kursu (z ?format= w URL), spójnie
  // z kreatorem: „jeden film" pomija Program; „lekcje" mają Program PRZED Dane.
  const courseFormat =
    searchParams.get("format") === "single" ? "single" : "sections";
  const courseDraftId = searchParams.get("draft");
  const createCourseSteps =
    courseFormat === "single"
      ? [
          { name: "1. Start", icon: <Sparkle size={16} /> },
          { name: "2. Dane podst.", icon: <ListNumbers size={16} /> },
          { name: "3. Treść", icon: <PencilSimple size={16} /> },
          { name: "4. SEO", icon: <MagnifyingGlass size={16} /> },
          { name: "5. Podsumowanie", icon: <Article size={16} /> },
        ]
      : [
          { name: "1. Start", icon: <Sparkle size={16} /> },
          { name: "2. Program", icon: <TextT size={16} /> },
          { name: "3. Dane podst.", icon: <ListNumbers size={16} /> },
          { name: "4. Treść", icon: <PencilSimple size={16} /> },
          { name: "5. SEO", icon: <MagnifyingGlass size={16} /> },
          { name: "6. Podsumowanie", icon: <Article size={16} /> },
        ];

  // 3b. CRM sub-tabs
  const crmTabs = [
    {
      name: "Baza Kontaktów",
      href: "/admin/klienci",
      icon: <Users size={16} />,
      exact: true,
    },
    ...(FEATURES.mailingCampaigns
      ? [
          {
            name: "Kampanie",
            href: "/admin/klienci/kampanie",
            icon: <PaperPlaneTilt size={16} />,
            exact: false,
          },
        ]
      : []),
    ...(FEATURES.emailTemplates
      ? [
          {
            name: "Szablony Maili",
            href: "/admin/klienci/szablony-maili",
            icon: <Envelope size={16} />,
            exact: false,
          },
        ]
      : []),
  ];

  const createPostSteps = [
    {
      name: "1. Dane podst.",
      href: "/admin/blog/dodaj/dane-podstawowe",
      icon: <ListNumbers size={16} />,
      requiresId: false,
    },
    {
      name: "2. Edytor treści",
      href: "/admin/blog/dodaj/edytor-tresci",
      icon: <TextT size={16} />,
      requiresId: true,
    },
    {
      name: "3. SEO",
      href: "/admin/blog/dodaj/seo",
      icon: <MagnifyingGlass size={16} />,
      requiresId: true,
    },
  ];

  const createCampSteps = [
    {
      name: "1. Dane podst.",
      href: "/admin/wyjazdy/dodaj/dane-podstawowe",
      icon: <ListNumbers size={16} />,
      requiresId: false,
    },
    {
      name: "2. Edytor treści",
      href: "/admin/wyjazdy/dodaj/edytor-tresci",
      icon: <ImageIcon size={16} />,
      requiresId: true,
    },
    {
      name: "3. E-mail",
      href: "/admin/wyjazdy/dodaj/zaproszenia",
      icon: <Envelope size={16} />,
      requiresId: true,
    },
    {
      name: "4. SEO",
      href: "/admin/wyjazdy/dodaj/seo",
      icon: <MagnifyingGlass size={16} />,
      requiresId: true,
    },
    {
      name: "5. Podsumowanie",
      href: "/admin/wyjazdy/dodaj/podsumowanie",
      icon: <Article size={16} />,
      requiresId: true,
    },
  ];

  const manageCampSteps = actualTripId
    ? [
        {
          name: "Pulpit wyjazdu",
          href: `/admin/wyjazdy/${actualTripId}`,
          icon: <Info size={16} />,
          exact: true,
        },
        {
          name: "Uczestnicy",
          href: `/admin/wyjazdy/${actualTripId}/uczestnicy`,
          icon: <UserList size={16} />,
          exact: false,
        },
        {
          name: "Harmonogram",
          href: `/admin/wyjazdy/${actualTripId}/harmonogram`,
          icon: <CalendarBlank size={16} />,
          exact: false,
        },
        {
          name: "Sklep & SPA",
          href: `/admin/wyjazdy/${actualTripId}/sklep`,
          icon: <Sparkle size={16} />,
          exact: false,
        },
        {
          name: "Czat",
          href: `/admin/wyjazdy/${actualTripId}/chat`,
          icon: <ChatCircleDots size={16} />,
          exact: false,
        },
      ]
    : [];

  const manageCourseSteps = courseSlug
    ? [
        {
          name: "Przegląd",
          href: `/admin/kursy/${courseSlug}`,
          icon: <Info size={16} />,
          exact: true,
        },
        {
          name: "Uczestnicy",
          href: `/admin/kursy/${courseSlug}/uczestnicy`,
          icon: <Users size={16} />,
          exact: false,
        },
        {
          // Edycja danych, programu, nagrań i treści przez kreator (jak wyjazdy).
          name: "Edytuj kurs",
          href: `/admin/kursy/${courseSlug}/edytuj`,
          icon: <PencilSimple size={16} />,
          exact: false,
        },
      ]
    : [];

  // Pomocniczy render dla rozwijanego podmenu kroków (kreator / menu wyjazdu).
  const StepsBox = ({
    title,
    children,
  }: {
    title: string;
    children: React.ReactNode;
  }) => (
    <div className="mt-2 flex flex-col animate-in slide-in-from-top-2 duration-300 bg-brand-primary/5 rounded-2xl p-2 mx-1 border border-brand-primary/10">
      <span className="px-2 py-1.5 text-[10px] font-medium text-brand-primary uppercase tracking-wider mb-1">
        {title}
      </span>
      <div className="flex flex-col gap-0.5">{children}</div>
    </div>
  );

  return (
    <aside className="sticky top-0 left-0 h-screen w-[260px] z-40 hidden lg:flex flex-col bg-white/60 backdrop-blur-2xl border-r border-gray-100/50 shadow-[4px_0_24px_rgba(0,0,0,0.02)] overflow-hidden">
      {/* --- AKCENTY W TLE SIDEBARA --- */}
      <div className="absolute inset-0 pointer-events-none -z-10">
        <div className="absolute -top-32 -left-20 w-96 h-96 bg-brand-primary/15 rounded-full blur-[100px]" />
        <div className="absolute top-1/3 -right-20 w-80 h-80 bg-brand-yellow/20 rounded-full blur-[100px]" />
      </div>

      {/* LOGO */}
      <div className="relative z-10 flex items-center justify-center h-[72px] shrink-0 border-b border-brand-primary/5 mb-4">
        <Link href="/admin">
          <Image
            src="/logotypy/logo-primary.svg"
            alt="Logo"
            width={130}
            height={36}
            className="hover:opacity-80 transition-opacity"
          />
        </Link>
      </div>

      {/* NAWIGACJA */}
      <nav className="relative z-10 flex-1 flex flex-col gap-1 overflow-y-auto px-3 custom-scrollbar pb-6">
        {/* GŁÓWNY PANEL */}
        <div className="mb-2">
          <NavLink
            href="/admin"
            label="Główny panel"
            icon={SquaresFour}
            active={pathname === "/admin"}
          />
        </div>

        {/* WYJAZDY */}
        <Section
          title="Wyjazdy"
          icon={Suitcase}          open={openSection === "wyjazdy"}
          onToggle={() => toggle("wyjazdy")}
        >
          <NavLink
            href="/admin/wyjazdy"
            label="Panel"
            icon={ChartLineUp}
            active={isWyjazdyPanel}
          />

          {/* Wszystkie wyjazdy (+ menu konkretnego wyjazdu) */}
          <div className="flex flex-col mt-1">
            <NavLink
              href="/admin/wyjazdy/lista"
              label="Wszystkie wyjazdy"
              icon={Suitcase}
              active={isWyjazdyList || isManagingCamp}
            />
            {isManagingCamp && (
              <StepsBox title="Menu Wyjazdu">
                {manageCampSteps.map((step) => {
                  const baseHref = step.href.split("?")[0];
                  const isSubActive = step.exact
                    ? pathname === baseHref
                    : pathname.startsWith(baseHref);
                  const needsAttention =
                    chatUnreadLinks.has(baseHref) && !isSubActive;

                  return (
                    <Link key={step.name} href={step.href}>
                      <div
                        className={cn(
                          "flex items-center gap-2.5 px-3 py-2 rounded-[14px] transition-all duration-300 group relative overflow-hidden",
                          isSubActive
                            ? "bg-brand-primary text-white shadow-[0_4px_10px_-2px_rgba(40,125,136,0.25)]"
                            : "text-brand-secondary/60 hover:text-brand-secondary hover:bg-white/50",
                        )}
                      >
                        {isSubActive && (
                          <div className="absolute -bottom-3 -right-2 w-10 h-10 bg-brand-yellow/30 rounded-full blur-md pointer-events-none" />
                        )}
                        <div
                          className={cn(
                            "relative z-10 shrink-0 transition-colors",
                            isSubActive
                              ? "text-white"
                              : "text-brand-secondary/40 group-hover:text-brand-secondary/70",
                          )}
                        >
                          {step.icon}
                          {needsAttention && (
                            <AttentionDot className="absolute -top-1.5 -right-1.5 z-20" />
                          )}
                        </div>
                        <span className="relative z-10 text-[12.5px] font-medium tracking-wide">
                          {step.name}
                        </span>
                      </div>
                    </Link>
                  );
                })}
              </StepsBox>
            )}
          </div>

          {/* Kreator wyjazdów (+ kroki) */}
          <div className="flex flex-col mt-1">
            <NavLink
              href="/admin/wyjazdy/dodaj/dane-podstawowe"
              label="Kreator wyjazdów"
              icon={Sparkle}
              active={isCreatingCamp}
            />
            {isCreatingCamp && (
              <StepsBox title="Kreator wyjazdów">
                {createCampSteps.map((step) => {
                  const isSubActive = pathname === step.href;
                  const isDisabled = step.requiresId && !actualTripId;
                  const targetHref = actualTripId
                    ? `${step.href}?id=${actualTripId}`
                    : step.href;

                  if (isDisabled) {
                    return (
                      <div
                        key={step.name}
                        className="flex items-center gap-2.5 px-3 py-2 rounded-[14px] opacity-40 cursor-not-allowed"
                      >
                        <div className="text-brand-secondary/40 shrink-0">
                          {step.icon}
                        </div>
                        <span className="text-[12.5px] font-medium tracking-wide text-brand-secondary/60">
                          {step.name}
                        </span>
                      </div>
                    );
                  }

                  return (
                    <Link key={step.name} href={targetHref}>
                      <div
                        className={cn(
                          "flex items-center gap-2.5 px-3 py-2 rounded-[14px] transition-all duration-300 group relative overflow-hidden",
                          isSubActive
                            ? "bg-brand-primary text-white shadow-[0_4px_10px_-2px_rgba(40,125,136,0.25)]"
                            : "text-brand-secondary/60 hover:text-brand-secondary hover:bg-white/50",
                        )}
                      >
                        {isSubActive && (
                          <div className="absolute -bottom-3 -right-2 w-10 h-10 bg-brand-yellow/30 rounded-full blur-md pointer-events-none" />
                        )}
                        <div
                          className={cn(
                            "relative z-10 shrink-0 transition-colors",
                            isSubActive
                              ? "text-white"
                              : "text-brand-secondary/40 group-hover:text-brand-secondary/70",
                          )}
                        >
                          {step.icon}
                        </div>
                        <span className="relative z-10 text-[12.5px] font-medium tracking-wide">
                          {step.name}
                        </span>
                      </div>
                    </Link>
                  );
                })}
              </StepsBox>
            )}
          </div>
        </Section>

        {/* CRM — ukryte do czasu wdrożenia bazy klientów */}
        {FEATURES.customerBase && (
          <Section
            title="CRM"
            icon={Users}            open={openSection === "crm"}
            onToggle={() => toggle("crm")}
          >
            <NavLink
              href="/admin/klienci"
              label="Baza Klientów"
              icon={Users}
              active={isInCrmSection}
            />

            {/* CRM sub-tabs */}
            {isInCrmSection && crmTabs.length > 1 && (
              <StepsBox title="CRM">
                {crmTabs.map((tab) => {
                  // "Baza Kontaktów" jest aktywna tylko na dokładnej ścieżce,
                  // by nie podświetlać się na podstronach (kampanie/szablony).
                  const isSubActive = tab.exact
                    ? pathname === tab.href
                    : pathname.startsWith(tab.href);

                  return (
                    <Link key={tab.name} href={tab.href}>
                      <div
                        className={cn(
                          "flex items-center gap-2.5 px-3 py-2 rounded-[14px] transition-all duration-300 group relative overflow-hidden",
                          isSubActive
                            ? "bg-brand-primary text-white shadow-[0_4px_10px_-2px_rgba(40,125,136,0.25)]"
                            : "text-brand-secondary/60 hover:text-brand-secondary hover:bg-white/50",
                        )}
                      >
                        {isSubActive && (
                          <div className="absolute -bottom-3 -right-2 w-10 h-10 bg-brand-yellow/30 rounded-full blur-md pointer-events-none" />
                        )}
                        <div
                          className={cn(
                            "relative z-10 shrink-0 transition-colors",
                            isSubActive
                              ? "text-white"
                              : "text-brand-secondary/40 group-hover:text-brand-secondary/70",
                          )}
                        >
                          {tab.icon}
                        </div>
                        <span className="relative z-10 text-[12.5px] font-medium tracking-wide">
                          {tab.name}
                        </span>
                      </div>
                    </Link>
                  );
                })}
              </StepsBox>
            )}
          </Section>
        )}

        {/* PUBLIKACJE */}
        <Section
          title="Publikacje"
          icon={NewspaperClipping}          open={openSection === "publikacje"}
          onToggle={() => toggle("publikacje")}
        >
          <NavLink
            href="/admin/blog"
            label="Panel"
            icon={ChartLineUp}
            active={isBlogPanel}
          />

          <div className="flex flex-col mt-1">
            <NavLink
              href="/admin/blog/lista"
              label="Wszystkie wpisy"
              icon={NewspaperClipping}
              active={isBlogList}
            />
          </div>

          {/* Kreator wpisu (+ kroki) */}
          <div className="flex flex-col mt-1">
            <NavLink
              href="/admin/blog/dodaj/dane-podstawowe"
              label="Kreator wpisu"
              icon={Sparkle}
              active={isCreatingPost}
            />
            {isCreatingPost && (
              <StepsBox title="Kreator artykułu">
                {createPostSteps.map((step) => {
                  const isSubActive = pathname === step.href;
                  const isDisabled = step.requiresId && !queryId;
                  const targetHref = queryId
                    ? `${step.href}?id=${queryId}`
                    : step.href;

                  if (isDisabled) {
                    return (
                      <div
                        key={step.name}
                        className="flex items-center gap-2.5 px-3 py-2 rounded-[14px] opacity-40 cursor-not-allowed"
                      >
                        <div className="text-brand-secondary/40 shrink-0">
                          {step.icon}
                        </div>
                        <span className="text-[12.5px] font-medium tracking-wide text-brand-secondary/60">
                          {step.name}
                        </span>
                      </div>
                    );
                  }

                  return (
                    <Link key={step.name} href={targetHref}>
                      <div
                        className={cn(
                          "flex items-center gap-2.5 px-3 py-2 rounded-[14px] transition-all duration-300 group relative overflow-hidden",
                          isSubActive
                            ? "bg-brand-primary text-white shadow-[0_4px_10px_-2px_rgba(40,125,136,0.25)]"
                            : "text-brand-secondary/60 hover:text-brand-secondary hover:bg-white/50",
                        )}
                      >
                        {isSubActive && (
                          <div className="absolute -bottom-3 -right-2 w-10 h-10 bg-brand-yellow/30 rounded-full blur-md pointer-events-none" />
                        )}
                        <div
                          className={cn(
                            "relative z-10 shrink-0 transition-colors",
                            isSubActive
                              ? "text-white"
                              : "text-brand-secondary/40 group-hover:text-brand-secondary/70",
                          )}
                        >
                          {step.icon}
                        </div>
                        <span className="relative z-10 text-[12.5px] font-medium tracking-wide">
                          {step.name}
                        </span>
                      </div>
                    </Link>
                  );
                })}
              </StepsBox>
            )}
          </div>

          {/* Harmonogram */}
          <div className="flex flex-col mt-1">
            <NavLink
              href="/admin/blog/harmonogram"
              label="Harmonogram"
              icon={CalendarBlank}
              active={isBlogHarmonogram}
            />
          </div>
        </Section>

        {/* PLATFORMA VOD */}
        <Section
          title="Platforma VOD"
          icon={GraduationCap}          open={openSection === "vod"}
          onToggle={() => toggle("vod")}
        >
          <NavLink
            href="/admin/kursy"
            label="Panel"
            icon={ChartLineUp}
            active={isVodOverview}
          />

          <div className="flex flex-col mt-1">
            <NavLink
              href="/admin/kursy/lista"
              label="Wszystkie kursy"
              icon={GraduationCap}
              active={isVodList || isManagingCourse}
            />
            {isManagingCourse && (
              <StepsBox title="Menu kursu">
                {manageCourseSteps.map((step) => {
                  const isSubActive = step.exact
                    ? pathname === step.href
                    : pathname.startsWith(step.href);

                  return (
                    <Link key={step.name} href={step.href}>
                      <div
                        className={cn(
                          "flex items-center gap-2.5 px-3 py-2 rounded-[14px] transition-all duration-300 group relative overflow-hidden",
                          isSubActive
                            ? "bg-brand-primary text-white shadow-[0_4px_10px_-2px_rgba(40,125,136,0.25)]"
                            : "text-brand-secondary/60 hover:text-brand-secondary hover:bg-white/50",
                        )}
                      >
                        {isSubActive && (
                          <div className="absolute -bottom-3 -right-2 w-10 h-10 bg-brand-yellow/30 rounded-full blur-md pointer-events-none" />
                        )}
                        <div
                          className={cn(
                            "relative z-10 shrink-0 transition-colors",
                            isSubActive
                              ? "text-white"
                              : "text-brand-secondary/40 group-hover:text-brand-secondary/70",
                          )}
                        >
                          {step.icon}
                        </div>
                        <span className="relative z-10 text-[12.5px] font-medium tracking-wide">
                          {step.name}
                        </span>
                      </div>
                    </Link>
                  );
                })}
              </StepsBox>
            )}
          </div>

          {/* Kreator kursu (+ kroki) */}
          <div className="flex flex-col mt-1">
            <NavLink
              href="/admin/kursy/dodaj"
              label="Kreator kursu"
              icon={Sparkle}
              active={isCreatingCourse}
              onClick={(e) => {
                // „Kreator kursu" zaczyna NOWY kurs — czyścimy zapamiętany brief
                // (klucz BRIEF_STORAGE_KEY z CourseAiBriefModal). Gdy już jesteśmy
                // w kreatorze, wymuszamy świeży mount (autozapis trzyma courseId
                // w stanie, więc bez remountu zostałby kontekst poprzedniego kursu).
                try {
                  localStorage.removeItem("rehability:courseAiBrief");
                } catch {
                  /* ignore */
                }
                if (pathname.startsWith("/admin/kursy/dodaj")) {
                  e.preventDefault();
                  window.location.assign("/admin/kursy/dodaj");
                }
              }}
            />
            {isCreatingCourse && (
              <StepsBox title="Kreator kursu">
                {createCourseSteps.map((step, i) => {
                  const isSubActive = courseStep === i;
                  // Zachowaj format i ID szkicu, żeby klik w sidebarze nie zgubił
                  // kontekstu (inaczej kroki wróciłyby do układu „sections").
                  const href =
                    `/admin/kursy/dodaj?step=${i}&format=${courseFormat}` +
                    (courseDraftId ? `&draft=${courseDraftId}` : "");
                  return (
                    <Link key={step.name} href={href}>
                      <div
                        className={cn(
                          "flex items-center gap-2.5 px-3 py-2 rounded-[14px] transition-all duration-300 group relative overflow-hidden",
                          isSubActive
                            ? "bg-brand-primary text-white shadow-[0_4px_10px_-2px_rgba(40,125,136,0.25)]"
                            : "text-brand-secondary/60 hover:text-brand-secondary hover:bg-white/50",
                        )}
                      >
                        {isSubActive && (
                          <div className="absolute -bottom-3 -right-2 w-10 h-10 bg-brand-yellow/30 rounded-full blur-md pointer-events-none" />
                        )}
                        <div
                          className={cn(
                            "relative z-10 shrink-0 transition-colors",
                            isSubActive
                              ? "text-white"
                              : "text-brand-secondary/40 group-hover:text-brand-secondary/70",
                          )}
                        >
                          {step.icon}
                        </div>
                        <span className="relative z-10 text-[12.5px] font-medium tracking-wide">
                          {step.name}
                        </span>
                      </div>
                    </Link>
                  );
                })}
              </StepsBox>
            )}
          </div>
        </Section>
      </nav>

      {/* STOPKA (Wyloguj) */}
      <div className="relative z-10 p-4 border-t border-brand-primary/5 bg-white/30 shrink-0">
        <button
          onClick={() => signOut({ callbackUrl: "/logowanie" })}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-brand-secondary/60 hover:text-rose-600 hover:bg-white/50 transition-all w-full text-left cursor-pointer group"
        >
          <SignOut
            size={20}
            className="text-brand-secondary/40 group-hover:text-rose-500 transition-colors"
          />
          <span className="font-montserrat text-[13px] font-medium tracking-wide">
            Wyloguj się
          </span>
        </button>
      </div>
    </aside>
  );
}
