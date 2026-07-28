import React from "react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/auth";

// Metadata dla /wydarzenia i /wydarzenia/[slug] definiujemy odpowiednio w page.tsx
// oraz generateMetadata — tu trzymamy tylko layout, by nie nadpisywać
// `title.template` z root layoutu i nie powielać sufiksu marki.

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
