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
      <div className="min-h-screen flex flex-col lg:grid lg:grid-cols-[260px_1fr] font-montserrat  ">
        {/* KLIENCKI KOMPONENT SIDEBARA */}
        <AdminSidebar />
        <AdminMobileNavBar />
        {/* GŁÓWNY KONTENER NA TREŚĆ */}
        <main className="flex flex-col min-w-0 min-h-screen  bg-gradient-to-br to-brand-primary/15 via-transparent from-brand-yellow/5 pb-22">
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
          <div className="max-w-[1400px] mx-auto w-full flex-1">
            {/* Tailwind animations */}
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 ">
              {children}
            </div>
          </div>
        </main>
      </div>
    </>
  );
}
