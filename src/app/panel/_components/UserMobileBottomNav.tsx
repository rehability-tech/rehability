"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence, type Variants } from "framer-motion";
import {
  SquaresFour,
  Suitcase,
  MonitorPlay,
  User,
  CalendarBlank,
  Heartbeat,
  ChatCircle,
  Storefront,
  House,
  Lock,
  DotsThree,
} from "@phosphor-icons/react/dist/ssr";
import { cn } from "@/lib/utils";
import { useChatUnreadLinks } from "@/hooks/useChatUnreadLinks";

type GlobalItem = {
  key: string;
  href: string;
  label: string;
  icon: typeof SquaresFour;
  disabled?: boolean;
};

// 1. GLOBALNA NAWIGACJA
const globalItems: GlobalItem[] = [
  { key: "hub", href: "/panel", label: "Start", icon: SquaresFour },
  { key: "campy", href: "/panel/wydarzenia", label: "Wydarzenia", icon: Suitcase },
  {
    key: "vod",
    href: "/panel/vod",
    label: "VOD",
    icon: MonitorPlay,
  },
  { key: "profil", href: "/panel/profil", label: "Profil", icon: User },
];

// Crossfade między widokami (global ↔ trip) — bez ruchu Y, żeby pasek nie skakał
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

// Spring dla morfowania aktywnej pigułki i layoutu itemów
const LAYOUT_SPRING = {
  type: "spring" as const,
  stiffness: 380,
  damping: 34,
  mass: 0.8,
};

type TripItem = {
  key: string;
  href: string;
  label: string;
  icon: typeof House;
  needsAttention?: boolean;
  wideOnly?: boolean;
};

export default function UserMobileBottomNav() {
  const pathname = usePathname();
  const [isMoreOpen, setIsMoreOpen] = useState(false);

  // MOCK: Akcja powiadomienia
  const hasPendingActionInTrips = true;

  // LOGIKA WYKRYWANIA KONTEKSTU WYDARZENIA
  const segments = pathname?.split("/") || [];
  const isTripContext =
    segments[1] === "panel" &&
    segments[2] === "wydarzenia" &&
    segments.length >= 4;
  const tripId = isTripContext ? segments[3] : null;

  // Karta zdrowia (HealthProfile) jest 1:1 z użytkowniczką — wystarczy jeden
  // globalny strzał. `null` = jeszcze nie wiemy (nie pokazujemy kropki).
  // Pobieramy tylko w kontekście wydarzenia, bo tam jest zakładka "Zdrowie".
  const [healthFilled, setHealthFilled] = useState<boolean | null>(null);
  useEffect(() => {
    if (!isTripContext) return;
    let active = true;
    fetch("/api/panel/health-profile", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (active && d) setHealthFilled(!!d.profile);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [pathname, isTripContext]);

  // Nieprzeczytane wiadomości czatu → pulsująca kropka na zakładce "Czat".
  const { links: chatUnreadLinks, refresh: refreshChatUnread } =
    useChatUnreadLinks();
  useEffect(() => {
    refreshChatUnread();
  }, [pathname, refreshChatUnread]);

  // Na chacie chowamy dolny pasek — czat jest pełnoekranowy ze strzałką wstecz.
  const isChatPage = pathname?.includes("/chat");

  // Itemy bara — Karta + Czat mają `wideOnly` (≥450px)
  const tripItems: TripItem[] = [
    {
      key: "trip-home",
      href: `/panel/wydarzenia/${tripId}`,
      label: "Panel",
      icon: House,
    },
    {
      key: "harmonogram",
      href: `/panel/wydarzenia/${tripId}/harmonogram`,
      label: "Plan",
      icon: CalendarBlank,
    },
    {
      key: "karta",
      href: `/panel/wydarzenia/${tripId}/karta-zdrowia`,
      label: "Zdrowie",
      icon: Heartbeat,
      // Kropka tylko, gdy karta NIE jest jeszcze uzupełniona.
      needsAttention: healthFilled === false,
      wideOnly: true,
    },
    {
      key: "chat",
      href: `/panel/wydarzenia/${tripId}/chat`,
      label: "Czat",
      icon: ChatCircle,
      needsAttention: chatUnreadLinks.has(`/panel/wydarzenia/${tripId}/chat`),
      wideOnly: true,
    },
    {
      key: "sklep",
      href: `/panel/wydarzenia/${tripId}/sklep`,
      label: "Sklep",
      icon: Storefront,
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

  // Click outside → zamknij dropup
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

  // Zamknij dropup gdy zmieni się route
  useEffect(() => {
    setIsMoreOpen(false);
  }, [pathname]);

  if (isChatPage) return null;

  return (
    <div
      className="fixed inset-x-0 z-50 md:hidden flex justify-center pointer-events-none px-4 max-[400px]:px-1"
      style={{ bottom: "max(1rem, env(safe-area-inset-bottom))" }}
    >
      <nav
        className={cn(
          "pointer-events-auto w-full max-w-[450px] relative p-2 rounded-[28px]",
          "shadow-[0_10px_40px_-15px_rgba(3,63,99,0.15)]",
        )}
      >
        {/* TŁO I POŚWIATA */}
        <div className="absolute inset-0 overflow-hidden rounded-[28px] -z-10 bg-white/70 backdrop-blur-3xl border border-white/60">
          <div className="absolute -bottom-8 -right-4 w-28 h-28 bg-brand-yellow/30 rounded-full blur-2xl" />
        </div>

        <div className="relative w-full h-11">
          <AnimatePresence mode="wait" initial={false}>
            {isTripContext ? (
              /* WIDOK 1: KONTEKST WYDARZENIA */
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
                      (
                        {
                          key,
                          href,
                          label,
                          icon: Icon,
                          needsAttention,
                          wideOnly,
                        },
                        idx,
                      ) => {
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
                                  layoutId="trip-pill"
                                  transition={LAYOUT_SPRING}
                                  className="absolute inset-0 bg-brand-primary rounded-full shadow-[0_4px_12px_-2px_rgba(40,125,136,0.3)] overflow-hidden"
                                >
                                  {/* ŻÓŁTA SFERA DO STEROWANIA EFEKTEM */}
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
                                  <span className="absolute -top-1 -right-1.5 flex h-2.5 w-2.5">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
                                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500 border-2 border-white" />
                                  </span>
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
                        aria-expanded={isMoreOpen}
                        aria-haspopup="menu"
                        aria-label="Więcej opcji"
                        className={cn(
                          "relative flex items-center justify-center gap-2 h-11 w-11 min-w-11 rounded-full overflow-hidden transition-colors",
                          isMoreActive || isMoreOpen
                            ? "text-white bg-brand-primary shadow-[0_4px_12px_-2px_rgba(40,125,136,0.3)]"
                            : "text-brand-secondary/40 hover:text-brand-primary",
                        )}
                      >
                        {(isMoreActive || isMoreOpen) && (
                          /* ŻÓŁTA SFERA DO STEROWANIA EFEKTEM */
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
                          <span className="absolute top-2 right-2 flex h-2.5 w-2.5 z-20">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
                            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500 border-2 border-white" />
                          </span>
                        )}
                      </button>
                    </motion.li>
                  </ul>
                </div>
              </motion.div>
            ) : (
              /* WIDOK 2: GLOBALNA NAWIGACJA (Start, Wydarzenia, VOD, Profil) */
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
                      (href === "/panel"
                        ? pathname === "/panel"
                        : pathname?.startsWith(href));
                    const needsAttention =
                      key === "campy" && hasPendingActionInTrips;

                    if (disabled) {
                      return (
                        <motion.li
                          key={key}
                          layout
                          transition={LAYOUT_SPRING}
                          className="shrink-0 list-none"
                        >
                          <div
                            aria-disabled="true"
                            title="Platforma VOD jest w budowie"
                            className="relative inline-flex items-center justify-center h-11 min-w-11 rounded-full text-brand-secondary/25 opacity-60 cursor-not-allowed select-none"
                          >
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
                              layoutId="global-pill"
                              transition={LAYOUT_SPRING}
                              className="absolute inset-0 bg-brand-primary rounded-full shadow-[0_4px_12px_-2px_rgba(40,125,136,0.3)] overflow-hidden"
                            >
                              {/* ŻÓŁTA SFERA DO STEROWANIA EFEKTEM */}
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
                            {needsAttention && !isActive && (
                              <span className="absolute -top-1 -right-1.5 flex h-2.5 w-2.5">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
                                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500 border-2 border-white" />
                              </span>
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
              {/* Mała żółta poświata w rogu — spójnie z resztą designu */}
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
                        /* ŻÓŁTA SFERA DO STEROWANIA EFEKTEM */
                        <div className="absolute -bottom-3 -right-2 w-10 h-10 bg-brand-yellow/30 rounded-full blur-md pointer-events-none" />
                      )}

                      <div className="relative flex items-center justify-center shrink-0">
                        <Icon
                          size={22}
                          weight={isActive ? "fill" : "regular"}
                          className="shrink-0 transition-colors duration-200"
                        />
                        {needsAttention && !isActive && (
                          <span className="absolute -top-1 -right-1.5 flex h-2.5 w-2.5 z-20">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
                            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500 border-2 border-white" />
                          </span>
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
