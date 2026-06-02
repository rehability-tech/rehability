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
} from "@phosphor-icons/react/dist/ssr";
import { cn } from "@/lib/utils";

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
  wideOnly?: boolean;
};

// 1. GLOBALNA NAWIGACJA ADMINA
const globalItems: GlobalItem[] = [
  { key: "dashboard", href: "/admin", label: "Start", icon: SquaresFour },
  { key: "campy", href: "/admin/wyjazdy", label: "Wyjazdy", icon: Suitcase },
  { key: "blog", href: "/admin/blog", label: "Blog", icon: Article },
  {
    key: "vod",
    href: "/admin/vod",
    label: "VOD",
    icon: MonitorPlay,
    disabled: true,
  },
];

export default function AdminMobileNavBar() {
  const pathname = usePathname();
  const [isMoreOpen, setIsMoreOpen] = useState(false);

  // LOGIKA WYKRYWANIA KONTEKSTU WYJAZDU
  // Sprawdzamy, czy jesteśmy w /admin/wyjazdy/[id] (ale omijamy /admin/wyjazdy/nowy)
  const campIdMatch = pathname?.match(/\/admin\/wyjazdy\/([a-zA-Z0-9_-]+)/);
  const currentCampId =
    campIdMatch && campIdMatch[1] !== "nowy" ? campIdMatch[1] : null;
  const isTripContext = !!currentCampId;

  // 2. SUB-MENU DLA KONKRETNEGO WYJAZDU — zsynchronizowane z AdminSideBar
  const tripItems: TripItem[] = [
    {
      key: "trip-home",
      href: `/admin/wyjazdy/${currentCampId}`,
      label: "Pulpit",
      icon: House,
    },
    {
      key: "uczestnicy",
      href: `/admin/wyjazdy/${currentCampId}/uczestnicy`,
      label: "Ludzie",
      icon: Users,
    },
    {
      key: "harmonogram",
      href: `/admin/wyjazdy/${currentCampId}/harmonogram`,
      label: "Plan",
      icon: CalendarBlank,
    },
    {
      key: "sklep",
      href: `/admin/wyjazdy/${currentCampId}/sklep`,
      label: "Sklep",
      icon: Storefront,
      wideOnly: true, // Ukryte pod "kebabem" na bardzo małych ekranach (<450px)
    },
    {
      key: "chat",
      href: `/admin/wyjazdy/${currentCampId}/chat`,
      label: "Czat",
      icon: ChatCircle,
      wideOnly: true, // Ukryte pod "kebabem" na bardzo małych ekranach (<450px)
    },
  ];

  const tripMoreItems = tripItems.filter((item) => item.wideOnly);
  const isMoreActive = tripMoreItems.some((item) =>
    pathname?.startsWith(item.href),
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
          <AnimatePresence mode="wait" initial={false}>
            {isTripContext ? (
              /* WIDOK 1: KONTEKST KONKRETNEGO WYJAZDU */
              <motion.div
                key="trip-nav"
                variants={navVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="absolute inset-0 flex items-center justify-between w-full h-full"
              >
                <div className="flex items-center justify-between gap-1.5 w-full max-w-full">
                  {/* Powrót do listy wyjazdów jest teraz w topbarze (ikona back). */}
                  {/* Scrollowane menu wyjazdu */}
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
                      ({ key, href, label, icon: Icon, wideOnly }) => {
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
                                  layoutId="admin-trip-pill"
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
                      </button>
                    </motion.li>
                  </ul>
                </div>
              </motion.div>
            ) : (
              /* WIDOK 2: GLOBALNA NAWIGACJA ADMINA (Start, Wyjazdy, Blog, VOD) */
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
                              layoutId="admin-global-pill"
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

              {tripMoreItems.map(({ key, href, label, icon: Icon }) => {
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
                    </div>
                    <span className="relative z-10 font-montserrat text-[13px] font-semibold tracking-wide whitespace-nowrap">
                      {label}
                    </span>
                  </Link>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>
      </nav>
    </div>
  );
}
