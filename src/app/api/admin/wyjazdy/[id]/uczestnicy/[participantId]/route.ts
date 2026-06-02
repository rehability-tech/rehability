import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth/auth";
import { prisma } from "@/lib/prisma";
import { resolvePackage, PACKAGE_RELATION_SELECT } from "@/lib/bookings/partner";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; participantId: string }> },
) {
  const { id: tripId, participantId } = await params;
  const session = await getServerSession(authOptions);

  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const participant = await prisma.booking.findUnique({
      where: { id: participantId },
      include: {
        trip: { select: { id: true, title: true, startDate: true } },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
            healthProfile: true,
          },
        },
        serviceOrders: {
          where: { status: { not: "CANCELLED" } },
          include: {
            service: { select: { name: true, duration: true, price: true } },
            spaBlock: { select: { startTime: true, endTime: true } },
          },
          orderBy: { createdAt: "asc" },
        },
        ...PACKAGE_RELATION_SELECT,
      },
    });

    // Pilnujemy, by rezerwacja faktycznie należała do tego wyjazdu.
    if (!participant || participant.tripId !== tripId) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const pkg = resolvePackage(participant);
    const packagePartner = pkg
      ? {
          bookingId: pkg.partner.bookingId,
          name: pkg.partner.name,
          relation: pkg.partner.relation,
          active: pkg.active,
        }
      : null;

    return NextResponse.json({ participant: { ...participant, packagePartner } });
  } catch (error) {
    console.error(
      "[GET /api/admin/wyjazdy/[id]/uczestnicy/[participantId]]",
      error,
    );
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
