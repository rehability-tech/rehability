import { NextResponse } from "next/server";
import { z } from "zod";
import {
  SANDBOX_COOKIE,
  SANDBOX_COOKIE_MAX_AGE,
  SANDBOX_COOKIE_ON,
} from "@/lib/sandbox/constants";
import { getSandboxContext } from "@/lib/sandbox/context";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Przełącznik podglądu piaskownicy. Świadomie NIE leży pod /api/admin —
// korzystają z niego także konta testowe (`User.sandboxAccess`), a nie tylko
// administracja. Uprawnienie sprawdzamy tu, po stronie serwera.

const BodySchema = z.object({ enabled: z.boolean() });

export async function POST(req: Request) {
  const { canUseSandbox } = await getSandboxContext();
  if (!canUseSandbox) {
    return NextResponse.json(
      { error: "Brak dostępu do piaskownicy." },
      { status: 403 },
    );
  }

  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return NextResponse.json({ error: "Nieprawidłowy JSON." }, { status: 400 });
  }

  const parsed = BodySchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Pole `enabled` musi być typu boolean." },
      { status: 422 },
    );
  }

  const { enabled } = parsed.data;
  const res = NextResponse.json({ enabled });

  if (enabled) {
    res.cookies.set(SANDBOX_COOKIE, SANDBOX_COOKIE_ON, {
      // Nie httpOnly — patrz komentarz przy SANDBOX_COOKIE. To preferencja
      // widoku, nie poświadczenie; dostęp i tak weryfikuje sesja.
      httpOnly: false,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: SANDBOX_COOKIE_MAX_AGE,
    });
  } else {
    // maxAge 0 zamiast delete — pewniej czyści ciasteczko w każdej przeglądarce.
    res.cookies.set(SANDBOX_COOKIE, "", {
      // Nie httpOnly — patrz komentarz przy SANDBOX_COOKIE. To preferencja
      // widoku, nie poświadczenie; dostęp i tak weryfikuje sesja.
      httpOnly: false,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 0,
    });
  }

  return res;
}
