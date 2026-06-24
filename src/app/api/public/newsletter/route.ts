import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  upsertContactFromEmail,
  CONTACT_SOURCES,
} from "@/lib/crm/contactSync";

const schema = z.object({
  email: z.string().email("Podaj prawidłowy adres e-mail."),
});

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Nieprawidłowe dane." }, { status: 400 });
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0].message },
      { status: 422 },
    );
  }

  const { email } = parsed.data;

  try {
    await prisma.newsletterSubscriber.create({ data: { email } });
    // Sync do bazy kontaktów (CRM/mailing) — best-effort, nie blokuje zapisu.
    upsertContactFromEmail(email, {
      source: CONTACT_SOURCES.NEWSLETTER,
    }).catch((err) =>
      console.error("[newsletter] contact sync error:", err),
    );
    return NextResponse.json({ ok: true });
  } catch (error: any) {
    if (error?.code === "P2002") {
      return NextResponse.json({ error: "duplicate" }, { status: 409 });
    }
    console.error("Newsletter error:", error);
    return NextResponse.json({ error: "Błąd serwera." }, { status: 500 });
  }
}
