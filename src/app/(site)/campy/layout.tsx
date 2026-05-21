import React from "react";
import type { Metadata } from "next";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";

export const metadata: Metadata = {
  title: {
    default: "Campy | Rehability",
    template: "%s | Rehability",
  },
  description:
    "Ekskluzywne wyjazdy holistyczne Rehability. Całkowity reset dla ciała i umysłu.",
};

export default function AboutUsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="">
      <Navbar />
      {/* Poprawiony gradient: to-r (do prawej), from-brand-primary, to-white */}
      <div className="bg-gradient-to-r from-brand-[#dAFBFF] to-white min-h-screen">
        {children}
      </div>
      <Footer />
    </div>
  );
}
