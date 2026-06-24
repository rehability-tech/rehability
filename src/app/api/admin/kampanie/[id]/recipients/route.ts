import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

/** Statusy odbiorców kampanii (do podglądu wysyłki). */
export async function GET(_req: Request, { params }: Params) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "ADMIN")
    return NextResponse.json({ error: "Brak uprawnień" }, { status: 403 });

  const { id } = await params;
  const recipients = await prisma.campaignRecipient.findMany({
    where: { campaignId: id },
    orderBy: { createdAt: "asc" },
    take: 2000,
    select: {
      id: true,
      email: true,
      status: true,
      error: true,
      sentAt: true,
      openedAt: true,
    },
  });

  return NextResponse.json(recipients);
}
