import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { Wrench } from "@phosphor-icons/react/dist/ssr";
import { getServerSession } from "next-auth";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { authOptions } from "@/lib/auth/auth";

export const metadata: Metadata = {
  title: "W budowie",
  robots: { index: false, follow: false },
};

export default async function UnderConstructionPage() {
  const session = await getServerSession(authOptions);
  return (
    <main className="min-h-[80vh] flex flex-col items-center justify-center px-4 text-center ">
      <Navbar session={session} />
      <div className="w-24 h-24 bg-[#ECF6F6] rounded-full flex items-center justify-center mb-8 shadow-sm mt-24">
        <Wrench size={48} weight="duotone" className="text-[#287D88]" />
      </div>

      {/* Nagłówek */}
      <h1 className="font-jakarta font-bold text-[40px] md:text-[56px] text-[#0B3B4C] leading-tight mb-4">
        Sekcja w <span className="text-[#287D88]">budowie</span>
      </h1>

      {/* Opis */}
      <p className="font-montserrat text-[#0B3B4C]/80 text-[16px] md:text-[18px] max-w-[500px] mb-10 leading-relaxed">
        Pracujemy nad tym, aby ta część naszej strony była równie świetna jak
        reszta. Zajrzyj tu ponownie za jakiś czas!
      </p>

      {/* Przycisk powrotu */}
      <Link
        href="/"
        className="bg-[#287D88] text-white font-montserrat font-semibold text-[16px] px-8 py-4 rounded-full shadow-md hover:bg-[#1a5b63] transition-colors active:scale-95 flex items-center gap-2"
      >
        Wróć do strony głównej
      </Link>
      <Footer></Footer>
    </main>
  );
}
