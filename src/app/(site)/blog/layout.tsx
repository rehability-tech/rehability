import React from "react";
import type { Metadata } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth/auth";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";

export const metadata: Metadata = {
  title: {
    default: "Blog | Rehability",
    template: "%s | Rehability",
  },
  description:
    "Sprawdzona wiedza z zakresu fizjoterapii, mindfulness i zdrowego stylu LLycia — pisana przez specjalistAlw Rehability.",
};

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
