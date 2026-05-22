"use client";

import React, { useMemo } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  List,
  Users,
  QrCode,
  Bell,
  Article,
  CalendarBlank,
  MagnifyingGlass,
  SquaresFour,
  Tent,
} from "@phosphor-icons/react/dist/ssr";
import type { Icon } from "@phosphor-icons/react";

type NavItem = {
  key: string;
  label: string;
  href: string;
  icon: Icon;
  highlight?: boolean;
};

type NavContext = {
  id: "camps" | "blog" | "global";
  items: NavItem[];
};

function resolveContext(pathname: string): NavContext | null {
  if (pathname === "/admin") return null;

  if (pathname.startsWith("/admin/campy")) {
    return {
      id: "camps",
      items: [
        {
          key: "list",
          label: "Campy",
          href: "/admin/campy",
          icon: List,
        },
        {
          key: "participants",
          label: "Uczestniczki",
          href: "/admin/klientki",
          icon: Users,
        },
        {
          key: "scanner",
          label: "Skaner",
          href: "/admin/campy/skaner",
          icon: QrCode,
          highlight: true,
        },
        {
          key: "alerts",
          label: "Alerty",
          href: "/admin/campy?alerts=1",
          icon: Bell,
        },
      ],
    };
  }

  if (pathname.startsWith("/admin/blog")) {
    return {
      id: "blog",
      items: [
        {
          key: "articles",
          label: "Artykuły",
          href: "/admin/blog",
          icon: Article,
        },
        {
          key: "schedule",
          label: "Harmonogram",
          href: "/admin/blog/harmonogram",
          icon: CalendarBlank,
        },
        {
          key: "seo",
          label: "SEO",
          href: "/admin/blog/seo",
          icon: MagnifyingGlass,
          highlight: true,
        },
      ],
    };
  }

  return {
    id: "global",
    items: [
      { key: "hub", label: "Hub", href: "/admin", icon: SquaresFour },
      { key: "campy", label: "Campy", href: "/admin/campy", icon: Tent },
      { key: "blog", label: "Blog", href: "/admin/blog", icon: Article },
      {
        key: "klientki",
        label: "Klientki",
        href: "/admin/klientki",
        icon: Users,
      },
    ],
  };
}

function isItemActive(pathname: string, href: string) {
  const clean = href.split("?")[0];
  if (clean === "/admin") return pathname === "/admin";
  return pathname === clean || pathname.startsWith(`${clean}/`);
}

export default function AdminMobileBottomNav() {
  const pathname = usePathname();
  const context = useMemo(() => resolveContext(pathname), [pathname]);

  return (
    <AnimatePresence mode="wait">
      {context && (
        <motion.nav
          key={context.id}
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 80, opacity: 0 }}
          transition={{ type: "spring", stiffness: 320, damping: 32 }}
          className="fixed bottom-0 left-0 right-0 w-full z-50 lg:hidden bg-white/70 backdrop-blur-2xl border-t border-white/30 shadow-[0_-10px_40px_-12px_rgba(3,63,99,0.18)]"
          style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
        >
          {/* context label */}
          <div className="absolute -top-4 left-1/2 -translate-x-1/2">
            <motion.span
              key={`${context.id}-label`}
              initial={{ y: -6, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.05 }}
              className="text-[9px] uppercase tracking-[0.25em] font-bold text-brand-secondary bg-white/80 backdrop-blur-md border border-white/40 px-2.5 py-1 rounded-full shadow-[0_4px_14px_-6px_rgba(3,63,99,0.15)]"
            >
              {context.id === "camps"
                ? "Kontekst · Campy"
                : context.id === "blog"
                  ? "Kontekst · Blog"
                  : "Nawigacja"}
            </motion.span>
          </div>

          <motion.ul
            layout
            className="flex items-end justify-around h-[68px] px-3"
          >
            {context.items.map((item) => {
              const active = isItemActive(pathname, item.href);
              const Icon = item.icon;

              if (item.highlight) {
                return (
                  <li key={item.key} className="flex-1 flex justify-center">
                    <Link
                      href={item.href}
                      className="relative flex flex-col items-center"
                      aria-label={item.label}
                    >
                      <motion.span
                        layoutId="bottom-nav-highlight"
                        transition={{
                          type: "spring",
                          stiffness: 320,
                          damping: 28,
                        }}
                        className={`relative -top-5 flex items-center justify-center w-14 h-14 rounded-full text-white shadow-[0_14px_30px_-8px_rgba(40,125,136,0.7)] ring-4 ring-white/80 ${
                          active
                            ? "bg-gradient-to-br from-brand-primary to-brand-secondary"
                            : "bg-brand-primary"
                        }`}
                      >
                        <span className="absolute -inset-2 rounded-full bg-brand-primary/30 blur-xl -z-10" />
                        <Icon size={26} weight="fill" />
                      </motion.span>
                      <span
                        className={`text-[10px] font-bold mt-1 ${
                          active
                            ? "text-brand-primary"
                            : "text-brand-secondary/60"
                        }`}
                      >
                        {item.label}
                      </span>
                    </Link>
                  </li>
                );
              }

              return (
                <li key={item.key} className="flex-1">
                  <Link
                    href={item.href}
                    className="relative flex flex-col items-center justify-center gap-0.5 py-2"
                  >
                    <motion.span
                      layout
                      className={`flex items-center justify-center w-11 h-11 rounded-2xl transition ${
                        active
                          ? "bg-brand-primary text-white shadow-[0_10px_24px_-8px_rgba(40,125,136,0.55)]"
                          : "text-brand-secondary/55"
                      }`}
                    >
                      {active && (
                        <motion.span
                          layoutId="bottom-nav-active-halo"
                          className="absolute -inset-1 rounded-2xl bg-brand-primary/30 blur-xl -z-10"
                          transition={{
                            type: "spring",
                            stiffness: 320,
                            damping: 28,
                          }}
                        />
                      )}
                      <Icon
                        size={20}
                        weight={active ? "fill" : "duotone"}
                      />
                    </motion.span>
                    <span
                      className={`text-[10px] font-semibold tracking-wide ${
                        active ? "text-brand-primary" : "text-brand-secondary/55"
                      }`}
                    >
                      {item.label}
                    </span>
                  </Link>
                </li>
              );
            })}
          </motion.ul>
        </motion.nav>
      )}
    </AnimatePresence>
  );
}
