import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

export const dynamic = "force-dynamic";

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  return session?.user?.role === "ADMIN";
}

/** Lista kampanii ze statystykami. */
export async function GET() {
  if (!(await requireAdmin()))
    return NextResponse.json({ error: "Brak uprawnień" }, { status: 403 });

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
      failedCount: true,
      filterSources: true,
      filterTags: true,
      scheduledAt: true,
      sentAt: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return NextResponse.json(campaigns);
}

const createSchema = z.object({
  name: z.string().trim().min(1, "Nazwa jest wymagana").max(200),
  subject: z.string().trim().max(500).optional(),
  sections: z.any().optional(),
  fromName: z.string().trim().max(200).optional(),
  fromEmail: z.string().trim().max(200).optional(),
  ctaUrl: z.string().trim().max(1000).optional(),
  filterSources: z.array(z.string()).optional(),
  filterTags: z.array(z.string()).optional(),
  filterStatus: z.string().optional(),
});

/** Utworzenie kampanii (DRAFT). */
export async function POST(req: Request) {
  if (!(await requireAdmin()))
    return NextResponse.json({ error: "Brak uprawnień" }, { status: 403 });

  const body = await req.json().catch(() => null);
  const parsed = createSchema.safeParse(body);
  if (!parsed.success)
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Nieprawidłowe dane" },
      { status: 400 },
    );

  const d = parsed.data;
  const campaign = await prisma.campaign.create({
    data: {
      name: d.name,
      subject: d.subject ?? "",
      sections: d.sections ?? [],
      fromName: d.fromName,
      fromEmail: d.fromEmail,
      ctaUrl: d.ctaUrl,
      filterSources: d.filterSources ?? [],
      filterTags: d.filterTags ?? [],
      filterStatus: d.filterStatus ?? "SUBSCRIBED",
      status: "DRAFT",
    },
  });

  return NextResponse.json(campaign, { status: 201 });
}
