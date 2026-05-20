import React from "react";
import AdminSidebar from "./_components/AdminSideBar";
import AdminTopbar from "./_components/AdminTopbar";
import { Toaster } from "sonner";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
// DODANO: Import funkcji redirect
import { redirect } from "next/navigation";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Pobieranie sesji po stronie serwera
  const session = await getServerSession(authOptions);

  // --- GŁÓWNY CHECK BEZPIECZEŃSTWA ---
  // Jeśli nie ma sesji (niezalogowany) ALBO rola to nie ADMIN -> wyrzucamy na logowanie
  if (!session || session.user?.role !== "ADMIN") {
    redirect("/logowanie");
  }

  const user = session.user;

  return (
    // Grid: na sztywno 250px dla sidebara, reszta dla kontentu
    <div className="min-h-screen bg-white grid grid-cols-[250px_1fr] font-montserrat">
      {/* KLIENCKI KOMPONENT SIDEBARA */}
      <AdminSidebar />

      {/* GŁÓWNY KONTENER NA TREŚĆ */}
      <main className="flex flex-col min-w-0 min-h-screen">
        {/* KLIENCKI KOMPONENT TOPBARA */}
        <AdminTopbar user={user} />
        <Toaster richColors position="top-center" />

        {/* ZAWARTOŚĆ STRONY */}
        <div className="max-w-[1400px] mx-auto w-full flex-1">
          {/* Tailwind animations */}
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
