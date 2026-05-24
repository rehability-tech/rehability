import React from "react";
import { getServerSession } from "next-auth/next";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth/auth";
import { Toaster } from "sonner";
import UserMobileBottomNav from "./_components/UserMobileBottomNav";
import OneSignalProvider from "@/components/notifications/OneSignalProvider";
import NotificationPrompt from "@/components/notifications/NotificationPrompt";

export default async function PanelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/logowanie");
  }

  return (
    <div className="relative min-h-screen font-montserrat overflow-x-hidden">
      <OneSignalProvider userId={session.user.id} />
      <NotificationPrompt />

      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-[linear-gradient(to_bottom,#dafbff_0%,#ffffff_50%,#f5fbfc_100%)]" />
        <div className="absolute -top-40 -left-20 w-[420px] h-[420px] rounded-full bg-brand-primary/20 blur-[120px]" />
        <div className="absolute top-1/3 -right-32 w-[380px] h-[380px] rounded-full bg-brand-yellow/25 blur-[120px]" />
      </div>
      <Toaster
        position="top-center"
        gap={8}
        toastOptions={{
          classNames: {
            toast:
              "!bg-white !border !border-gray-100 !shadow-lg !rounded-2xl !font-montserrat !text-[#0B3B4C] !py-4 !px-5",
            title: "!font-jakarta !font-semibold !text-[14px] !text-[#0B3B4C]",
            description: "!text-[13px] !text-gray-500",
            success: "!border-l-4 !border-l-[#287D88]",
            error: "!border-l-4 !border-l-red-400",
          },
        }}
      />
      <main className="pb-28 lg:pb-0 max-w-md lg:max-w-none mx-auto lg:mx-0 w-full px-4 lg:px-0">
        {children}
      </main>
      <UserMobileBottomNav />
    </div>
  );
}
