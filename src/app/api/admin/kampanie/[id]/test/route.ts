import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth/auth";
import { getMailer } from "@/lib/mailer";
import { z } from "zod";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

const schema = z.object({ to: z.string().email().optional() });

/** Wysyła wiadomość testową (domyślnie na e-mail zalogowanego admina). */
export async function POST(req: Request, { params }: Params) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "ADMIN")
    return NextResponse.json({ error: "Brak uprawnień" }, { status: 403 });

  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const parsed = schema.safeParse(body);
  const to = parsed.success
    ? (parsed.data.to ?? session.user.email ?? undefined)
    : (session.user.email ?? undefined);

  if (!to)
    return NextResponse.json(
      { error: "Brak adresu testowego." },
      { status: 400 },
    );

  try {
    await getMailer().sendTest(id, to);
    return NextResponse.json({ ok: true, to });
  } catch (e) {
    console.error("[kampanie/test] error:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Błąd wysyłki testu." },
      { status: 500 },
    );
  }
}
