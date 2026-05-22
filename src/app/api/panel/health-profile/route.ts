import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const healthSchema = z.object({
  dietType: z.string().optional(),
  foodIntolerances: z.array(z.string()).optional(),
  foodNotes: z.string().optional(),
  chronicConditions: z.string().optional(),
  medications: z.string().optional(),
  injuries: z.string().optional(),
  allergies: z.string().optional(),
  emergencyName: z.string().optional(),
  emergencyPhone: z.string().optional(),
});

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const profile = await prisma.healthProfile.findUnique({
    where: { userId: session.user.id },
  });

  return NextResponse.json({ profile });
}

export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const parsed = healthSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "NieprawidL‚owe dane" }, { status: 400 });
  }

  const profile = await prisma.healthProfile.upsert({
    where: { userId: session.user.id },
    create: { userId: session.user.id, ...parsed.data },
    update: { ...parsed.data },
  });

  return NextResponse.json({ profile });
}
