import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { FEATURES } from "@/lib/featureFlags";

const featureDisabledResponse = () =>
  NextResponse.json(
    { error: "Funkcja „Szablony maili” jest obecnie niedostępna." },
    { status: 503 },
  );

const createTemplateSchema = z.object({
  name: z.string().trim().min(1, "Nazwa jest wymagana").max(200),
  subject: z.string().trim().min(1, "Temat jest wymagany").max(500),
  sections: z.any().optional(),
  category: z.string().trim().max(100).optional(),
  status: z.string().trim().max(50).optional(),
});

export async function GET() {
  if (!FEATURES.emailTemplates) return featureDisabledResponse();

  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Brak uprawnień" }, { status: 403 });
  }

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

  return NextResponse.json(templates);
}

export async function POST(req: Request) {
  if (!FEATURES.emailTemplates) return featureDisabledResponse();

  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Brak uprawnień" }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  const parsed = createTemplateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Nieprawidłowe dane" },
      { status: 400 },
    );
  }
  const { name, subject, sections, category, status } = parsed.data;

  const template = await prisma.emailTemplate.create({
    data: {
      name,
      subject,
      sections: sections ?? [],
      category: category ?? "general",
      status: status ?? "DRAFT",
    },
  });

  return NextResponse.json(template, { status: 201 });
}
