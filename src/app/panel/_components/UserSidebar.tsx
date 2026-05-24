"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  SquaresFour,
  CalendarBlank,
  Sparkle,
  User,
  SignOut,
  House,
} from "@phosphor-icons/react/dist/ssr";
import { cn } from "@/lib/utils";

interface Props {
  bookingId: string;
}

export default function UserSidebar({ bookingId }: Props) {
  const pathname = usePathname();
  const base = `/panel/${bookingId}`;

  const items = [
    { key: "dashboard", label: "Dashboard", icon: SquaresFour, href: base, exact: true },
    { key: "plan", label: "Mój Plan", icon: CalendarBlank, href: `${base}/harmonogram` },
    { key: "sklep", label: "Masaże", icon: Sparkle, href: `${base}/sklep` },
    { key: "profil", label: "Profil", icon: User, href: `${base}/karta-zdrowia` },
  ];

  return (
    <aside className="fixed top-0 left-0 h-screen w-64 z-40 hidden lg:flex flex-col bg-white border-r border-gray-100 shadow-[4px_0_24px_rgba(0,0,0,0.02)]">
      <div className="flex items-center justify-center h-16 shrink-0 border-b border-gray-50/80">
        <Image
          src="/logotypy/logo-primary.svg"
          alt="Rehability"
          width={130}
          height={36}
          className="hover:opacity-80 transition-opacity"
        />
      </div>

      <nav className="flex-1 flex flex-col gap-1 overflow-y-auto px-3 pt-6 pb-6">
        <span className="px-4 text-[10px] uppercase tracking-[0.2em] text-gray-400 font-bold mb-2">
          Twój camp
        </span>

        {items.map(({ key, label, icon: Icon, href, exact }) => {
          const isActive = exact
            ? pathname === href
            : pathname === href || pathname.startsWith(`${href}/`);

          return (
            <Link key={key} href={href}>
              <div
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group",
                  isActive
                    ? "bg-brand-primary/10 text-brand-primary font-semibold"
                    : "text-gray-500 hover:bg-gray-50 hover:text-gray-900",
                )}
              >
                <Icon
                  size={20}
                  weight={isActive ? "fill" : "duotone"}
                  className={
                    isActive
                      ? "text-brand-primary"
                      : "text-gray-400 group-hover:text-gray-700"
                  }
                />
                <span className="font-montserrat text-[13px] font-medium tracking-wide">
                  {label}
                </span>
              </div>
            </Link>
          );
        })}

        <div className="mt-6">
          <span className="px-4 text-[10px] uppercase tracking-[0.2em] text-gray-400 font-bold mb-2 block">
            Pozostałe
          </span>
          <Link href="/">
            <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-gray-500 hover:bg-gray-50 hover:text-gray-900 transition-all duration-200 group">
              <House
                size={20}
                weight="duotone"
                className="text-gray-400 group-hover:text-gray-700"
              />
              <span className="font-montserrat text-[13px] font-medium tracking-wide">
                Strona główna
              </span>
            </div>
          </Link>
        </div>
      </nav>

      <div className="p-4 border-t border-gray-100 bg-gray-50/50 shrink-0">
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
