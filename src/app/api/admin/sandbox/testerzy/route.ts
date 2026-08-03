import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth/requireAdmin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Lista kont z dostępem do piaskownicy. Admini mają go z urzędu (rola), więc
// tutaj zarządzamy wyłącznie zwykłymi kontami — flagą `User.sandboxAccess`.

const GrantSchema = z.object({
  email: z.string().trim().toLowerCase().email("Podaj poprawny adres e-mail."),
});

/** GET — aktualni testerzy (bez adminów, ci nie potrzebują flagi). */
export async function GET() {
  const { isAuthorized, response } = await requireAdmin();
  if (!isAuthorized) return response as NextResponse;

  const testers = await prisma.user.findMany({
    where: { sandboxAccess: true, role: { not: "ADMIN" } },
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
      sandboxGrantedAt: true,
    },
    orderBy: [{ sandboxGrantedAt: "desc" }, { email: "asc" }],
  });

  return NextResponse.json({ testers });
}

/** POST — nadaje dostęp po adresie e-mail. */
export async function POST(req: Request) {
  const { isAuthorized, response } = await requireAdmin();
  if (!isAuthorized) return response as NextResponse;

  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return NextResponse.json({ error: "Nieprawidłowy JSON." }, { status: 400 });
  }

  const parsed = GrantSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Błąd walidacji." },
      { status: 422 },
    );
  }
  const { email } = parsed.data;

  // Konto musi już istnieć — flaga to uprawnienie, a nie zaproszenie. Zakładanie
  // pustego `User` z samym e-mailem rozjechałoby logowanie przez Google.
  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, role: true },
  });

  if (!user) {
    return NextResponse.json(
      {
        error:
          "Nie ma konta z tym adresem. Poproś tę osobę o zalogowanie się, potem nadaj dostęp.",
      },
      { status: 404 },
    );
  }

  if (user.role === "ADMIN") {
    return NextResponse.json(
      { error: "To konto jest administratorem — ma dostęp do piaskownicy z urzędu." },
      { status: 409 },
    );
  }

  const tester = await prisma.user.update({
    where: { id: user.id },
    data: { sandboxAccess: true, sandboxGrantedAt: new Date() },
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
      sandboxGrantedAt: true,
    },
  });

  return NextResponse.json({ tester });
}
