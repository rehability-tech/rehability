"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  House,
  CalendarBlank,
  ShoppingBag,
  CurrencyCircleDollar,
  Heart,
} from "@phosphor-icons/react/dist/ssr";

const navItems = [
  { href: ".", icon: House, label: "Start" },
  { href: "harmonogram", icon: CalendarBlank, label: "Plan" },
  { href: "sklep", icon: ShoppingBag, label: "Usługi" },
  { href: "finanse", icon: CurrencyCircleDollar, label: "Finanse" },
  { href: "karta-zdrowia", icon: Heart, label: "Zdrowie" },
];

export default function PanelBottomNav() {
  const pathname = usePathname();

  // Wyciągamy bookingId ze ścieżki: /panel/[bookingId]/...
  const segments = pathname.split("/").filter(Boolean);
  const bookingId = segments[1] ?? "";

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-100 safe-bottom shadow-[0_-4px_20px_rgba(0,0,0,0.06)]">
      <ul className="max-w-md mx-auto flex items-center justify-around px-2 h-16">
        {navItems.map(({ href, icon: Icon, label }) => {
          const fullHref =
            href === "."
              ? `/panel/${bookingId}`
              : `/panel/${bookingId}/${href}`;
          const isActive =
            href === "."
              ? pathname === `/panel/${bookingId}`
              : pathname.startsWith(fullHref);

          return (
            <li key={href}>
              <Link
                href={fullHref}
                className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl transition-colors duration-200 ${
                  isActive
                    ? "text-[#0B3B4C]"
                    : "text-gray-400 hover:text-[#0B3B4C]"
                }`}
              >
                <Icon
                  size={22}
                  weight={isActive ? "duotone" : "regular"}
                />
                <span className="text-[10px] font-semibold tracking-wide">
                  {label}
                </span>
                {isActive && (
                  <span className="w-1 h-1 rounded-full bg-[#287D88] mt-0.5" />
                )}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
