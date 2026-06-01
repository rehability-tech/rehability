import React from "react";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth/auth";
import { prisma } from "@/lib/prisma";
import { resolveLoyalty } from "@/lib/crm/loyalty";
import type { CrmClient } from "@/lib/crm/types";
import GlobalCrmList from "./_components/GlobalCrmList";

// Dane CRM zależą od bieżącego stanu rezerwacji — nie cache'ujemy statycznie.
export const dynamic = "force-dynamic";

/**
 * Server Component — punkt wejścia modułu CRM 360° (lista klientów).
 *
 * Odpowiedzialności (SRP):
 *   1. Autoryzacja (tylko ADMIN).
 *   2. Pojedyncze, zagnieżdżone zapytanie Prisma (brak N+1).
 *   3. Wyliczenie LTV + segmentacji na serwerze.
 *   4. Serializacja i przekazanie do Client Component.
 *
 * Klientem jest User z co najmniej jedną rezerwacją — nie tworzymy osobnej tabeli.
 */
export default async function GlobalCrmPage() {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "ADMIN") {
    redirect("/logowanie");
  }

  // Jedno zapytanie z zagnieżdżeniem `bookings` — Prisma robi JOIN/batch,
  // więc nie generujemy zapytania na każdego klienta (omijamy N+1).
  const users = await prisma.user.findMany({
    where: { bookings: { some: {} } },
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
      healthProfile: { select: { id: true } },
      bookings: {
        where: { status: { not: "CANCELLED" } },
        select: { amountPaid: true, phone: true, createdAt: true },
      },
    },
    orderBy: { name: "asc" },
  });

  // Mapowanie + kalkulacje LTV/lojalności na serwerze.
  const clients: CrmClient[] = users.map((u) => {
    const tripsCount = u.bookings.length;
    const totalSpent =
      u.bookings.reduce((sum, b) => sum + (b.amountPaid || 0), 0) / 100;

    // Telefon trzymany jest na rezerwacji — bierzemy najnowszy uzupełniony.
    const phone =
      [...u.bookings]
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
        .find((b) => b.phone)?.phone ?? null;

    return {
      id: u.id,
      name: u.name,
      email: u.email,
      image: u.image,
      phone,
      tripsCount,
      totalSpent,
      loyalty: resolveLoyalty(totalSpent, tripsCount),
      hasHealthProfile: !!u.healthProfile,
    };
  });

  return <GlobalCrmList clients={clients} />;
}
