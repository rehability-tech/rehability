import React from "react";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth/auth";
import { prisma } from "@/lib/prisma";
import { resolveLoyalty } from "@/lib/crm/loyalty";
import type { CrmContact, ContactStatus } from "@/lib/crm/types";
import CrmExplorer from "./_components/CrmExplorer";

// Dane CRM zależą od bieżącego stanu kontaktów — nie cache'ujemy statycznie.
export const dynamic = "force-dynamic";

/**
 * Server Component — punkt wejścia modułu CRM (zunifikowana baza kontaktów).
 *
 * Źródłem prawdy jest tabela `Contact` (klienci wydarzeń + kursanci VOD +
 * newsletter, deduplikowani po e-mailu, z tagami źródła). Dla kontaktów
 * powiązanych z kontem (`userId`) dociągamy LTV/wydarzenia/kartę zdrowia jednym
 * zagnieżdżonym zapytaniem (bez N+1).
 */
export default async function GlobalCrmPage() {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "ADMIN") {
    redirect("/logowanie");
  }

  const contacts = await prisma.contact.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      email: true,
      name: true,
      status: true,
      sources: true,
      tags: true,
      userId: true,
      createdAt: true,
      user: {
        select: {
          image: true,
          healthProfile: { select: { id: true } },
          bookings: {
            where: { status: { not: "CANCELLED" } },
            select: { amountPaid: true, phone: true, createdAt: true },
          },
        },
      },
    },
  });

  const mapped: CrmContact[] = contacts.map((c) => {
    const bookings = c.user?.bookings ?? [];
    const tripsCount = bookings.length;
    const totalSpent =
      bookings.reduce((sum, b) => sum + (b.amountPaid || 0), 0) / 100;
    const phone =
      [...bookings]
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
        .find((b) => b.phone)?.phone ?? null;

    return {
      id: c.id,
      name: c.name,
      email: c.email,
      image: c.user?.image ?? null,
      phone,
      sources: c.sources,
      tags: c.tags,
      status: c.status as ContactStatus,
      userId: c.userId,
      tripsCount,
      totalSpent,
      loyalty: tripsCount > 0 ? resolveLoyalty(totalSpent, tripsCount) : null,
      hasHealthProfile: !!c.user?.healthProfile,
      createdAt: c.createdAt.toISOString(),
    };
  });

  return <CrmExplorer contacts={mapped} />;
}
