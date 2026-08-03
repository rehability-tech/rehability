import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { getSandboxContext } from "@/lib/sandbox/context";
import SandboxClient from "./_components/SandboxClient";

export const metadata: Metadata = {
  title: "Sandbox",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

// Dostępu nie sprawdzamy tutaj — `/admin/*` jest już za bramką w layoucie
// admina (redirect dla nie-adminów) i w proxy. Tu tylko czytamy stan.

export default async function SandboxPage() {
  const { previewEnabled } = await getSandboxContext();

  const [sandboxTrips, sandboxCourses, testers] = await Promise.all([
    prisma.trip.findMany({
      where: { sandbox: true },
      orderBy: { updatedAt: "desc" },
      select: {
        id: true,
        title: true,
        status: true,
        location: true,
        startDate: true,
        endDate: true,
        updatedAt: true,
        _count: { select: { bookings: true } },
      },
    }),
    prisma.course.findMany({
      where: { sandbox: true },
      orderBy: { updatedAt: "desc" },
      select: {
        id: true,
        slug: true,
        title: true,
        status: true,
        category: true,
        price: true,
        updatedAt: true,
        _count: { select: { enrollments: true } },
      },
    }),
    prisma.user.findMany({
      where: { sandboxAccess: true, role: { not: "ADMIN" } },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        sandboxGrantedAt: true,
      },
      orderBy: [{ sandboxGrantedAt: "desc" }, { email: "asc" }],
    }),
  ]);

  return (
    <SandboxClient
      previewEnabled={previewEnabled}
      trips={sandboxTrips.map((t) => ({
        id: t.id,
        title: t.title,
        status: t.status,
        location: typeof t.location === "string" ? t.location : null,
        startDate: t.startDate.toISOString(),
        endDate: t.endDate.toISOString(),
        updatedAt: t.updatedAt.toISOString(),
        bookings: t._count.bookings,
      }))}
      courses={sandboxCourses.map((c) => ({
        id: c.id,
        slug: c.slug,
        title: c.title,
        status: c.status,
        category: c.category,
        price: c.price,
        updatedAt: c.updatedAt.toISOString(),
        students: c._count.enrollments,
      }))}
      testers={testers.map((u) => ({
        id: u.id,
        name: u.name,
        email: u.email,
        image: u.image,
        grantedAt: u.sandboxGrantedAt ? u.sandboxGrantedAt.toISOString() : null,
      }))}
    />
  );
}
