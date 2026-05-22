"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useSearchParams } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  SquaresFour,
  Tent,
  Users,
  Gear,
  SignOut,
  Info,
  UserList,
  CreditCard,
  QrCode,
  ListNumbers,
  Image as ImageIcon,
  Article,
  NewspaperClipping,
  TextT,
  MagnifyingGlass,
  CalendarBlank,
} from "@phosphor-icons/react/dist/ssr";
import { cn } from "@/lib/utils"; // Zakładam, że masz ten popularny helper

export default function AdminSidebar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const campId = searchParams.get("id");

  const isInsideCampContext = pathname.startsWith("/admin/campy");
  const isCreatingCamp = pathname.startsWith("/admin/campy/dodaj");
  const isManagingCamp =
    isInsideCampContext && !isCreatingCamp && pathname !== "/admin/campy";

  const isCreatingPost = pathname.startsWith("/admin/blog/dodaj");

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
      href: "/admin/campy/dodaj/dane-podstawowe",
      icon: <ListNumbers size={16} />,
      requiresId: false,
    },
    {
      name: "2. Edytor treści",
      href: "/admin/campy/dodaj/edytor-tresci",
      icon: <ImageIcon size={16} />,
      requiresId: true,
    },
    {
      name: "3. SEO",
      href: "/admin/campy/dodaj/seo",
      icon: <MagnifyingGlass size={16} />,
      requiresId: true,
    },
    {
      name: "4. Podsumowanie",
      href: "/admin/campy/dodaj/podsumowanie",
      icon: <Article size={16} />,
      requiresId: true,
    },
  ];

  const manageCampSteps = [
    { name: "Ogólne", href: "/admin/campy/edycja", icon: <Info size={16} /> },
    {
      name: "Uczestniczki",
      href: "/admin/campy/uczestniczki",
      icon: <UserList size={16} />,
    },
    {
      name: "Płatności",
      href: "/admin/campy/platnosci",
      icon: <CreditCard size={16} />,
    },
    {
      name: "Live / QR",
      href: "/admin/campy/live",
      icon: <QrCode size={16} />,
    },
  ];

  return (
    <aside className="sticky top-0 left-0 h-screen w-[260px] z-40 hidden lg:flex flex-col bg-white border-r border-gray-100 shadow-[4px_0_24px_rgba(0,0,0,0.02)]">
      {/* LOGO - Bez inwersji, bo tło jest teraz białe */}
      <div className="flex items-center justify-center h-[72px] shrink-0 border-b border-gray-50/80 mb-4">
        <Image
          src="/logotypy/logo-primary.svg"
          alt="Logo"
          width={130}
          height={36}
          className="hover:opacity-80 transition-opacity"
        />
      </div>

      {/* NAWIGACJA */}
      <nav className="flex-1 flex flex-col gap-1 overflow-y-auto px-3 custom-scrollbar pb-6">
        {/* DASHBOARD */}
        <div className="mb-2">
          <Link href="/admin">
            <div
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group",
                pathname === "/admin"
                  ? "bg-brand-primary/10 text-brand-primary font-semibold"
                  : "text-gray-500 hover:bg-gray-50 hover:text-gray-900",
              )}
            >
              <SquaresFour
                size={20}
                weight={pathname === "/admin" ? "fill" : "duotone"}
                className={
                  pathname === "/admin"
                    ? "text-brand-primary"
                    : "text-gray-400 group-hover:text-gray-700"
                }
              />
              <span className="font-montserrat text-[13px] font-medium tracking-wide">
                Dashboard
              </span>
            </div>
          </Link>
        </div>

        {/* SYSTEM CAMPÓW */}
        <div className="flex flex-col mt-2">
          <span className="px-4 text-[10px] uppercase tracking-[0.2em] text-gray-400 font-bold mb-2">
            Zarządzanie
          </span>

          <Link href="/admin/campy">
            <div
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group",
                pathname === "/admin/campy"
                  ? "bg-brand-primary/10 text-brand-primary font-semibold"
                  : "text-gray-500 hover:bg-gray-50 hover:text-gray-900",
              )}
            >
              <Tent
                size={20}
                weight={pathname === "/admin/campy" ? "fill" : "duotone"}
                className={
                  pathname === "/admin/campy"
                    ? "text-brand-primary"
                    : "text-gray-400 group-hover:text-gray-700"
                }
              />
              <span className="font-montserrat text-[13px] font-medium tracking-wide">
                Wszystkie Campy
              </span>
            </div>
          </Link>

          {/* KREATOR CAMPÓW (STEPS) */}
          {isCreatingCamp && (
            <div className="mt-2 flex flex-col animate-in slide-in-from-top-2 duration-300 bg-gray-50/50 rounded-2xl p-2 mx-1 border border-gray-100">
              <span className="px-2 py-1.5 text-[10px] font-bold text-brand-primary uppercase tracking-wider mb-1">
                Kreator wyjazdów
              </span>
              <div className="flex flex-col relative">
                {createCampSteps.map((step, idx) => {
                  const isSubActive = pathname === step.href;
                  const isDisabled = step.requiresId && !campId;
                  const targetHref = campId
                    ? `${step.href}?id=${campId}`
                    : step.href;
                  const isLast = idx === createCampSteps.length - 1;

                  return (
                    <div
                      key={step.name}
                      className="relative flex items-stretch"
                    >
                      {/* Linia łącząca */}
                      {!isLast && (
                        <div className="absolute left-[15px] top-[24px] bottom-[-8px] w-[2px] bg-gray-200 z-0" />
                      )}

                      {isDisabled ? (
                        <div className="flex items-center gap-3 w-full py-1.5 pl-2 pr-3 opacity-40 cursor-not-allowed z-10">
                          <div className="w-7 h-7 rounded-full bg-white border-2 border-gray-200 flex items-center justify-center shrink-0">
                            <div className="w-1.5 h-1.5 rounded-full bg-gray-300" />
                          </div>
                          <span className="text-[12px] font-medium text-gray-500">
                            {step.name}
                          </span>
                        </div>
                      ) : (
                        <Link href={targetHref} className="flex-1 z-10">
                          <div className="flex items-center gap-3 w-full py-1.5 pl-2 pr-3 group">
                            <div
                              className={cn(
                                "w-7 h-7 rounded-full bg-white border-2 flex items-center justify-center shrink-0 transition-colors",
                                isSubActive
                                  ? "border-brand-primary"
                                  : "border-gray-200 group-hover:border-gray-300",
                              )}
                            >
                              <div
                                className={cn(
                                  "w-1.5 h-1.5 rounded-full transition-colors",
                                  isSubActive
                                    ? "bg-brand-primary"
                                    : "bg-transparent group-hover:bg-gray-300",
                                )}
                              />
                            </div>
                            <span
                              className={cn(
                                "text-[12px] transition-colors",
                                isSubActive
                                  ? "font-bold text-gray-900"
                                  : "font-medium text-gray-500 group-hover:text-gray-900",
                              )}
                            >
                              {step.name}
                            </span>
                          </div>
                        </Link>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ZARZĄDZANIE (EDYCJA) CAMPEM */}
          {isManagingCamp && (
            <div className="mt-2 flex flex-col animate-in slide-in-from-top-2 duration-300 bg-brand-primary/5 rounded-2xl p-2 mx-1 border border-brand-primary/10">
              <span className="px-2 py-1.5 text-[10px] font-bold text-brand-primary uppercase tracking-wider mb-1">
                Panel Campa
              </span>
              <div className="flex flex-col gap-0.5">
                {manageCampSteps.map((step) => {
                  const isSubActive = pathname.includes(step.href);
                  const targetHref = campId
                    ? `${step.href}?id=${campId}`
                    : step.href;

                  return (
                    <Link key={step.name} href={targetHref}>
                      <div
                        className={cn(
                          "flex items-center gap-2.5 px-3 py-2 rounded-xl transition-all",
                          isSubActive
                            ? "bg-white text-brand-primary shadow-sm font-semibold border border-brand-primary/10"
                            : "text-gray-500 hover:text-gray-900 hover:bg-white/50",
                        )}
                      >
                        <div
                          className={cn(
                            "shrink-0",
                            isSubActive
                              ? "text-brand-primary"
                              : "text-gray-400",
                          )}
                        >
                          {step.icon}
                        </div>
                        <span className="text-[12px]">{step.name}</span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* RELACJE */}
        <div className="flex flex-col mt-6">
          <span className="px-4 text-[10px] uppercase tracking-[0.2em] text-gray-400 font-bold mb-2">
            CRM
          </span>
          <Link href="/admin/klientki">
            <div
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group",
                pathname.startsWith("/admin/klientki")
                  ? "bg-brand-primary/10 text-brand-primary font-semibold"
                  : "text-gray-500 hover:bg-gray-50 hover:text-gray-900",
              )}
            >
              <Users
                size={20}
                weight={
                  pathname.startsWith("/admin/klientki") ? "fill" : "duotone"
                }
                className={
                  pathname.startsWith("/admin/klientki")
                    ? "text-brand-primary"
                    : "text-gray-400 group-hover:text-gray-700"
                }
              />
              <span className="font-montserrat text-[13px] font-medium tracking-wide">
                Baza Klientek
              </span>
            </div>
          </Link>
        </div>

        {/* TREŚCI (BLOG) */}
        <div className="flex flex-col mt-6">
          <span className="px-4 text-[10px] uppercase tracking-[0.2em] text-gray-400 font-bold mb-2">
            Publikacje
          </span>

          <Link href="/admin/blog">
            <div
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group",
                pathname === "/admin/blog" || isCreatingPost
                  ? "bg-brand-primary/10 text-brand-primary font-semibold"
                  : "text-gray-500 hover:bg-gray-50 hover:text-gray-900",
              )}
            >
              <NewspaperClipping
                size={20}
                weight={
                  pathname === "/admin/blog" || isCreatingPost
                    ? "fill"
                    : "duotone"
                }
                className={
                  pathname === "/admin/blog" || isCreatingPost
                    ? "text-brand-primary"
                    : "text-gray-400 group-hover:text-gray-700"
                }
              />
              <span className="font-montserrat text-[13px] font-medium tracking-wide">
                Wpisy na Blogu
              </span>
            </div>
          </Link>

          {/* Kreator artykułu — bezpośrednio pod "Wpisy na Blogu" */}
          {isCreatingPost && (
            <div className="mt-2 flex flex-col animate-in slide-in-from-top-2 duration-300 bg-gray-50/50 rounded-2xl p-2 mx-1 border border-gray-100">
              <span className="px-2 py-1.5 text-[10px] font-bold text-brand-primary uppercase tracking-wider mb-1">
                Kreator artykułu
              </span>
              <div className="flex flex-col relative">
                {createPostSteps.map((step, idx) => {
                  const isSubActive = pathname === step.href;
                  const isDisabled = step.requiresId && !campId;
                  const targetHref = campId
                    ? `${step.href}?id=${campId}`
                    : step.href;
                  const isLast = idx === createPostSteps.length - 1;

                  return (
                    <div
                      key={step.name}
                      className="relative flex items-stretch"
                    >
                      {!isLast && (
                        <div className="absolute left-[15px] top-[24px] bottom-[-8px] w-[2px] bg-gray-200 z-0" />
                      )}

                      {isDisabled ? (
                        <div className="flex items-center gap-3 w-full py-1.5 pl-2 pr-3 opacity-40 cursor-not-allowed z-10">
                          <div className="w-7 h-7 rounded-full bg-white border-2 border-gray-200 flex items-center justify-center shrink-0">
                            <div className="w-1.5 h-1.5 rounded-full bg-gray-300" />
                          </div>
                          <span className="text-[12px] font-medium text-gray-500">
                            {step.name}
                          </span>
                        </div>
                      ) : (
                        <Link href={targetHref} className="flex-1 z-10">
                          <div className="flex items-center gap-3 w-full py-1.5 pl-2 pr-3 group">
                            <div
                              className={cn(
                                "w-7 h-7 rounded-full bg-white border-2 flex items-center justify-center shrink-0 transition-colors",
                                isSubActive
                                  ? "border-brand-primary"
                                  : "border-gray-200 group-hover:border-gray-300",
                              )}
                            >
                              <div
                                className={cn(
                                  "w-1.5 h-1.5 rounded-full transition-colors",
                                  isSubActive
                                    ? "bg-brand-primary"
                                    : "bg-transparent group-hover:bg-gray-300",
                                )}
                              />
                            </div>
                            <span
                              className={cn(
                                "text-[12px] transition-colors",
                                isSubActive
                                  ? "font-bold text-gray-900"
                                  : "font-medium text-gray-500 group-hover:text-gray-900",
                              )}
                            >
                              {step.name}
                            </span>
                          </div>
                        </Link>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <Link href="/admin/blog/harmonogram">
            <div
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group mt-1",
                pathname === "/admin/blog/harmonogram"
                  ? "bg-brand-primary/10 text-brand-primary font-semibold"
                  : "text-gray-500 hover:bg-gray-50 hover:text-gray-900",
              )}
            >
              <CalendarBlank
                size={20}
                weight={
                  pathname === "/admin/blog/harmonogram" ? "fill" : "duotone"
                }
                className={
                  pathname === "/admin/blog/harmonogram"
                    ? "text-brand-primary"
                    : "text-gray-400 group-hover:text-gray-700"
                }
              />
              <span className="font-montserrat text-[13px] font-medium tracking-wide">
                Harmonogram
              </span>
            </div>
          </Link>
        </div>
      </nav>

      {/* STOPKA (Ustawienia + Wyloguj) */}
      <div className="p-4 border-t border-gray-100 bg-gray-50/50 shrink-0">
        <Link href="/admin/ustawienia">
          <div
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all mb-1 group",
              pathname.startsWith("/admin/ustawienia")
                ? "bg-white text-brand-primary shadow-sm border border-gray-200 font-semibold"
                : "text-gray-500 hover:text-gray-900 hover:bg-white",
            )}
          >
            <Gear
              size={20}
              className={
                pathname.startsWith("/admin/ustawienia")
                  ? "text-brand-primary"
                  : "text-gray-400 group-hover:text-gray-700"
              }
            />
            <span className="font-montserrat text-[13px] font-medium tracking-wide">
              Ustawienia
            </span>
          </div>
        </Link>
        <button
          onClick={() => signOut({ callbackUrl: "/logowanie" })}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-gray-500 hover:text-red-600 hover:bg-red-50 transition-all w-full text-left cursor-pointer group"
        >
          <SignOut
            size={20}
            className="text-gray-400 group-hover:text-red-500"
          />
          <span className="font-montserrat text-[13px] font-medium tracking-wide">
            Wyloguj się
          </span>
        </button>
      </div>
    </aside>
  );
}
