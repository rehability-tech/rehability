import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";
import { Footer } from "@/components/layout/Footer";
import { Navbar } from "@/components/layout/Navbar";
import HideInStandalone from "@/components/pwa/HideInStandalone";
import ShowInStandalone from "@/components/pwa/ShowInStandalone";
import AuthCard from "./_components/AuthCard";
import { authOptions } from "@/lib/auth/auth";

export const metadata: Metadata = {
  title: "Logowanie",
  description: "Zaloguj się do platformy Rehability.",
  robots: { index: false, follow: false },
};

export default async function LoginPage() {
  // 1. Pobierz sesję na serwerze
  const session = await getServerSession(authOptions);

  // 2. Jeśli użytkownik jest zalogowany, od razu przekieruj go do panelu
  if (session) {
    redirect("/panel");
  }

  return (
    <div className="flex flex-col bg-gradient-to-br from-[#EBF9FA] to-[#FFFFFF] [@media(display-mode:standalone)]:h-screen [@media(display-mode:standalone)]:overflow-hidden">
      <HideInStandalone>
        <Navbar session={session} />
      </HideInStandalone>

      {/* ─── KONTENER GŁÓWNY (CENTROWANIE KARTY LOGOWANIA) ──────────────── */}
      {/* Dodajemy id="auth-main" aby AuthCard mogło do niego prescrollować.
          W trybie PWA (standalone) ekran jest stały i nie-scrollowalny — jak
          natywny ekran logowania — z logotypem nad kartą. */}
      <main
        id="auth-main"
        className="flex flex-col items-center justify-center h-screen z-50 [@media(display-mode:standalone)]:fixed [@media(display-mode:standalone)]:inset-0 [@media(display-mode:standalone)]:overflow-hidden [@media(display-mode:standalone)]:px-4 [@media(display-mode:standalone)]:pt-[env(safe-area-inset-top)] [@media(display-mode:standalone)]:pb-[env(safe-area-inset-bottom)]"
      >
        <ShowInStandalone>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/logotypy/logo-primary.svg"
            alt="Rehability"
            className="h-12 sm:h-14 w-auto mb-8 shrink-0 select-none pointer-events-none"
          />
        </ShowInStandalone>

        <AuthCard />
      </main>

      <HideInStandalone>
        <Footer />
      </HideInStandalone>
    </div>
  );
}
