import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth/auth";
import { prisma } from "@/lib/prisma";
import { FEATURES } from "@/lib/featureFlags";

const featureDisabledResponse = () =>
  NextResponse.json(
    { error: "Funkcja „Szablony maili” jest obecnie niedostępna." },
    { status: 503 },
  );

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Params) {
  if (!FEATURES.emailTemplates) return featureDisabledResponse();

  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Brak uprawnień" }, { status: 403 });
  }

  const { id } = await params;
  const template = await prisma.emailTemplate.findUnique({ where: { id } });
  if (!template) {
    return NextResponse.json({ error: "Nie znaleziono" }, { status: 404 });
  }

  return NextResponse.json(template);
}

export async function PATCH(req: Request, { params }: Params) {
  if (!FEATURES.emailTemplates) return featureDisabledResponse();

  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Brak uprawnień" }, { status: 403 });
  }

  const { id } = await params;
  const body = await req.json();
  const { name, subject, sections, category, status } = body;

  const template = await prisma.emailTemplate.update({
    where: { id },
    data: {
      ...(name !== undefined && { name }),
      ...(subject !== undefined && { subject }),
      ...(sections !== undefined && { sections }),
      ...(category !== undefined && { category }),
      ...(status !== undefined && { status }),
    },
  });

  return NextResponse.json(template);
}

export async function DELETE(_req: Request, { params }: Params) {
  if (!FEATURES.emailTemplates) return featureDisabledResponse();

  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Brak uprawnień" }, { status: 403 });
  }

  const { id } = await params;
  await prisma.emailTemplate.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
