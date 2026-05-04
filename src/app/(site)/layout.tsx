// src/app/(site)/layout.tsx

import { Navbar } from "@/components/layout/Navbar";

export default function SiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    // bg-gradient-main pochodzi z globalnego CSS (linear-gradient dołączony z Twoich tokenów)
    <div className="min-h-screen flex flex-col relative  ">
      {/* Pading-top kompensuje absolutne pozycjonowanie Navbara. pt-24 (96px) to bezpieczny start */}
      {children}

      {/* <Footer /> */}
    </div>
  );
}
