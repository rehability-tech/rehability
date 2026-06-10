import React from "react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/auth";

// Metadata dla /kursy definiujemy w page.tsx — tutaj trzymamy tylko layout,
// żeby nie nadpisywać title.template z root layoutu.

export default async function KursyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);
  return (
    <div>
      <Navbar session={session} />
      {/* Gradient tła z projektu Figma (jasny cyan -> biel) */}
      <div
        className="min-h-screen"
        style={{
          backgroundImage:
            "linear-gradient(121.854deg, rgb(218, 251, 255) 26.545%, rgb(255, 255, 255) 82.635%)",
        }}
      >
        {children}
      </div>
      <Footer />
    </div>
  );
}
