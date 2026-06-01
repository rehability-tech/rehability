import React from "react";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth/auth";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";

// Metadata dla /blog i /blog/[blogSlug] definiujemy w page.tsx + generateMetadata.

export default async function BlogLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Navbar session={session} />
      <div className="flex-1">{children}</div>
      <Footer />
    </div>
  );
}
