import React from "react";
import type { Metadata } from "next";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/auth";

export const metadata: Metadata = {
  title: {
    default: "Wyjazdy | Rehability",
    template: "%s | Rehability",
  },
  description:
    "Ekskluzywne wyjazdy holistyczne Rehability. Całkowity reset dla ciała i umysłu.",
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
      <div className="bg-gradient-to-r from-brand-[#dAFBFF] to-white min-h-screen">
        {children}
      </div>
      <Footer />
    </div>
  );
}
