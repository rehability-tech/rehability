import { getToken } from "next-auth/jwt";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { FEATURES } from "@/lib/featureFlags";

// ZMIANA TUTAJ: Zamiast 'export async function middleware', używamy 'export async function proxy'
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = await getToken({ req: request });

  // 0. Platforma VOD (/kursy) tymczasowo dostępna TYLKO dla sesji admina.
  //    Każdy inny (niezalogowany lub zwykły user) jest odsyłany na stronę
  //    główną — sekcja nie jest jeszcze publiczna.
  //    W dev (NODE_ENV !== "production") blokada jest wyłączona — pełny dostęp.
  if (
    process.env.NODE_ENV === "production" &&
    (pathname === "/kursy" || pathname.startsWith("/kursy/")) &&
    token?.role !== "ADMIN"
  ) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  // 1. Zabezpieczenie przed niezalogowanymi (wypychamy na logowanie)
  const isProtectedRoute =
    pathname.startsWith("/panel") || pathname.startsWith("/admin");
  if (isProtectedRoute && !token) {
    return NextResponse.redirect(new URL("/logowanie", request.url));
  }

  // 2. Logika dla ZALOGOWANYCH użytkowników
  if (token) {
    const isAdmin = token.role === "ADMIN";

    // A: Przekierowanie ze strony logowania do odpowiedniego panelu
    if (pathname === "/logowanie") {
      return NextResponse.redirect(
        new URL(isAdmin ? "/admin" : "/panel", request.url),
      );
    }

    // B: Admin wchodzi na trasę usera -> odsyłamy do /admin
    if (isAdmin && pathname.startsWith("/panel")) {
      return NextResponse.redirect(new URL("/admin", request.url));
    }

    // C: User wchodzi na trasę admina -> odsyłamy do /panel
    if (!isAdmin && pathname.startsWith("/admin")) {
      return NextResponse.redirect(new URL("/panel", request.url));
    }

    // D: Funkcje tymczasowo wyłączone (wlecą w kolejnym patchu).
    // Strony przekierowujemy na /admin; API odda 503 we własnym handlerze.
    // Do celu doklejamy ?niedostepne=<sekcja> — panel główny pokazuje z tego
    // toast i sam czyści parametr z URL-a (FeatureDisabledToast).
    if (isAdmin && pathname.startsWith("/admin/klienci")) {
      const onTemplates = pathname.startsWith("/admin/klienci/szablony-maili");
      // szablony-maili są pod-sekcją bazy klientów → wymagają obu flag.
      const allowed = onTemplates
        ? FEATURES.customerBase && FEATURES.emailTemplates
        : FEATURES.customerBase;
      if (!allowed) {
        const target = new URL("/admin", request.url);
        target.searchParams.set("niedostepne", "crm");
        return NextResponse.redirect(target);
      }
    }
  }

  // Jeśli żaden warunek nie zablokował, przepuszczamy dalej
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/panel/:path*",
    "/admin/:path*",
    "/api/admin/:path*",
    "/logowanie",
    "/kursy",
    "/kursy/:path*",
  ],
};
