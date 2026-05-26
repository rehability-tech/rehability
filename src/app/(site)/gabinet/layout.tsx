import React from "react";
import { Metadata } from "next";
import { getServerSession } from "next-auth";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { authOptions } from "@/lib/auth/auth";

export const metadata: Metadata = {
  title: "Gabinet | Rehability",
  description:
    "Precyzyjna diagnostyka i holistyczna praca z ciałem w komfortowej przestrzeni naszego gabinetu.",
};

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
