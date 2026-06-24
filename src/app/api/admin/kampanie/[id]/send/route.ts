import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth/auth";
import { getMailer } from "@/lib/mailer";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

/**
 * Uruchamia wysyłkę kampanii: tworzy kolejkę odbiorców (status SENDING) i wysyła
 * pierwszą paczkę. Resztę domyka drainer (`/api/cron/mailer-drain`) lub kolejne
 * tyknięcia, gdyby lista była duża.
 */
export async function POST(_req: Request, { params }: Params) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "ADMIN")
    return NextResponse.json({ error: "Brak uprawnień" }, { status: 403 });

  const { id } = await params;
  const mailer = getMailer();

  try {
    const { queued, total } = await mailer.enqueue(id);
    if (total === 0)
      return NextResponse.json(
        { error: "Segment jest pusty — brak odbiorców do wysyłki." },
        { status: 400 },
      );

    // Pierwsza paczka od razu — reszta przez drainer.
    const drain = await mailer.drain(id);
    return NextResponse.json({ ok: true, queued, total, firstBatch: drain });
  } catch (e) {
    console.error("[kampanie/send] error:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Błąd wysyłki." },
      { status: 500 },
    );
  }
}
