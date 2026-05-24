"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  House,
  Heartbeat,
  Sparkle,
  ChatsCircle,
} from "@phosphor-icons/react/dist/ssr";
import { cn } from "@/lib/utils";

interface Props {
  bookingId: string;
}

export default function ParticipantBottomNav({ bookingId }: Props) {
  const pathname = usePathname();
  const base = `/panel/campy/${bookingId}`;

  const items = [
    { href: base, label: "Panel", icon: House, exact: true },
    { href: `${base}/zdrowie`, label: "Zdrowie", icon: Heartbeat },
    { href: `${base}/uslugi`, label: "Usługi", icon: Sparkle },
    { href: `${base}/czat`, label: "Czat", icon: ChatsCircle },
  ];

  return (
    <div
      className="fixed inset-x-0 bottom-0 z-50 lg:hidden flex justify-center pointer-events-none px-4 pb-4"
      style={{ paddingBottom: "max(1rem, env(safe-area-inset-bottom))" }}
    >
      <nav
        className={cn(
          "pointer-events-auto w-full max-w-md",
          "rounded-full",
          "bg-[#101418]/85 backdrop-blur-2xl",
          "border border-white/10",
          "shadow-[0_20px_60px_-12px_rgba(0,0,0,0.6),0_8px_24px_-8px_rgba(0,0,0,0.4)]",
          "px-2 py-2",
        )}
      >
        <ul className="flex items-center justify-between gap-1">
          {items.map(({ href, label, icon: Icon, exact }) => {
            const isActive = exact
              ? pathname === href
              : pathname === href || pathname.startsWith(`${href}/`);

            return (
              <li
                key={href}
                className={cn(
                  "transition-[flex-grow] duration-300 ease-out",
                  isActive ? "flex-grow" : "flex-grow-0",
                )}
              >
                <Link
                  href={href}
                  aria-label={label}
                  className={cn(
                    "relative flex items-center justify-center gap-2",
                    "h-11 rounded-full",
                    "transition-colors duration-300 ease-out",
                    isActive
                      ? "bg-brand-primary px-4 text-white shadow-[0_8px_20px_-6px_rgba(40,125,136,0.7)]"
                      : "w-11 text-gray-400 hover:text-white",
                  )}
                >
                  <Icon
                    size={22}
                    weight={isActive ? "fill" : "regular"}
                    className="shrink-0"
                  />
                  {isActive && (
                    <span className="font-jakarta text-[13px] font-semibold tracking-tight whitespace-nowrap pr-1">
                      {label}
                    </span>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}
