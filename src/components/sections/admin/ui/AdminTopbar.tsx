"use client";

import React from "react";
import { Bell, ChatCircle, CaretDown } from "@phosphor-icons/react/dist/ssr";

// Definiujemy, jakich danych użytkownika oczekujemy z serwera
export interface AdminTopbarProps {
  user?: {
    name?: string | null;
    image?: string | null;
    role?: string | null;
  };
}

const getInitials = (name?: string | null) => {
  if (!name) return "U";
  const parts = name.trim().split(" ");
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
};

export default function AdminTopbar({ user }: AdminTopbarProps) {
  return (
    <header className="sticky top-0 z-20 bg-white/90 backdrop-blur-md border-b border-gray-100 px-10 py-4 flex items-center justify-between shadow-sm">
      {/* Puste miejsce po lewej (usunięty hamburger menu dla mobile) */}
      <div></div>

      {/* Prawa strona: Narzędzia i Profil */}
      <div className="flex items-center gap-6">
        {/* Ikony powiadomień i wiadomości */}
        <div className="flex items-center gap-3">
          <button className="relative p-2.5 text-brand-primary bg-brand-primary/5 hover:bg-brand-primary/10 rounded-full transition-colors cursor-pointer">
            <ChatCircle size={22} weight="regular" />
            <span className="absolute top-2 right-2 w-2 h-2 bg-brand-yellow rounded-full border border-white"></span>
          </button>

          <button className="relative p-2.5 text-brand-primary bg-brand-primary/5 hover:bg-brand-primary/10 rounded-full transition-colors cursor-pointer">
            <Bell size={22} weight="regular" />
            <span className="absolute top-2 right-2 w-2 h-2 bg-red-400 rounded-full border border-white"></span>
          </button>
        </div>

        <div className="w-[1px] h-8 bg-gray-200"></div>

        {/* Profil Użytkownika */}
        <button className="flex items-center gap-3 hover:bg-gray-50 p-1.5 pr-3 rounded-full transition-colors border border-transparent hover:border-gray-100 cursor-pointer">
          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#287D88] to-[#659F9F] text-white flex items-center justify-center font-bold text-sm shadow-inner shrink-0 overflow-hidden">
            {user?.image ? (
              <img
                src={user.image}
                alt="Avatar"
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            ) : (
              getInitials(user?.name)
            )}
          </div>

          <div className="flex flex-col items-start text-left">
            <span className="font-bold text-[14px] text-[#0B3B4C] leading-none">
              {user?.name || "Użytkownik"}
            </span>
            <span className="text-[12px] text-gray-500 font-medium mt-1 leading-none">
              {user?.role === "ADMIN" ? "Administrator" : "Kursant"}
            </span>
          </div>
          <CaretDown size={16} weight="bold" className="text-gray-400 ml-1" />
        </button>
      </div>
    </header>
  );
}
