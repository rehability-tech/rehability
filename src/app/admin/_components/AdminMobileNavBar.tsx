"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence, type Variants } from "framer-motion";
import {
  SquaresFour,
  Suitcase,
  MonitorPlay,
  Article,
  CalendarBlank,
  Users,
  Storefront,
  ChatCircle,
  House,
  DotsThree,
  Lock,
  PlusCircle,
  PencilSimple,
  ChartLineUp,
  GraduationCap,
} from "@phosphor-icons/react/dist/ssr";
import { cn } from "@/lib/utils";
import { useChatUnreadLinks } from "@/hooks/useChatUnreadLinks";
import AttentionDot from "@/components/ui/AttentionDot";
import { getAdminTripId, getAdminCourseSlug } from "@/lib/admin/nav";

// Animacje przejść między widokami
const navVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: 0.18, ease: [0.22, 1, 0.36, 1] },
  },
  exit: {
    opacity: 0,
    transition: { duration: 0.12, ease: [0.22, 1, 0.36, 1] },
  },
};

const LAYOUT_SPRING = {
  type: "spring" as const,
  stiffness: 380,
  damping: 34,
  mass: 0.8,
};

type GlobalItem = {
  key: string;
  href: string;
  label: string;
  icon: typeof SquaresFour;
  disabled?: boolean;
};

type TripItem = {
  key: string;
  href: string;
  label: string;
  icon: typeof House;
  needsAttention?: boolean;
  wideOnly?: boolean;
};

// 1. GLOBALNA NAWIGACJA ADMINA
const globalItems: GlobalItem[] = [
  { key: "dashboard", href: "/admin", label: "Start", icon: SquaresFour },
  { key: "campy", href: "/admin/wydarzenia", label: "Wydarzenia", icon: Suitcase },
  { key: "blog", href: "/admin/blog", label: "Blog", icon: Article },
  {
    key: "vod",
    href: "/admin/kursy",
    label: "Kursy",
    icon: MonitorPlay,
  },
];

export default function AdminMobileNavBar() {
  const pathname = usePathname();
  const [isMoreOpen, setIsMoreOpen] = useState(false);

  // Nieprzeczytane wiadomości czatu → pulsująca kropka na zakładce "Czat".
  const { links: chatUnreadLinks, refresh: refreshChatUnread } =
    useChatUnreadLinks();
  useEffect(() => {
    refreshChatUnread();
  }, [pathname, refreshChatUnread]);

  // LOGIKA WYKRYWANIA KONTEKSTU WYDARZENIA
  // Wspólna z AdminSideBar (`src/lib/admin/nav.ts`) — sekcje typu /lista czy
  // /dodaj nie są ID wydarzenia, więc pasek nie wchodzi na nich w tryb
  // pojedynczego wydarzenia.
  const currentCampId = getAdminTripId(pathname);
  const isTripContext = !!currentCampId;

  // KONTEKST BLOGA — analogicznie do kontekstu wydarzenia (sub-menu sekcji bloga).
  const isBlogContext = pathname?.startsWith("/admin/blog") ?? false;

  const blogItems = [
    { key: "blog-list", href: "/admin/blog", label: "Wpisy", icon: Article },
    {
      key: "blog-schedule",
      href: "/admin/blog/harmonogram",
      label: "Harmonogram",
      icon: CalendarBlank,
    },
    {
      key: "blog-new",
      href: "/admin/blog/dodaj/dane-podstawowe",
      label: "Nowy",
      icon: PlusCircle,
      activePrefix: "/admin/blog/dodaj",
    },
  ];
  const isBlogItemActive = (item: (typeof blogItems)[number]) =>
    item.activePrefix
      ? pathname?.startsWith(item.activePrefix)
      : pathname === item.href;

  // KONTEKST KONKRETNEGO KURSU — sub-menu zsynchronizowane z AdminSideBar.
  const currentCourseSlug = getAdminCourseSlug(pathname);
  const isCourseContext = !!currentCourseSlug;

  const courseItems = [
    {
      key: "course-overview",
      href: `/admin/kursy/${currentCourseSlug}`,
      label: "Przegląd",
      icon: MonitorPlay,
      exact: true,
    },
    {
      key: "course-participants",
      href: `/admin/kursy/${currentCourseSlug}/uczestnicy`,
      label: "Uczestnicy",
      icon: Users,
      exact: false,
    },
    {
      // Edycja kursu przez kreator (dane, program, nagrania, treść) — jak wydarzenia.
      key: "course-edit",
      href: `/admin/kursy/${currentCourseSlug}/edytuj`,
      label: "Edytuj",
      icon: PencilSimple,
      exact: false,
    },
  ];
  const isCourseItemActive = (item: (typeof courseItems)[number]) =>
    item.exact ? pathname === item.href : pathname?.startsWith(item.href);

  // KONTEKST SEKCJI VOD (poziom sekcji, nie konkretnego kursu) — te same opcje
  // co w AdminSideBar: Panel / Wszystkie kursy / Kreator kursu. Konkretny kurs
  // ma pierwszeństwo (isCourseContext sprawdzany wcześniej), więc tu trafiają
  // tylko /admin/kursy, /admin/kursy/lista oraz /admin/kursy/dodaj.
  const isVodContext = pathname?.startsWith("/admin/kursy") ?? false;

  const vodItems = [
    {
      key: "vod-panel",
      href: "/admin/kursy",
      label: "Panel",
      icon: ChartLineUp,
      exact: true,
    },
    {
      key: "vod-list",
      href: "/admin/kursy/lista",
      label: "Kursy",
      icon: GraduationCap,
      exact: false,
    },
    {
      key: "vod-new",
      href: "/admin/kursy/dodaj",
      label: "Nowy",
      icon: PlusCircle,
      exact: false,
    },
  ];
  const isVodItemActive = (item: (typeof vodItems)[number]) =>
    item.exact ? pathname === item.href : pathname?.startsWith(item.href);

  // KONTEKST SEKCJI WYDARZEŃ (poziom sekcji, nie konkretnego wydarzenia) —
  // te same opcje co w AdminSideBar: Panel / Wszystkie wydarzenia / Kreator.
  // Konkretne wydarzenie ma pierwszeństwo (isTripContext sprawdzany wcześniej),
  // więc tu trafiają tylko /admin/wydarzenia, /lista i /dodaj.
  const isTripSectionContext =
    !isTripContext && (pathname?.startsWith("/admin/wydarzenia") ?? false);

  const tripSectionItems = [
    {
      key: "trips-panel",
      href: "/admin/wydarzenia",
      label: "Panel",
      icon: ChartLineUp,
      exact: true,
    },
    {
      key: "trips-list",
      href: "/admin/wydarzenia/lista",
      label: "Wydarzenia",
      icon: Suitcase,
      exact: false,
    },
    {
      key: "trips-new",
      href: "/admin/wydarzenia/dodaj/dane-podstawowe",
      label: "Nowe",
      icon: PlusCircle,
      exact: false,
      activePrefix: "/admin/wydarzenia/dodaj",
    },
  ];
  const isTripSectionItemActive = (item: (typeof tripSectionItems)[number]) => {
    const prefix = "activePrefix" in item ? item.activePrefix : undefined;
    if (prefix) return pathname?.startsWith(prefix);
    return item.exact ? pathname === item.href : pathname?.startsWith(item.href);
  };

  // 2. SUB-MENU DLA KONKRETNEGO WYDARZENIA — zsynchronizowane z AdminSideBar
  const tripItems: TripItem[] = [
    {
      key: "trip-home",
      href: `/admin/wydarzenia/${currentCampId}`,
      label: "Pulpit",
      icon: House,
    },
    {
      key: "uczestnicy",
      href: `/admin/wydarzenia/${currentCampId}/uczestnicy`,
      label: "Ludzie",
      icon: Users,
    },
    {
      key: "harmonogram",
      href: `/admin/wydarzenia/${currentCampId}/harmonogram`,
      label: "Plan",
      icon: CalendarBlank,
    },
    {
      key: "sklep",
      href: `/admin/wydarzenia/${currentCampId}/sklep`,
      label: "Sklep",
      icon: Storefront,
      wideOnly: true, // Ukryte pod "kebabem" na bardzo małych ekranach (<450px)
    },
    {
      key: "chat",
      href: `/admin/wydarzenia/${currentCampId}/chat`,
      label: "Czat",
      icon: ChatCircle,
      needsAttention: chatUnreadLinks.has(
        `/admin/wydarzenia/${currentCampId}/chat`,
      ),
      wideOnly: true, // Ukryte pod "kebabem" na bardzo małych ekranach (<450px)
    },
  ];

  const tripMoreItems = tripItems.filter((item) => item.wideOnly);
  const isMoreActive = tripMoreItems.some((item) =>
    pathname?.startsWith(item.href),
  );
  const moreNeedsAttention = tripMoreItems.some(
    (item) => item.needsAttention && !pathname?.startsWith(item.href),
  );

  const kebabBtnRef = useRef<HTMLButtonElement | null>(null);
  const dropupRef = useRef<HTMLDivElement | null>(null);

  // Zamykanie kebab-menu przy kliknięciu poza nim
  useEffect(() => {
    if (!isMoreOpen) return;
    const handlePointerDown = (e: PointerEvent) => {
      const target = e.target as Node;
      if (kebabBtnRef.current?.contains(target)) return;
      if (dropupRef.current?.contains(target)) return;
      setIsMoreOpen(false);
    };
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsMoreOpen(false);
    };
    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleEsc);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleEsc);
    };
  }, [isMoreOpen]);

  // Zamykanie kebab-menu przy zmianie ścieżki
  useEffect(() => {
    setIsMoreOpen(false);
  }, [pathname]);

  // Na chacie chowamy dolny pasek — czat jest pełnoekranowy ze strzałką wstecz.
  const isChatPage = pathname?.includes("/chat");
  if (isChatPage) return null;

  // W kreatorze/edytorze kursu dolny pasek zastępuje pływający pasek akcji
  // (AI + zapis) z własną strzałką „wstecz" — chowamy nawigację, żeby się nie
  // nakładały i żeby AI było dostępne na mobile.
  const isCourseCreator =
    pathname?.startsWith("/admin/kursy/dodaj") ||
    /\/admin\/kursy\/[^/]+\/edytuj/.test(pathname ?? "");
  if (isCourseCreator) return null;

  return (
    <div
      className="fixed inset-x-0 z-[100] md:hidden flex justify-center pointer-events-none px-4 max-[400px]:px-1"
      style={{ bottom: "max(1rem, env(safe-area-inset-bottom))" }}
    >
      <nav
        className={cn(
          "pointer-events-auto w-full max-w-[450px] relative p-2 rounded-[28px]",
          "shadow-[0_10px_40px_-15px_rgba(3,63,99,0.15)]",
        )}
      >
        {/* TŁO I POŚWIATA - FROSTED GLASS */}
        <div className="absolute inset-0 overflow-hidden rounded-[28px] -z-10 bg-white/70 backdrop-blur-3xl border border-white/60">
          <div className="absolute -bottom-8 -right-4 w-28 h-28 bg-brand-yellow/30 rounded-full blur-2xl" />
        </div>

        <div className="relative w-full h-11">
          {/* Bez mode="wait": widoki przenikają się (cross-fade), a wspólny
              layoutId pigułki ("admin-nav-pill") sprawia, że aktywny wskaźnik
              płynnie przejeżdża między pozycjami zamiast znikać i pojawiać się. */}
          <AnimatePresence initial={false}>
            {isBlogContext ? (
              /* WIDOK 0: KONTEKST BLOGA (Wpisy, Harmonogram, Nowy) */
              <motion.ul
                key="blog-nav"
                variants={navVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="absolute inset-0 flex items-center justify-between w-full h-full gap-1.5"
              >
                {blogItems.map(({ key, href, label, icon: Icon, ...rest }) => {
                  const isActive = isBlogItemActive({
                    key,
                    href,
                    label,
                    icon: Icon,
                    ...rest,
                  });
                  return (
                    <motion.li
                      key={key}
                      layout
                      transition={LAYOUT_SPRING}
                      className={cn("list-none shrink-0", isActive && "flex-grow")}
                    >
                      <Link
                        href={href}
                        className={cn(
                          "relative flex items-center justify-center gap-2 h-11 min-w-11 rounded-full",
                          isActive
                            ? "w-full px-4 text-white"
                            : "text-brand-secondary/40 hover:text-brand-primary",
                        )}
                      >
                        {isActive && (
                          <motion.div
                            layoutId="admin-nav-pill"
                            transition={LAYOUT_SPRING}
                            className="absolute inset-0 bg-brand-primary rounded-full shadow-[0_4px_12px_-2px_rgba(40,125,136,0.3)] overflow-hidden"
                          >
                            <div className="absolute -bottom-3 -right-2 w-10 h-10 bg-brand-yellow/30 rounded-full blur-md" />
                          </motion.div>
                        )}
                        <motion.div
                          layout="position"
                          transition={LAYOUT_SPRING}
                          className="relative flex items-center justify-center z-10"
                        >
                          <Icon
                            size={22}
                            weight={isActive ? "fill" : "regular"}
                            className="shrink-0 transition-colors duration-200"
                          />
                        </motion.div>
                        <AnimatePresence initial={false} mode="popLayout">
                          {isActive && (
                            <motion.span
                              key="label"
                              layout="position"
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              exit={{ opacity: 0 }}
                              transition={{
                                duration: 0.18,
                                ease: [0.22, 1, 0.36, 1],
                              }}
                              className="relative z-10 font-montserrat text-[13px] font-semibold tracking-wide whitespace-nowrap"
                            >
                              {label}
                            </motion.span>
                          )}
                        </AnimatePresence>
                      </Link>
                    </motion.li>
                  );
                })}
              </motion.ul>
            ) : isTripContext ? (
              /* WIDOK 1: KONTEKST KONKRETNEGO WYDARZENIA */
              <motion.div
                key="trip-nav"
                variants={navVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="absolute inset-0 flex items-center justify-between w-full h-full"
              >
                <div className="flex items-center justify-between gap-1.5 w-full max-w-full">
                  {/* Powrót do listy wydarzeń jest teraz w topbarze (ikona back). */}
                  {/* Scrollowane menu wydarzenia */}
                  <ul
                    className={cn(
                      "flex flex-1 items-center justify-start gap-1.5 overflow-x-auto scroll-smooth relative transition-all duration-300",
                      "[-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
                      isMoreActive || isMoreOpen
                        ? "justify-between"
                        : "justify-start",
                    )}
                  >
                    {tripItems.map(
                      ({
                        key,
                        href,
                        label,
                        icon: Icon,
                        needsAttention,
                        wideOnly,
                      }) => {
                        const isActive =
                          key === "trip-home"
                            ? pathname === href
                            : pathname?.startsWith(href);

                        return (
                          <motion.li
                            key={key}
                            layout
                            transition={LAYOUT_SPRING}
                            className={cn(
                              "list-none shrink-0",
                              wideOnly && "hidden min-[450px]:flex",
                              isActive && "flex-grow",
                            )}
                          >
                            <Link
                              href={href}
                              className={cn(
                                "relative flex items-center justify-center gap-2 h-11 min-w-11 rounded-full",
                                isActive
                                  ? "w-full px-4 text-white"
                                  : "text-brand-secondary/40 hover:text-brand-primary",
                              )}
                            >
                              {isActive && (
                                <motion.div
                                  layoutId="admin-nav-pill"
                                  transition={LAYOUT_SPRING}
                                  className="absolute inset-0 bg-brand-primary rounded-full shadow-[0_4px_12px_-2px_rgba(40,125,136,0.3)] overflow-hidden"
                                >
                                  {/* ŻÓŁTA SFERA W AKTYWNYM ELEMENTU */}
                                  <div className="absolute -bottom-3 -right-2 w-10 h-10 bg-brand-yellow/30 rounded-full blur-md" />
                                </motion.div>
                              )}
                              <motion.div
                                layout="position"
                                transition={LAYOUT_SPRING}
                                className="relative flex items-center justify-center z-10"
                              >
                                <Icon
                                  size={22}
                                  weight={isActive ? "fill" : "regular"}
                                  className="shrink-0 transition-colors duration-200"
                                />
                                {needsAttention && !isActive && (
                                  <AttentionDot className="absolute -top-1 -right-1.5" />
                                )}
                              </motion.div>
                              <AnimatePresence initial={false} mode="popLayout">
                                {isActive && (
                                  <motion.span
                                    key="label"
                                    layout="position"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    transition={{
                                      duration: 0.18,
                                      ease: [0.22, 1, 0.36, 1],
                                    }}
                                    className="relative z-10 font-montserrat text-[13px] font-semibold tracking-wide whitespace-nowrap"
                                  >
                                    {label}
                                  </motion.span>
                                )}
                              </AnimatePresence>
                            </Link>
                          </motion.li>
                        );
                      },
                    )}

                    {/* KEBAB BUTTON NA SAMYM KOŃCU (< 450px) */}
                    <motion.li
                      key="__kebab__"
                      layout
                      transition={LAYOUT_SPRING}
                      className="list-none shrink-0 min-[450px]:hidden"
                    >
                      <button
                        ref={kebabBtnRef}
                        type="button"
                        onClick={() => setIsMoreOpen((v) => !v)}
                        className={cn(
                          "relative flex items-center justify-center gap-2 h-11 w-11 min-w-11 rounded-full overflow-hidden transition-colors",
                          isMoreActive || isMoreOpen
                            ? "text-white bg-brand-primary shadow-[0_4px_12px_-2px_rgba(40,125,136,0.3)]"
                            : "text-brand-secondary/40 hover:text-brand-primary",
                        )}
                      >
                        {(isMoreActive || isMoreOpen) && (
                          <div className="absolute -bottom-3 -right-2 w-10 h-10 bg-brand-yellow/30 rounded-full blur-md pointer-events-none" />
                        )}
                        <motion.span
                          animate={{ rotate: isMoreOpen ? 90 : 0 }}
                          transition={LAYOUT_SPRING}
                          className="relative z-10 flex items-center justify-center"
                        >
                          <DotsThree
                            size={24}
                            weight="bold"
                            className="shrink-0"
                          />
                        </motion.span>
                        {moreNeedsAttention && !isMoreActive && !isMoreOpen && (
                          <AttentionDot className="absolute top-2 right-2 z-20" />
                        )}
                      </button>
                    </motion.li>
                  </ul>
                </div>
              </motion.div>
            ) : isCourseContext ? (
              /* WIDOK 1b: KONTEKST KONKRETNEGO KURSU (Przegląd, Treść, Info) */
              <motion.ul
                key="course-nav"
                variants={navVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="absolute inset-0 flex items-center justify-between w-full h-full gap-1.5"
              >
                {courseItems.map(({ key, href, label, icon: Icon }) => {
                  const isActive = isCourseItemActive({
                    key,
                    href,
                    label,
                    icon: Icon,
                    exact: key === "course-overview",
                  });
                  return (
                    <motion.li
                      key={key}
                      layout
                      transition={LAYOUT_SPRING}
                      className={cn("list-none shrink-0", isActive && "flex-grow")}
                    >
                      <Link
                        href={href}
                        className={cn(
                          "relative flex items-center justify-center gap-2 h-11 min-w-11 rounded-full",
                          isActive
                            ? "w-full px-4 text-white"
                            : "text-brand-secondary/40 hover:text-brand-primary",
                        )}
                      >
                        {isActive && (
                          <motion.div
                            layoutId="admin-nav-pill"
                            transition={LAYOUT_SPRING}
                            className="absolute inset-0 bg-brand-primary rounded-full shadow-[0_4px_12px_-2px_rgba(40,125,136,0.3)] overflow-hidden"
                          >
                            <div className="absolute -bottom-3 -right-2 w-10 h-10 bg-brand-yellow/30 rounded-full blur-md" />
                          </motion.div>
                        )}
                        <motion.div
                          layout="position"
                          transition={LAYOUT_SPRING}
                          className="relative flex items-center justify-center z-10"
                        >
                          <Icon
                            size={22}
                            weight={isActive ? "fill" : "regular"}
                            className="shrink-0 transition-colors duration-200"
                          />
                        </motion.div>
                        <AnimatePresence initial={false} mode="popLayout">
                          {isActive && (
                            <motion.span
                              key="label"
                              layout="position"
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              exit={{ opacity: 0 }}
                              transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
                              className="relative z-10 font-montserrat text-[13px] font-semibold tracking-wide whitespace-nowrap"
                            >
                              {label}
                            </motion.span>
                          )}
                        </AnimatePresence>
                      </Link>
                    </motion.li>
                  );
                })}
              </motion.ul>
            ) : isVodContext ? (
              /* WIDOK 1c: KONTEKST SEKCJI VOD (Panel, Wszystkie kursy, Kreator) */
              <motion.ul
                key="vod-nav"
                variants={navVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="absolute inset-0 flex items-center justify-between w-full h-full gap-1.5"
              >
                {vodItems.map(({ key, href, label, icon: Icon, ...rest }) => {
                  const isActive = isVodItemActive({
                    key,
                    href,
                    label,
                    icon: Icon,
                    ...rest,
                  });
                  return (
                    <motion.li
                      key={key}
                      layout
                      transition={LAYOUT_SPRING}
                      className={cn("list-none shrink-0", isActive && "flex-grow")}
                    >
                      <Link
                        href={href}
                        className={cn(
                          "relative flex items-center justify-center gap-2 h-11 min-w-11 rounded-full",
                          isActive
                            ? "w-full px-4 text-white"
                            : "text-brand-secondary/40 hover:text-brand-primary",
                        )}
                      >
                        {isActive && (
                          <motion.div
                            layoutId="admin-nav-pill"
                            transition={LAYOUT_SPRING}
                            className="absolute inset-0 bg-brand-primary rounded-full shadow-[0_4px_12px_-2px_rgba(40,125,136,0.3)] overflow-hidden"
                          >
                            <div className="absolute -bottom-3 -right-2 w-10 h-10 bg-brand-yellow/30 rounded-full blur-md" />
                          </motion.div>
                        )}
                        <motion.div
                          layout="position"
                          transition={LAYOUT_SPRING}
                          className="relative flex items-center justify-center z-10"
                        >
                          <Icon
                            size={22}
                            weight={isActive ? "fill" : "regular"}
                            className="shrink-0 transition-colors duration-200"
                          />
                        </motion.div>
                        <AnimatePresence initial={false} mode="popLayout">
                          {isActive && (
                            <motion.span
                              key="label"
                              layout="position"
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              exit={{ opacity: 0 }}
                              transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
                              className="relative z-10 font-montserrat text-[13px] font-semibold tracking-wide whitespace-nowrap"
                            >
                              {label}
                            </motion.span>
                          )}
                        </AnimatePresence>
                      </Link>
                    </motion.li>
                  );
                })}
              </motion.ul>
            ) : isTripSectionContext ? (
              /* WIDOK 1d: KONTEKST SEKCJI WYDARZEŃ (Panel, Wydarzenia, Nowe) */
              <motion.ul
                key="trips-nav"
                variants={navVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="absolute inset-0 flex items-center justify-between w-full h-full gap-1.5"
              >
                {tripSectionItems.map(({ key, href, label, icon: Icon, ...rest }) => {
                  const isActive = isTripSectionItemActive({
                    key,
                    href,
                    label,
                    icon: Icon,
                    ...rest,
                  } as (typeof tripSectionItems)[number]);
                  return (
                    <motion.li
                      key={key}
                      layout
                      transition={LAYOUT_SPRING}
                      className={cn("list-none shrink-0", isActive && "flex-grow")}
                    >
                      <Link
                        href={href}
                        className={cn(
                          "relative flex items-center justify-center gap-2 h-11 min-w-11 rounded-full",
                          isActive
                            ? "w-full px-4 text-white"
                            : "text-brand-secondary/40 hover:text-brand-primary",
                        )}
                      >
                        {isActive && (
                          <motion.div
                            layoutId="admin-nav-pill"
                            transition={LAYOUT_SPRING}
                            className="absolute inset-0 bg-brand-primary rounded-full shadow-[0_4px_12px_-2px_rgba(40,125,136,0.3)] overflow-hidden"
                          >
                            <div className="absolute -bottom-3 -right-2 w-10 h-10 bg-brand-yellow/30 rounded-full blur-md" />
                          </motion.div>
                        )}
                        <motion.div
                          layout="position"
                          transition={LAYOUT_SPRING}
                          className="relative flex items-center justify-center z-10"
                        >
                          <Icon
                            size={22}
                            weight={isActive ? "fill" : "regular"}
                            className="shrink-0 transition-colors duration-200"
                          />
                        </motion.div>
                        <AnimatePresence initial={false} mode="popLayout">
                          {isActive && (
                            <motion.span
                              key="label"
                              layout="position"
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              exit={{ opacity: 0 }}
                              transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
                              className="relative z-10 font-montserrat text-[13px] font-semibold tracking-wide whitespace-nowrap"
                            >
                              {label}
                            </motion.span>
                          )}
                        </AnimatePresence>
                      </Link>
                    </motion.li>
                  );
                })}
              </motion.ul>
            ) : (
              /* WIDOK 2: GLOBALNA NAWIGACJA ADMINA (Start, Wydarzenia, Blog, VOD) */
              <motion.ul
                key="global-nav"
                variants={navVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="absolute inset-0 flex items-center justify-between w-full h-full gap-1.5"
              >
                {globalItems.map(
                  ({ key, href, label, icon: Icon, disabled }) => {
                    const isActive =
                      !disabled &&
                      (href === "/admin"
                        ? pathname === "/admin"
                        : pathname?.startsWith(href));

                    if (disabled) {
                      return (
                        <motion.li
                          key={key}
                          layout
                          transition={LAYOUT_SPRING}
                          className="shrink-0 list-none"
                        >
                          <div className="relative inline-flex items-center justify-center h-11 min-w-11 rounded-full text-brand-secondary/25 opacity-60 cursor-not-allowed select-none">
                            <Icon
                              size={22}
                              weight="regular"
                              className="shrink-0"
                            />
                            <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-brand-secondary/80 flex items-center justify-center shadow-[0_2px_6px_0px_rgba(3,63,99,0.3)]">
                              <Lock
                                size={9}
                                weight="fill"
                                className="text-white"
                              />
                            </span>
                          </div>
                        </motion.li>
                      );
                    }

                    return (
                      <motion.li
                        key={key}
                        layout
                        transition={LAYOUT_SPRING}
                        className={cn(
                          "list-none shrink-0",
                          isActive && "flex-grow",
                        )}
                      >
                        <Link
                          href={href}
                          className={cn(
                            "relative flex items-center justify-center gap-2 h-11 min-w-11 rounded-full",
                            isActive
                              ? "w-full px-4 text-white"
                              : "text-brand-secondary/40 hover:text-brand-primary",
                          )}
                        >
                          {isActive && (
                            <motion.div
                              layoutId="admin-nav-pill"
                              transition={LAYOUT_SPRING}
                              className="absolute inset-0 bg-brand-primary rounded-full shadow-[0_4px_12px_-2px_rgba(40,125,136,0.3)] overflow-hidden"
                            >
                              <div className="absolute -bottom-3 -right-2 w-10 h-10 bg-brand-yellow/30 rounded-full blur-md" />
                            </motion.div>
                          )}
                          <motion.div
                            layout="position"
                            transition={LAYOUT_SPRING}
                            className="relative flex items-center justify-center z-10"
                          >
                            <Icon
                              size={22}
                              weight={isActive ? "fill" : "regular"}
                              className={cn(
                                "shrink-0 transition-colors duration-200",
                                isActive ? "text-white" : "",
                              )}
                            />
                          </motion.div>
                          <AnimatePresence initial={false} mode="popLayout">
                            {isActive && (
                              <motion.span
                                key="label"
                                layout="position"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                transition={{
                                  duration: 0.18,
                                  ease: [0.22, 1, 0.36, 1],
                                }}
                                className="relative z-10 font-montserrat text-[13px] font-semibold tracking-wide whitespace-nowrap"
                              >
                                {label}
                              </motion.span>
                            )}
                          </AnimatePresence>
                        </Link>
                      </motion.li>
                    );
                  },
                )}
              </motion.ul>
            )}
          </AnimatePresence>
        </div>

        {/* DROPUP WE FROSTED GLASS — schowane itemy na ekranach <450px */}
        <AnimatePresence>
          {isTripContext && isMoreOpen && (
            <motion.div
              ref={dropupRef}
              key="more-dropup"
              role="menu"
              initial={{ opacity: 0, y: 8, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 6, scale: 0.97 }}
              transition={{
                type: "spring",
                stiffness: 380,
                damping: 30,
                mass: 0.8,
              }}
              className="absolute bottom-[calc(100%+12px)] right-0 min-w-[220px] origin-bottom-right rounded-3xl rounded-br-none bg-white/80 backdrop-blur-2xl border border-white/60 shadow-[0_20px_50px_-15px_rgba(3,63,99,0.3)] p-2 flex flex-col gap-1 min-[450px]:hidden overflow-hidden"
            >
              <div className="pointer-events-none absolute -top-3 -right-3 w-16 h-16 bg-brand-yellow/30 rounded-full blur-2xl" />

              {tripMoreItems.map(
                ({ key, href, label, icon: Icon, needsAttention }) => {
                  const isActive = pathname?.startsWith(href);
                  return (
                    <Link
                      key={key}
                      href={href}
                      onClick={() => setIsMoreOpen(false)}
                      role="menuitem"
                      className={cn(
                        "relative flex items-center justify-start gap-2.5 h-11 px-4 rounded-full overflow-hidden transition-all duration-300 w-full",
                        isActive
                          ? "bg-brand-primary text-white shadow-[0_4px_12px_-2px_rgba(40,125,136,0.3)]"
                          : "text-brand-secondary/60 hover:text-brand-primary hover:bg-white/60",
                      )}
                    >
                      {isActive && (
                        <div className="absolute -bottom-3 -right-2 w-10 h-10 bg-brand-yellow/30 rounded-full blur-md pointer-events-none" />
                      )}
                      <div className="relative flex items-center justify-center shrink-0">
                        <Icon
                          size={22}
                          weight={isActive ? "fill" : "regular"}
                          className="shrink-0 transition-colors duration-200"
                        />
                        {needsAttention && !isActive && (
                          <AttentionDot className="absolute -top-1 -right-1.5 z-20" />
                        )}
                      </div>
                      <span className="relative z-10 font-montserrat text-[13px] font-semibold tracking-wide whitespace-nowrap">
                        {label}
                      </span>
                    </Link>
                  );
                },
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </nav>
    </div>
  );
}
