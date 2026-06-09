import React from "react";
import AdminSidebar from "./_components/AdminSideBar";
import AdminTopbar from "./_components/AdminTopbar";
import { Toaster } from "sonner";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth/auth";
import { redirect } from "next/navigation";
import OneSignalProvider from "@/components/notifications/OneSignalProvider";
import NotificationPrompt from "@/components/notifications/NotificationPrompt";
import AdminMobileNavBar from "./_components/AdminMobileNavBar";
import AdminContentArea from "./_components/AdminContentArea";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Pobieranie sesji po stronie serwera
  const session = await getServerSession(authOptions);

  // --- GŁÓWNY CHECK BEZPIECZEŃSTWA ---
  if (!session || session.user?.role !== "ADMIN") {
    redirect("/logowanie");
  }

  const user = session.user;

  return (
    <>
      {/* 1. PROVIDERY POZA SIATKĄ GRID
        Dzięki temu nie zajmują miejsca w kolumnach i nie psują układu 
      */}
      <OneSignalProvider userId={user.id} />
      <NotificationPrompt />

      {/* 2. POPRAWIONY GRID 
        Na mobile to zwykły flex (jedna kolumna), a na desktopie (lg:) grid 2-kolumnowy o równej szerokości 260px
      */}
      <div className="min-h-screen flex flex-col lg:grid lg:grid-cols-[260px_1fr] font-montserrat bg-[#F7FAFB]">
        {/* KLIENCKI KOMPONENT SIDEBARA */}
        <AdminSidebar />
        <AdminMobileNavBar />
        {/* GŁÓWNY KONTENER NA TREŚĆ */}
        <main className="relative z-10 flex flex-col min-w-0 min-h-screen">
          {/* Dekoracyjne tła — miękki gradient + żółta i morska "kula" (bloby).
              Identyczne jak w panelu uczestniczki. overflow-hidden TYLKO tu,
              aby nie psuć `sticky` topbaru w rodzicu. */}
          <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
            <div className="absolute inset-0 bg-[linear-gradient(to_bottom,#dafbff_0%,#ffffff_50%,#f5fbfc_100%)] opacity-50" />
            <div className="absolute -top-40 -left-20 w-[420px] h-[420px] rounded-full bg-brand-primary/20 blur-[120px]" />
            <div className="absolute top-1/3 -right-32 w-[380px] h-[380px] rounded-full bg-brand-yellow/25 blur-[120px]" />
          </div>
          {/* KLIENCKI KOMPONENT TOPBARA */}
          <AdminTopbar user={user} />
          <Toaster
            position="top-right"
            gap={8}
            toastOptions={{
              classNames: {
                toast:
                  "!bg-white !border !border-gray-100 !shadow-lg !rounded-[16px] !rounded-tr-none !font-montserrat !text-[#0B3B4C] !py-4 !px-5",
                title:
                  "!font-jakarta !font-semibold !text-[14px] !text-[#0B3B4C]",
                description: "!text-[13px] !text-gray-500 !font-montserrat",
                success: "!border-l-4 !border-l-[#287D88]",
                error: "!border-l-4 !border-l-red-400",
                warning: "!border-l-4 !border-l-amber-400",
                info: "!border-l-4 !border-l-blue-400",
                closeButton:
                  "!bg-gray-100 !border-0 !text-gray-400 hover:!bg-gray-200 !rounded-full",
              },
            }}
          />

          {/* ZAWARTOŚĆ STRONY */}
          <AdminContentArea>{children}</AdminContentArea>
        </main>
      </div>
    </>
  );
}
