import { redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth/auth";
import { prisma } from "@/lib/prisma";
import CampaignsList from "./_components/CampaignsList";

export const dynamic = "force-dynamic";

export default async function CampaignsPage() {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "ADMIN") redirect("/logowanie");

  const campaigns = await prisma.campaign.findMany({
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      name: true,
      subject: true,
      status: true,
      totalRecipients: true,
      sentCount: true,
      deliveredCount: true,
      openedCount: true,
      bouncedCount: true,
      filterSources: true,
      sentAt: true,
      updatedAt: true,
    },
  });

  return (
    <CampaignsList
      campaigns={campaigns.map((c) => ({
        ...c,
        sentAt: c.sentAt?.toISOString() ?? null,
        updatedAt: c.updatedAt.toISOString(),
      }))}
    />
  );
}
