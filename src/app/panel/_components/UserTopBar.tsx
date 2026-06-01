"use client";

import UserSearchBar from "./topbar/UserSearchBar";
import UserNotifications from "./topbar/UserNotifications";
import UserProfileMenu from "./topbar/UserProfileMenu";
import type { UserTopbarProps } from "./topbar/types";

export type { UserTopbarProps } from "./topbar/types";

export default function UserTopbar({ user }: UserTopbarProps) {
  return (
    <header className="sticky top-0 z-[100] h-16 px-4 lg:px-8 flex items-center justify-between bg-white/60 backdrop-blur-xl border-b border-white/30 shadow-[0_4px_24px_-12px_rgba(3,63,99,0.08)]">
      {/* LEWA STRONA: Wyszukiwarka */}
      <div className="flex items-center flex-1 min-w-0">
        <UserSearchBar />
      </div>

      {/* PRAWA STRONA: Powiadomienia + Profil */}
      <div className="flex items-center gap-2 md:gap-4 shrink-0">
        <UserNotifications />
        <div className="hidden md:block h-6 w-px bg-brand-secondary/10 mx-1" />
        <UserProfileMenu user={user} />
      </div>
    </header>
  );
}
