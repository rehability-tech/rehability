import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/requireAdmin";
import { prisma } from "@/lib/prisma";

const VALID_STATUSES = ["PLANNED", "IN_PROGRESS", "PUBLISHED", "SKIPPED"];

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { isAuthorized, response } = await requireAdmin();
  if (!isAuthorized) return response as NextResponse;

  const { id } = await params;
  const entry = await prisma.blogScheduleEntry.findUnique({ where: { id } });
  if (!entry) return NextResponse.json({ error: "Nie znaleziono wpisu" }, { status: 404 });
  return NextResponse.json(entry);
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { isAuthorized, response } = await requireAdmin();
  if (!isAuthorized) return response as NextResponse;

  const { id } = await params;
  const body = await req.json();
  const { status } = body;

  if (!status || !VALID_STATUSES.includes(status)) {
    return NextResponse.json({ error: "Nieprawidłowy status" }, { status: 400 });
  }

  const entry = await prisma.blogScheduleEntry.update({
    where: { id },
    data: { status },
  });

  return NextResponse.json(entry);
}
