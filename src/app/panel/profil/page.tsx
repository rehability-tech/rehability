import type { Metadata } from "next";
import { getServerSession } from "next-auth/next";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth/auth";
import ProfileClient from "./_components/ProfileClient";

export const metadata: Metadata = {
  title: "Mój profil",
  robots: { index: false, follow: false },
};

export default async function ProfilePage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/logowanie");

  const user = {
    name: session.user.name ?? null,
    email: session.user.email ?? null,
    image: session.user.image ?? null,
    role: (session.user as { role?: string }).role ?? "USER",
  };

  return <ProfileClient user={user} />;
}
