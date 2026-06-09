"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
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
} from "@phosphor-icons/react/dist/ssr";
import { cn } from "@/lib/utils";

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
    !["dodaj", "edycja", "platnosci", "live", "uczestniczki"].includes(
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
  const isCreatingPost = pathname.startsWith("/admin/blog/dodaj");
  const isInCrmSection = pathname.startsWith("/admin/klienci");

  // 3b. CRM sub-tabs (szablony maili ukryte do czasu wdrożenia feature'u)
  const crmTabs = [
    {
      name: "Baza Klientów",
      href: "/admin/klienci",
      icon: <Users size={16} />,
      exact: true,
    },
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

  // 3. DEFINICJE MENU
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
        {/* DASHBOARD */}
        <div className="mb-2 flex flex-col">
          <Link href="/admin">
            <div
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-300 group relative overflow-hidden",
                pathname === "/admin"
                  ? "bg-brand-primary text-white shadow-[0_4px_12px_-2px_rgba(40,125,136,0.25)]"
                  : "text-brand-secondary/60 hover:bg-white/40 hover:text-brand-secondary",
              )}
            >
              {pathname === "/admin" && (
                <div className="absolute -bottom-4 -right-3 w-14 h-14 bg-brand-yellow/30 rounded-full blur-lg pointer-events-none" />
              )}
              <SquaresFour
                size={20}
                weight={pathname === "/admin" ? "fill" : "duotone"}
                className={cn(
                  "relative z-10 transition-colors",
                  pathname === "/admin"
                    ? "text-white"
                    : "text-brand-secondary/40 group-hover:text-brand-secondary/70",
                )}
              />
              <span className="font-montserrat text-[13px] font-medium tracking-wide relative z-10">
                Dashboard
              </span>
            </div>
          </Link>
        </div>

        {/* SYSTEM CAMPÓW */}
        <div className="flex flex-col mt-2">
          <span className="px-4 text-[10px] uppercase tracking-[0.2em] text-brand-secondary/40 font-medium mb-2">
            Zarządzanie
          </span>

          <Link href="/admin/wyjazdy">
            <div
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-300 group relative overflow-hidden",
                pathname === "/admin/wyjazdy"
                  ? "bg-brand-primary text-white shadow-[0_4px_12px_-2px_rgba(40,125,136,0.25)]"
                  : "text-brand-secondary/60 hover:bg-white/40 hover:text-brand-secondary",
              )}
            >
              {pathname === "/admin/wyjazdy" && (
                <div className="absolute -bottom-4 -right-3 w-14 h-14 bg-brand-yellow/30 rounded-full blur-lg pointer-events-none" />
              )}
              <Suitcase
                size={20}
                weight={pathname === "/admin/wyjazdy" ? "fill" : "duotone"}
                className={cn(
                  "relative z-10 transition-colors",
                  pathname === "/admin/wyjazdy"
                    ? "text-white"
                    : "text-brand-secondary/40 group-hover:text-brand-secondary/70",
                )}
              />
              <span className="font-montserrat text-[13px] font-medium tracking-wide relative z-10">
                Wszystkie Wyjazdy
              </span>
            </div>
          </Link>

          {/* KREATOR CAMPÓW (STEPS) */}
          {isCreatingCamp && (
            <div className="mt-2 flex flex-col animate-in slide-in-from-top-2 duration-300 bg-brand-primary/5 rounded-2xl p-2 mx-1 border border-brand-primary/10">
              <span className="px-2 py-1.5 text-[10px] font-medium text-brand-primary uppercase tracking-wider mb-1">
                Kreator wyjazdów
              </span>
              <div className="flex flex-col gap-0.5">
                {createCampSteps.map((step) => {
                  const isSubActive = pathname === step.href;
                  const isDisabled = step.requiresId && !actualTripId;
                  const targetHref = actualTripId
                    ? `${step.href}?id=${actualTripId}`
                    : step.href;

                  if (isDisabled) {
                    return (
                      <div key={step.name} className="flex items-center gap-2.5 px-3 py-2 rounded-[14px] opacity-40 cursor-not-allowed">
                        <div className="text-brand-secondary/40 shrink-0">{step.icon}</div>
                        <span className="text-[12.5px] font-medium tracking-wide text-brand-secondary/60">{step.name}</span>
                      </div>
                    );
                  }

                  return (
                    <Link key={step.name} href={targetHref}>
                      <div className={cn(
                        "flex items-center gap-2.5 px-3 py-2 rounded-[14px] transition-all duration-300 group relative overflow-hidden",
                        isSubActive
                          ? "bg-brand-primary text-white shadow-[0_4px_10px_-2px_rgba(40,125,136,0.25)]"
                          : "text-brand-secondary/60 hover:text-brand-secondary hover:bg-white/50",
                      )}>
                        {isSubActive && (
                          <div className="absolute -bottom-3 -right-2 w-10 h-10 bg-brand-yellow/30 rounded-full blur-md pointer-events-none" />
                        )}
                        <div className={cn(
                          "relative z-10 shrink-0 transition-colors",
                          isSubActive ? "text-white" : "text-brand-secondary/40 group-hover:text-brand-secondary/70",
                        )}>
                          {step.icon}
                        </div>
                        <span className="relative z-10 text-[12.5px] font-medium tracking-wide">
                          {step.name}
                        </span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          )}

          {/* ZARZĄDZANIE KONKRETNYM WYJAZDEM */}
          {isManagingCamp && (
            <div className="mt-2 flex flex-col animate-in slide-in-from-top-2 duration-300 bg-brand-primary/5 rounded-2xl p-2 mx-1 border border-brand-primary/10">
              <span className="px-2 py-1.5 text-[10px] font-medium text-brand-primary uppercase tracking-wider mb-1">
                Menu Wyjazdu
              </span>
              <div className="flex flex-col gap-0.5">
                {manageCampSteps.map((step) => {
                  const baseHref = step.href.split("?")[0];
                  const isSubActive = step.exact
                    ? pathname === baseHref
                    : pathname.startsWith(baseHref);
                  // Kropka tylko gdy są nieprzeczytane wiadomości czatu (API
                  // zwraca wyłącznie deep-linki czatu, więc dotyczy tej zakładki).
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
                        <span
                          className={cn(
                            "relative z-10 text-[12.5px] font-medium tracking-wide",
                          )}
                        >
                          {step.name}
                        </span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* CRM — ukryte do czasu wdrożenia bazy klientów */}
        {FEATURES.customerBase && (
        <div className="flex flex-col mt-6">
          <span className="px-4 text-[10px] uppercase tracking-[0.2em] text-brand-secondary/40 font-medium mb-2">
            CRM
          </span>
          <Link href="/admin/klienci">
            <div
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-300 group relative overflow-hidden",
                isInCrmSection
                  ? "bg-brand-primary text-white shadow-[0_4px_12px_-2px_rgba(40,125,136,0.25)]"
                  : "text-brand-secondary/60 hover:bg-white/40 hover:text-brand-secondary",
              )}
            >
              {isInCrmSection && (
                <div className="absolute -bottom-4 -right-3 w-14 h-14 bg-brand-yellow/30 rounded-full blur-lg pointer-events-none" />
              )}
              <Users
                size={20}
                weight={isInCrmSection ? "fill" : "duotone"}
                className={cn(
                  "relative z-10 transition-colors",
                  isInCrmSection
                    ? "text-white"
                    : "text-brand-secondary/40 group-hover:text-brand-secondary/70",
                )}
              />
              <span className="font-montserrat text-[13px] font-medium tracking-wide relative z-10">
                CRM
              </span>
            </div>
          </Link>

          {/* CRM sub-tabs */}
          {isInCrmSection && (
            <div className="mt-2 flex flex-col animate-in slide-in-from-top-2 duration-300 bg-brand-primary/5 rounded-2xl p-2 mx-1 border border-brand-primary/10">
              <div className="flex flex-col gap-0.5">
                {crmTabs.map((tab) => {
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
              </div>
            </div>
          )}
        </div>
        )}

        {/* TREŚCI (BLOG) */}
        <div className="flex flex-col mt-6">
          <span className="px-4 text-[10px] uppercase tracking-[0.2em] text-brand-secondary/40 font-medium mb-2">
            Publikacje
          </span>

          <Link href="/admin/blog">
            <div
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-300 group relative overflow-hidden",
                pathname === "/admin/blog" || isCreatingPost
                  ? "bg-brand-primary text-white shadow-[0_4px_12px_-2px_rgba(40,125,136,0.25)]"
                  : "text-brand-secondary/60 hover:bg-white/40 hover:text-brand-secondary",
              )}
            >
              {(pathname === "/admin/blog" || isCreatingPost) && (
                <div className="absolute -bottom-4 -right-3 w-14 h-14 bg-brand-yellow/30 rounded-full blur-lg pointer-events-none" />
              )}
              <NewspaperClipping
                size={20}
                weight={
                  pathname === "/admin/blog" || isCreatingPost
                    ? "fill"
                    : "duotone"
                }
                className={cn(
                  "relative z-10 transition-colors",
                  pathname === "/admin/blog" || isCreatingPost
                    ? "text-white"
                    : "text-brand-secondary/40 group-hover:text-brand-secondary/70",
                )}
              />
              <span className="font-montserrat text-[13px] font-medium tracking-wide relative z-10">
                Wpisy na Blogu
              </span>
            </div>
          </Link>

          {/* Kreator artykułu */}
          {isCreatingPost && (
            <div className="mt-2 flex flex-col animate-in slide-in-from-top-2 duration-300 bg-brand-primary/5 rounded-2xl p-2 mx-1 border border-brand-primary/10">
              <span className="px-2 py-1.5 text-[10px] font-medium text-brand-primary uppercase tracking-wider mb-1">
                Kreator artykułu
              </span>
              <div className="flex flex-col gap-0.5">
                {createPostSteps.map((step) => {
                  const isSubActive = pathname === step.href;
                  const isDisabled = step.requiresId && !queryId;
                  const targetHref = queryId
                    ? `${step.href}?id=${queryId}`
                    : step.href;

                  if (isDisabled) {
                    return (
                      <div key={step.name} className="flex items-center gap-2.5 px-3 py-2 rounded-[14px] opacity-40 cursor-not-allowed">
                        <div className="text-brand-secondary/40 shrink-0">{step.icon}</div>
                        <span className="text-[12.5px] font-medium tracking-wide text-brand-secondary/60">{step.name}</span>
                      </div>
                    );
                  }

                  return (
                    <Link key={step.name} href={targetHref}>
                      <div className={cn(
                        "flex items-center gap-2.5 px-3 py-2 rounded-[14px] transition-all duration-300 group relative overflow-hidden",
                        isSubActive
                          ? "bg-brand-primary text-white shadow-[0_4px_10px_-2px_rgba(40,125,136,0.25)]"
                          : "text-brand-secondary/60 hover:text-brand-secondary hover:bg-white/50",
                      )}>
                        {isSubActive && (
                          <div className="absolute -bottom-3 -right-2 w-10 h-10 bg-brand-yellow/30 rounded-full blur-md pointer-events-none" />
                        )}
                        <div className={cn(
                          "relative z-10 shrink-0 transition-colors",
                          isSubActive ? "text-white" : "text-brand-secondary/40 group-hover:text-brand-secondary/70",
                        )}>
                          {step.icon}
                        </div>
                        <span className="relative z-10 text-[12.5px] font-medium tracking-wide">
                          {step.name}
                        </span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          )}

          <Link href="/admin/blog/harmonogram">
            <div
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-300 group relative overflow-hidden mt-1",
                pathname === "/admin/blog/harmonogram"
                  ? "bg-brand-primary text-white shadow-[0_4px_12px_-2px_rgba(40,125,136,0.25)]"
                  : "text-brand-secondary/60 hover:bg-white/40 hover:text-brand-secondary",
              )}
            >
              {pathname === "/admin/blog/harmonogram" && (
                <div className="absolute -bottom-4 -right-3 w-14 h-14 bg-brand-yellow/30 rounded-full blur-lg pointer-events-none" />
              )}
              <CalendarBlank
                size={20}
                weight={
                  pathname === "/admin/blog/harmonogram" ? "fill" : "duotone"
                }
                className={cn(
                  "relative z-10 transition-colors",
                  pathname === "/admin/blog/harmonogram"
                    ? "text-white"
                    : "text-brand-secondary/40 group-hover:text-brand-secondary/70",
                )}
              />
              <span className="font-montserrat text-[13px] font-medium tracking-wide relative z-10">
                Harmonogram
              </span>
            </div>
          </Link>
        </div>
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
