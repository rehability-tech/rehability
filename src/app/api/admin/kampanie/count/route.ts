import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth/auth";
import { getMailer } from "@/lib/mailer";
import { z } from "zod";

export const dynamic = "force-dynamic";

const schema = z.object({
  sources: z.array(z.string()).optional(),
  tags: z.array(z.string()).optional(),
  status: z
    .enum(["SUBSCRIBED", "UNSUBSCRIBED", "BOUNCED", "COMPLAINED"])
    .optional(),
});

/** Live podgląd liczby odbiorców dla wybranego segmentu (selektor audytorium). */
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "ADMIN")
    return NextResponse.json({ error: "Brak uprawnień" }, { status: 403 });

  const body = await req.json().catch(() => ({}));
  const parsed = schema.safeParse(body);
  if (!parsed.success)
    return NextResponse.json({ error: "Nieprawidłowe dane" }, { status: 400 });

  const count = await getMailer().countSegment({
    sources: parsed.data.sources,
    tags: parsed.data.tags,
    status: parsed.data.status ?? "SUBSCRIBED",
  });

  return NextResponse.json({ count });
}
