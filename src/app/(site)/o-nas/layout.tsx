import React from "react";
import type { Metadata } from "next";
import { getServerSession } from "next-auth";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { authOptions } from "@/lib/auth/auth";

export const metadata: Metadata = {
  title: "Piotr Siemaszko i Zespół Ekspertów",
  description:
    "Poznaj zespół Rehability Prudnik. Łączymy medyczny profesjonalizm z holistycznym podejściem do zdrowia, treningu siłowego i głębokiej regeneracji.",
  alternates: { canonical: "/o-nas" },
  openGraph: {
    title: "Piotr Siemaszko i Zespół Ekspertów",
    description:
      "Poznaj zespół Rehability Prudnik. Łączymy medyczny profesjonalizm z holistycznym podejściem do zdrowia, treningu siłowego i głębokiej regeneracji.",
    url: "/o-nas",
  },
};

export default async function AboutUsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);
  return (
    <div className="">
      <Navbar session={session} />
      {/* Poprawiony gradient: to-r (do prawej), from-brand-primary, to-white */}
      <div className="bg-gradient-to-r from-brand-[#DAFBFF] to-white min-h-screen">
        {children}
      </div>
      <Footer />
    </div>
  );
}
