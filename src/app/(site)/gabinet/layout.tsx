import React from "react";
import { getServerSession } from "next-auth";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { authOptions } from "@/lib/auth/auth";

// Metadata dla /gabinet jest w page.tsx — layout pełni tylko rolę shellu.

export default async function GabinetLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);
  return (
    <main className="flex flex-col min-h-screen">
      <Navbar session={session} />
      {children}
      <Footer />
    </main>
  );
}
