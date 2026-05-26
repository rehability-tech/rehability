import React from "react";
import { getServerSession } from "next-auth/next";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth/auth";
import { Toaster } from "sonner";

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

  return (
    // Zdejmujemy overflow-x-hidden stąd, przeniesiemy go głębiej, aby nie psuć pozycjonowania fixed (jeśli go używasz)
    <div className="relative min-h-screen font-montserrat flex flex-col">
      <OneSignalProvider userId={session.user.id} />
      <NotificationPrompt />

      {/* 1. SIDEBAR DLA PC */}
      {/* Tutaj powinieneś zaimportować i wstawić swój komponent Sidebaru */}

      {/* 2. GŁÓWNA STREFA TREŚCI (Prawa strona) */}
      <div className="flex flex-col min-w-0 min-h-screen relative ">
        {/* Delikatne, ujednolicone tło dla całej prawej sekcji */}

        {/* TOPBAR */}
        {/* Tutaj powinieneś zaimportować i wstawić swój komponent Topbaru */}

        {/* DYNAMICZNY CONTENT (Hub, Wyjazdy, VOD, Dashboard) */}
        <main className="flex-1max-w-[1400px] w-full z-10 relative">
          {children}
        </main>
      </div>

      {/* 3. PASEK DOLNY (Tylko Mobile) */}
      {/* Tutaj powinieneś zaimportować i wstawić swój komponent Bottom Nav */}

      <Toaster
        position="top-center"
        gap={8}
        toastOptions={{
          classNames: {
            toast:
              "!bg-white !border !border-gray-100 !shadow-lg !rounded-2xl !font-montserrat !text-[#0B3B4C] !py-4 !px-5",
            title: "!font-jakarta !font-semibold !text-[14px] !text-[#0B3B4C]",
            description: "!text-[13px] !text-gray-500",
            success: "!border-l-4 !border-l-[#287D88]",
            error: "!border-l-4 !border-l-red-400",
          },
        }}
      />
    </div>
  );
}
