import { redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth/auth";
import { prisma } from "@/lib/prisma";
import EmailTemplatesList from "./_components/EmailTemplatesList";

export const dynamic = "force-dynamic";

export default async function EmailTemplatesPage() {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "ADMIN") redirect("/logowanie");

  const templates = await prisma.emailTemplate.findMany({
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      name: true,
      subject: true,
      category: true,
      status: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return <EmailTemplatesList templates={templates} />;
}
