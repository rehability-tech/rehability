"use client";

import React from "react";
import { usePathname } from "next/navigation";
import AdminSidebar from "./AdminSideBar";
import AdminTopbar from "./AdminTopbar";
import AdminMobileBottomNav from "./AdminMobileBottomNav";

interface AdminShellProps {
  user: {
    name?: string | null;
    image?: string | null;
    role?: string | null;
  };
  children: React.ReactNode;
}

export default function AdminShell({ user, children }: AdminShellProps) {
  const pathname = usePathname();
  const isHub = pathname === "/admin";

  if (isHub) {
    return (
      <div className="min-h-screen flex flex-col font-montserrat">
        <AdminTopbar user={user} />
        <main className="flex-1 min-w-0">{children}</main>
      </div>
    );
  }

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-[250px_1fr] font-montserrat">
      <AdminSidebar />

      <main className="flex flex-col min-w-0 min-h-screen w-full">
        <AdminTopbar user={user} />

        <div className="max-w-[1400px] mx-auto w-full flex-1 pb-20 lg:pb-0">
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
            {children}
          </div>
        </div>
      </main>

      <AdminMobileBottomNav />
    </div>
  );
}
