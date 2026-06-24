import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import crypto from "crypto";

export const dynamic = "force-dynamic";

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  return session?.user?.role === "ADMIN";
}

/** Lista kontaktów (opcjonalne filtry: ?source=&status=&q=). */
export async function GET(req: Request) {
  if (!(await requireAdmin()))
    return NextResponse.json({ error: "Brak uprawnień" }, { status: 403 });

  const url = new URL(req.url);
  const source = url.searchParams.get("source");
  const status = url.searchParams.get("status");
  const q = url.searchParams.get("q")?.trim();

  const where: Record<string, unknown> = {};
  if (source) where.sources = { has: source };
  if (status) where.status = status;
  if (q)
    where.OR = [
      { email: { contains: q, mode: "insensitive" } },
      { name: { contains: q, mode: "insensitive" } },
    ];

  const contacts = await prisma.contact.findMany({
    where,
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      email: true,
      name: true,
      status: true,
      sources: true,
      tags: true,
      userId: true,
      createdAt: true,
    },
    take: 1000,
  });

  return NextResponse.json(contacts);
}

const createSchema = z.object({
  email: z.string().email(),
  name: z.string().trim().max(200).optional(),
  tags: z.array(z.string()).optional(),
});

/** Ręczne dodanie kontaktu (źródło "Ręczny"). */
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

  const email = parsed.data.email.toLowerCase();
  try {
    const contact = await prisma.contact.create({
      data: {
        email,
        name: parsed.data.name ?? null,
        tags: parsed.data.tags ?? [],
        sources: ["Ręczny"],
        unsubscribeToken: crypto.randomBytes(24).toString("base64url"),
        lastSyncedAt: new Date(),
      },
    });
    return NextResponse.json(contact, { status: 201 });
  } catch (e: unknown) {
    if (
      e &&
      typeof e === "object" &&
      "code" in e &&
      (e as { code?: string }).code === "P2002"
    )
      return NextResponse.json(
        { error: "Kontakt z tym adresem już istnieje." },
        { status: 409 },
      );
    console.error("[kontakty] create error:", e);
    return NextResponse.json({ error: "Błąd serwera." }, { status: 500 });
  }
}
