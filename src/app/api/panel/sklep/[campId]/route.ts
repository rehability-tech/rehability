import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ campId: string }> }
) {
  const { campId } = await params;
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const services = await prisma.campService.findMany({
    where: { campId },
    include: {
      slots: {
        where: { isActive: true },
        include: { order: { select: { id: true } } },
        orderBy: { startTime: "asc" },
      },
    },
    orderBy: { name: "asc" },
  });

  const result = services.map((s) => ({
    id: s.id,
    name: s.name,
    duration: s.duration,
    price: Number(s.price),
    description: s.description,
    totalSlots: s.slots.length,
    availableSlots: s.slots.filter((slot) => slot.order === null).length,
    slots: s.slots.map((slot) => ({
      id: slot.id,
      startTime: slot.startTime.toISOString(),
      endTime: slot.endTime.toISOString(),
      isAvailable: slot.order === null,
    })),
  }));

  return NextResponse.json({ services: result });
}
