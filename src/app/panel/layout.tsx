import React from "react";
import { getServerSession } from "next-auth/next";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth/auth";
import { Toaster } from "sonner";

import UserMobileBottomNav from "./_components/UserMobileBottomNav";
import UserTopBar from "./_components/UserTopBar";
import UserSideBar from "./_components/UserSideBar";
import OneSignalProvider from "@/components/notifications/OneSignalProvider";
import NotificationPrompt from "@/components/notifications/NotificationPrompt";

export default async function PanelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/logowanie");
  }

  // Przygotowujemy usera dla Topbaru
  const user = {
    name: session.user.name,
    image: session.user.image,
    email: session.user.email,
  };

  return (
    // Główny kontener - na PC dzieli się na Sidebar (260px) i resztę
    <div className="relative min-h-screen font-montserrat flex flex-col lg:grid lg:grid-cols-[260px_1fr] bg-[#F7FAFB]">
      <OneSignalProvider userId={session.user.id} />
      <NotificationPrompt />
      {/* 1. SIDEBAR DLA PC */}
      <UserSideBar /> {/* Poprawione */}
      {/* 2. GŁÓWNA STREFA TREŚCI (Prawa strona) */}
      <div className="flex flex-col min-w-0 min-h-screen relative z-10">
        {/* Dekoracyjne Tła */}
        <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute inset-0 bg-[linear-gradient(to_bottom,#dafbff_0%,#ffffff_50%,#f5fbfc_100%)] opacity-50" />
          <div className="absolute -top-40 -left-20 w-[420px] h-[420px] rounded-full bg-brand-primary/20 blur-[120px]" />
          <div className="absolute top-1/3 -right-32 w-[380px] h-[380px] rounded-full bg-brand-yellow/25 blur-[120px]" />
        </div>
        {/* TOPBAR */}
        <UserTopBar user={user} /> {/* Poprawione */}
        {/* DYNAMICZNY CONTENT (Hub, Campy, VOD) */}
        <main className="flex-1 pb-28 lg:pb-12 max-w-[1400px] mx-auto w-full px-4 lg:px-8 pt-6 lg:pt-8">
          {children}
        </main>
      </div>
      {/* 3. PASEK DOLNY (Tylko Mobile) */}
      <UserMobileBottomNav />
      {/* TOASTER */}
      <Toaster
        position="top-center"
        gap={8}
        toastOptions={
          {
            // ... reszta ustawień toстера
          }
        }
      />
    </div>
  );
}
