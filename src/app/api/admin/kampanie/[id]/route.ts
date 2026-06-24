import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  return session?.user?.role === "ADMIN";
}

export async function GET(_req: Request, { params }: Params) {
  if (!(await requireAdmin()))
    return NextResponse.json({ error: "Brak uprawnień" }, { status: 403 });

  const { id } = await params;
  const campaign = await prisma.campaign.findUnique({ where: { id } });
  if (!campaign)
    return NextResponse.json({ error: "Nie znaleziono" }, { status: 404 });

  return NextResponse.json(campaign);
}

const patchSchema = z.object({
  name: z.string().trim().min(1).max(200).optional(),
  subject: z.string().trim().max(500).optional(),
  sections: z.any().optional(),
  fromName: z.string().trim().max(200).nullable().optional(),
  fromEmail: z.string().trim().max(200).nullable().optional(),
  ctaUrl: z.string().trim().max(1000).nullable().optional(),
  filterSources: z.array(z.string()).optional(),
  filterTags: z.array(z.string()).optional(),
  filterStatus: z.string().optional(),
});

export async function PATCH(req: Request, { params }: Params) {
  if (!(await requireAdmin()))
    return NextResponse.json({ error: "Brak uprawnień" }, { status: 403 });

  const { id } = await params;

  // Po wysłaniu kampanii blokujemy edycję treści/segmentu (spójność statystyk).
  const current = await prisma.campaign.findUnique({
    where: { id },
    select: { status: true },
  });
  if (!current)
    return NextResponse.json({ error: "Nie znaleziono" }, { status: 404 });
  if (current.status !== "DRAFT" && current.status !== "SCHEDULED")
    return NextResponse.json(
      { error: "Kampania jest już w trakcie wysyłki lub wysłana." },
      { status: 409 },
    );

  const body = await req.json().catch(() => null);
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success)
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Nieprawidłowe dane" },
      { status: 400 },
    );

  const campaign = await prisma.campaign.update({
    where: { id },
    data: parsed.data,
  });
  return NextResponse.json(campaign);
}

export async function DELETE(_req: Request, { params }: Params) {
  if (!(await requireAdmin()))
    return NextResponse.json({ error: "Brak uprawnień" }, { status: 403 });

  const { id } = await params;
  await prisma.campaign.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
