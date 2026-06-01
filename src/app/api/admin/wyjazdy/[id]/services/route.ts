import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/requireAdmin";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireAdmin();
  if (!auth.isAuthorized) return auth.response;

  const { id: tripId } = await params;

  const trip = await prisma.trip.findUnique({
    where: { id: tripId },
    select: { id: true },
  });
  if (!trip) {
    return NextResponse.json({ error: "Wyjazd nie istnieje." }, { status: 404 });
  }

  const services = await prisma.tripService.findMany({
    where: { tripId },
    select: {
      id: true,
      name: true,
      duration: true,
      price: true,
      description: true,
      image: true,
    },
    orderBy: { name: "asc" },
  });

  return NextResponse.json({
    services: services.map((s) => ({
      id: s.id,
      name: s.name,
      duration: s.duration,
      price: Number(s.price),
      description: s.description,
      image: s.image,
    })),
  });
}
