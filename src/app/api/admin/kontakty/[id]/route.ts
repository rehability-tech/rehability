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

const patchSchema = z.object({
  name: z.string().trim().max(200).nullable().optional(),
  tags: z.array(z.string()).optional(),
  status: z
    .enum(["SUBSCRIBED", "UNSUBSCRIBED", "BOUNCED", "COMPLAINED"])
    .optional(),
});

/** Edycja kontaktu — tagi ręczne / status / nazwa. */
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await requireAdmin()))
    return NextResponse.json({ error: "Brak uprawnień" }, { status: 403 });

  const { id } = await params;
  const body = await req.json().catch(() => null);
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success)
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Nieprawidłowe dane" },
      { status: 400 },
    );

  const contact = await prisma.contact.update({
    where: { id },
    data: parsed.data,
  });
  return NextResponse.json(contact);
}

/** Usunięcie kontaktu z bazy (wraz z jego pozycjami w kampaniach). */
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await requireAdmin()))
    return NextResponse.json({ error: "Brak uprawnień" }, { status: 403 });

  const { id } = await params;
  await prisma.contact.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
