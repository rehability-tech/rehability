import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth/auth";
import { prisma } from "@/lib/prisma";
import { resolveLoyalty } from "@/lib/crm/loyalty";
import type {
  ClientBooking,
  ClientProfileData,
  ClientServiceOrder,
} from "@/lib/crm/types";

/**
 * GET /api/admin/klienci/[id]
 *
 * Zwraca kompletny profil 360° klienta (User z rezerwacjami). Logika pobrania,
 * wyliczenia LTV i serializacji (Decimal/Date -> number/ISO) żyje tutaj, aby
 * strona profilu mogła być lekkim Client Component renderującym się natychmiast
 * po nawigacji i dociągającym dane asynchronicznie.
 *
 * Autoryzacja: tylko ADMIN (obrona w głąb — niezależnie od guardu w layoutcie).
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const session = await getServerSession(authOptions);

  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        healthProfile: true,
        bookings: {
          where: { status: { not: "CANCELLED" } },
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            status: true,
            amountPaid: true,
            amountTotal: true,
            phone: true,
            createdAt: true,
            trip: {
              select: {
                id: true,
                title: true,
                location: true,
                startDate: true,
                endDate: true,
                heroImage: true,
              },
            },
            serviceOrders: {
              where: { status: { not: "CANCELLED" } },
              orderBy: { createdAt: "desc" },
              select: {
                id: true,
                status: true,
                price: true,
                startTime: true,
                service: { select: { name: true } },
              },
            },
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    // ── Kalkulacje LTV + serializacja ─────────────────────────────────────
    const tripsCount = user.bookings.length;
    const totalSpent =
      user.bookings.reduce((sum, b) => sum + (b.amountPaid || 0), 0) / 100;
    const phone = user.bookings.find((b) => b.phone)?.phone ?? null;

    let spaCount = 0;
    const bookings: ClientBooking[] = user.bookings.map((b) => {
      const serviceOrders: ClientServiceOrder[] = b.serviceOrders.map((o) => ({
        id: o.id,
        status: o.status,
        price: Number(o.price),
        startTime: o.startTime ? o.startTime.toISOString() : null,
        serviceName: o.service?.name ?? "Usługa",
      }));
      spaCount += serviceOrders.length;

      return {
        id: b.id,
        status: b.status,
        amountPaid: (b.amountPaid || 0) / 100,
        amountTotal: (b.amountTotal || 0) / 100,
        createdAt: b.createdAt.toISOString(),
        trip: b.trip
          ? {
              id: b.trip.id,
              title: b.trip.title,
              location: b.trip.location,
              startDate: b.trip.startDate
                ? b.trip.startDate.toISOString()
                : null,
              endDate: b.trip.endDate ? b.trip.endDate.toISOString() : null,
              heroImage: b.trip.heroImage,
            }
          : null,
        serviceOrders,
      };
    });

    const data: ClientProfileData = {
      id: user.id,
      name: user.name,
      email: user.email,
      image: user.image,
      phone,
      loyalty: resolveLoyalty(totalSpent, tripsCount),
      totalSpent,
      tripsCount,
      spaCount,
      bookings,
      health: user.healthProfile
        ? {
            dietType: user.healthProfile.dietType,
            foodIntolerances: user.healthProfile.foodIntolerances,
            foodNotes: user.healthProfile.foodNotes,
            chronicConditions: user.healthProfile.chronicConditions,
            medications: user.healthProfile.medications,
            injuries: user.healthProfile.injuries,
            allergies: user.healthProfile.allergies,
            emergencyName: user.healthProfile.emergencyName,
            emergencyPhone: user.healthProfile.emergencyPhone,
          }
        : null,
    };

    return NextResponse.json({ client: data });
  } catch (error) {
    console.error("[GET /api/admin/klienci/[id]]", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
