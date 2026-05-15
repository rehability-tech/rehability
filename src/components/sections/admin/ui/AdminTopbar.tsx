"use client";

import React from "react";
import {
  List,
  Bell,
  ChatCircle,
  CaretDown,
} from "@phosphor-icons/react/dist/ssr";

export interface AdminTopbarProps {
  onOpenMobileMenu: () => void;
}

export default function AdminTopbar({ onOpenMobileMenu }: AdminTopbarProps) {
  return (
    <header className="sticky top-0 z-20 bg-white/90 backdrop-blur-md border-b border-gray-100 px-4 md:px-10 py-4 flex items-center justify-between shadow-sm">
      {/* Lewa strona: Hamburger (Tylko na Mobile) */}
      <div className="flex items-center gap-4">
        <button
          onClick={onOpenMobileMenu}
          className="p-2 -ml-2 rounded-lg text-brand-primary hover:bg-brand-primary/10 md:hidden transition-colors cursor-pointer"
        >
          <List size={26} weight="bold" />
        </button>
      </div>

      {/* Prawa strona: Narzędzia i Profil */}
      <div className="flex items-center gap-3 md:gap-6">
        {/* Ikony powiadomień i wiadomości */}
        <div className="flex items-center gap-2 md:gap-3">
          <button className="relative p-2.5 text-brand-primary bg-brand-primary/5 hover:bg-brand-primary/10 rounded-full transition-colors cursor-pointer">
            <ChatCircle size={22} weight="regular" />
            <span className="absolute top-2 right-2 w-2 h-2 bg-brand-yellow rounded-full border border-white"></span>
          </button>

          <button className="relative p-2.5 text-brand-primary bg-brand-primary/5 hover:bg-brand-primary/10 rounded-full transition-colors cursor-pointer">
            <Bell size={22} weight="regular" />
            <span className="absolute top-2 right-2 w-2 h-2 bg-red-400 rounded-full border border-white"></span>
          </button>
        </div>

        <div className="w-[1px] h-8 bg-gray-200 hidden sm:block"></div>

        {/* Profil Użytkownika */}
        <button className="flex items-center gap-3 hover:bg-gray-50 p-1.5 pr-3 rounded-full transition-colors border border-transparent hover:border-gray-100 cursor-pointer">
          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#287D88] to-[#659F9F] text-white flex items-center justify-center font-bold text-sm shadow-inner shrink-0">
            PS
          </div>
          <div className="hidden md:flex flex-col items-start text-left">
            <span className="font-bold text-[14px] text-[#0B3B4C] leading-none">
              Piotr Siemaszko
            </span>
            <span className="text-[12px] text-gray-500 font-medium mt-1 leading-none">
              Administrator
            </span>
          </div>
          <CaretDown
            size={16}
            weight="bold"
            className="text-gray-400 hidden md:block ml-1"
          />
        </button>
      </div>
    </header>
  );
}
