import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth/auth";
import { syncAllContacts } from "@/lib/crm/contactSync";

export const dynamic = "force-dynamic";

/** Pełna rekoncyliacja bazy kontaktów ze wszystkich źródeł (ADMIN). */
export async function POST() {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Brak uprawnień" }, { status: 403 });
  }

  const result = await syncAllContacts();
  return NextResponse.json({ ok: true, ...result });
}
