import { redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";
import { Footer } from "@/components/layout/Footer";
import { Navbar } from "@/components/layout/Navbar";
import AuthCard from "./_components/AuthCard";
import { authOptions } from "@/lib/auth/auth";

export default async function LoginPage() {
  // 1. Pobierz sesję na serwerze
  const session = await getServerSession(authOptions);

  // 2. Jeśli użytkownik jest zalogowany, od razu przekieruj go do panelu
  if (session) {
    redirect("/panel");
  }

  return (
    <div className="flex flex-col bg-gradient-to-br from-[#EBF9FA] to-[#FFFFFF]">
      <Navbar session={session} />

      {/* ─── KONTENER GŁÓWNY (CENTROWANIE KARTY LOGOWANIA) ──────────────── */}
      {/* Dodajemy id="auth-main" aby AuthCard mogło do niego prescrollować */}
      <main id="auth-main" className="flex h-screen z-50">
        <AuthCard />
      </main>

      <Footer />
    </div>
  );
}
