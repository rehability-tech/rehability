"use client";

import React, { useState } from "react";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import AdminSidebar from "@/components/sections/admin/ui/AdminSideBar";
import AdminTopbar from "@/components/sections/admin/ui/AdminTopbar";
import { Toaster } from "sonner";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    // ZMIANA: Dodajemy CSS Grid. 1 kolumna domyślnie, 2 kolumny na 'md' (250px + reszta)
    <div className="min-h-screen bg-white grid grid-cols-1 md:grid-cols-[250px_1fr] font-montserrat">
      {/* KOMPONENT SIDEBARA */}
      <AdminSidebar
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
      />

      {/* GŁÓWNY KONTENER NA TREŚĆ */}
      {/* ZMIANA: Usunęliśmy md:ml-[260px], bo Grid robi to za nas! */}
      <main className="flex flex-col min-w-0 min-h-screen">
        {/* KOMPONENT TOPBARA */}
        <AdminTopbar onOpenMobileMenu={() => setIsMobileMenuOpen(true)} />
        <Toaster richColors position="top-center" />

        {/* ZAWARTOŚĆ STRONY */}
        <div className="max-w-[1400px] mx-auto w-full flex-1 ">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            {children}
          </motion.div>
        </div>
      </main>
    </div>
  );
}
