"use client";

import React, { useState } from "react";
import SearchBar from "./topbar/SearchBar";
import NotificationsDropdown from "./topbar/NotificationsDropdown";
import ProfileMenu from "./topbar/ProfileMenu";
import GlobalDrawer from "./topbar/GlobalDrawer";
import { AdminUser } from "./topbar/types";

export interface AdminTopbarProps {
  user?: AdminUser;
}

export default function AdminTopbar({ user }: AdminTopbarProps) {
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-[100] h-16 px-4 lg:px-6 flex items-center justify-between bg-white/60 backdrop-blur-xl border-b border-white/30 shadow-[0_4px_24px_-12px_rgba(3,63,99,0.12)]">
        <div className="flex items-center flex-1">
          <SearchBar />
        </div>

        <div className="flex items-center gap-2 md:gap-4 shrink-0">
          <NotificationsDropdown />
          <div className="hidden md:block h-6 w-px bg-brand-secondary/10 mx-1" />
          <ProfileMenu user={user} />
        </div>
      </header>

      <GlobalDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        user={user}
      />
    </>
  );
}
