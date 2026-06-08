import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const schema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Imię i nazwisko jest za krótkie")
    .max(80, "Imię i nazwisko jest za długie"),
});

export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Nieprawidłowe dane" },
      { status: 400 },
    );
  }

  const updated = await prisma.user.update({
    where: { id: session.user.id },
    data: { name: parsed.data.name },
    select: { name: true },
  });

  return NextResponse.json({ user: updated });
}
