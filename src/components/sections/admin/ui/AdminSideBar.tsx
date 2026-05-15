"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
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
  ListPlus,
} from "@phosphor-icons/react/dist/ssr";

export default function AdminSidebar({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const pathname = usePathname();

  const isInsideCampContext = pathname.startsWith("/admin/campy");
  const isCreatingCamp = pathname.startsWith("/admin/campy/dodaj");
  const isManagingCamp =
    isInsideCampContext && !isCreatingCamp && pathname !== "/admin/campy";

  const createCampSteps = [
    {
      name: "1. Dane podst.",
      href: "/admin/campy/dodaj/dane-podstawowe",
      icon: <ListNumbers size={16} />,
    },
    {
      name: "2. Edytor treści",
      href: "/admin/campy/dodaj/edytor-tresci",
      icon: <ImageIcon size={16} />,
    },
    {
      name: "3. Podsumowanie",
      href: "/admin/campy/dodaj/podsumowanie",
      icon: <Article size={16} />,
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
    <>
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-30 md:hidden"
          onClick={onClose}
        />
      )}

      <aside
        // ZMIANA KLAS: 'fixed md:sticky' sprawia, że wpada w grid na desktopie,
        // ale na mobile wciąż wyjeżdża nad wszystkim jako fixed. 'h-screen' blokuje wysokość.
        className={`fixed md:sticky top-0 left-0 h-screen w-[250px] z-40 transform transition-transform duration-300 flex flex-col py-6 bg-brand-primary shadow-2xl ${
          isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}
      >
        {/* LOGO */}
        <div className="flex items-center justify-center px-6 mb-6 shrink-0">
          <Image
            src="/logotypy/logo-primary.svg"
            alt="Logo"
            width={130}
            height={36}
            className="brightness-0 invert"
          />
        </div>

        {/* NAWIGACJA */}
        <nav className="flex-1 flex flex-col gap-1 overflow-y-auto px-4 mt-2 custom-scrollbar">
          {/* DASHBOARD */}
          <Link href="/admin">
            <div
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-[12px] transition-all ${pathname === "/admin" ? "bg-white text-brand-primary shadow-md font-semibold" : "text-white/70 hover:bg-white/10"}`}
            >
              <SquaresFour
                size={20}
                weight={pathname === "/admin" ? "fill" : "regular"}
              />
              <span className="font-montserrat text-[13px] font-medium">
                Dashboard
              </span>
            </div>
          </Link>

          {/* SYSTEM CAMPÓW */}
          <div className="flex flex-col mt-4">
            <span className="px-3.5 text-[10px] uppercase tracking-widest text-white/40 font-bold mb-1.5">
              System Campów
            </span>

            <Link href="/admin/campy">
              <div
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-[12px] transition-all ${pathname.includes("/admin/campy") ? "bg-white text-brand-primary shadow-md font-semibold" : "text-white/70 hover:bg-white/10"}`}
              >
                <Tent
                  size={20}
                  weight={pathname === "/admin/campy" ? "fill" : "regular"}
                />
                <span className="font-montserrat text-[13px] font-medium">
                  Wszystkie Campy
                </span>
              </div>
            </Link>
            {isCreatingCamp && (
              <div className="mt-1 flex flex-col animate-in slide-in-from-top-2 duration-300">
                <span className="ml-[8px] pl-4 py-1 text-[10px] font-bold text-white uppercase tracking-wider">
                  Kreator wyjazdów
                </span>
                <div className="ml-[24px] flex flex-col border-l border-white/20 pb-2">
                  {createCampSteps.map((step) => {
                    const isSubActive = pathname === step.href;

                    return (
                      <div
                        key={step.name}
                        className="relative flex items-center mt-0.5"
                      >
                        <div className="absolute -left-[1px] top-1/2 w-4 h-px bg-white/20" />
                        <Link href={step.href} className="flex-1 ml-4 mr-2">
                          <div
                            className={`flex items-center gap-2.5 px-3 py-1.5 rounded-[10px] transition-all ${isSubActive ? "bg-white text-brand-primary font-bold" : "text-white/50 hover:text-white"}`}
                          >
                            {step.icon}
                            <span className="text-[12px]">{step.name}</span>
                          </div>
                        </Link>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {isManagingCamp && (
              <div className="mt-1 flex flex-col animate-in slide-in-from-top-2 duration-300">
                <span className="ml-[24px] pl-4 py-1 text-[10px] font-bold text-white uppercase tracking-wider">
                  Edycja Campa
                </span>
                <div className="ml-[24px] flex flex-col border-l border-white/20 pb-2">
                  {manageCampSteps.map((step) => {
                    const isSubActive = pathname.includes(step.href);

                    return (
                      <div
                        key={step.name}
                        className="relative flex items-center mt-0.5"
                      >
                        <div className="absolute -left-[1px] top-1/2 w-4 h-px bg-white/20" />
                        <Link href={step.href} className="flex-1 ml-4 mr-2">
                          <div
                            className={`flex items-center gap-2.5 px-3 py-1.5 rounded-[10px] transition-all ${isSubActive ? "bg-white/10 text-white font-bold" : "text-white/50 hover:text-white"}`}
                          >
                            {step.icon}
                            <span className="text-[12px]">{step.name}</span>
                          </div>
                        </Link>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* RELACJE */}
          <div className="flex flex-col mt-4">
            <span className="px-3.5 text-[10px] uppercase tracking-widest text-white/40 font-bold mb-1.5">
              Relacje
            </span>
            <Link href="/admin/klientki">
              <div
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-[12px] transition-all ${pathname.startsWith("/admin/klientki") ? "bg-white text-brand-primary shadow-md font-semibold" : "text-white/70 hover:bg-white/10"}`}
              >
                <Users
                  size={20}
                  weight={
                    pathname.startsWith("/admin/klientki") ? "fill" : "regular"
                  }
                />
                <span className="font-montserrat text-[13px] font-medium">
                  Baza Klientek (CRM)
                </span>
              </div>
            </Link>
          </div>
        </nav>

        {/* STOPKA (Ustawienia + Wyloguj) */}
        <div className="px-4 pt-4 border-t border-white/20 mx-4 mt-4 flex flex-col gap-1 shrink-0">
          <Link href="/admin/ustawienia">
            <div
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-[12px] ${pathname.startsWith("/admin/ustawienia") ? "bg-white text-brand-primary shadow-md font-semibold" : "text-white/70 hover:bg-white/10"}`}
            >
              <Gear size={20} />
              <span className="font-montserrat text-[13px] font-medium">
                Ustawienia
              </span>
            </div>
          </Link>
          <button className="flex items-center gap-3 px-3.5 py-2.5 rounded-[12px] text-white/70 hover:text-red-300 hover:bg-white/10 w-full text-left font-medium">
            <SignOut size={20} />
            <span className="font-montserrat text-[13px]">Wyloguj się</span>
          </button>
        </div>
      </aside>
    </>
  );
}
