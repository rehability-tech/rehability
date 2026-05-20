import { Footer } from "@/components/layout/Footer";
import { Navbar } from "@/components/layout/Navbar";
import AuthCard from "@/components/sections/logowanie/AuthCard";

export default function LoginPage() {
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-[#EBF9FA] to-[#FFFFFF]">
      <Navbar />

      {/* ─── KONTENER GŁÓWNY (CENTROWANIE KARTY LOGOWANIA) ──────────────── */}
      <main className="flex-grow flex items-center justify-center py-12 md:py-20 relative overflow-hidden">
        <div className="container flex justify-center z-10">
          <AuthCard />
        </div>
      </main>

      <Footer />
    </div>
  );
}
