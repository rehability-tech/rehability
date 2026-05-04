import React from "react";
import { Metadata } from "next";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/sections/Footer";

export const metadata: Metadata = {
  title: "Gabinet | Rehability",
  description:
    "Precyzyjna diagnostyka i holistyczna praca z ciałem w komfortowej przestrzeni naszego gabinetu.",
};

export default function GabinetLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main className="flex flex-col min-h-screen">
      <Navbar />
      {children}
      <Footer />
    </main>
  );
}
