import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(request) {
    const { pathname } = request.nextUrl;
    const token = request.nextauth.token;

    // 1. Ignorujemy pliki statyczne i API
    if (
      pathname.includes(".") ||
      pathname.startsWith("/_next") ||
      (pathname.startsWith("/api") && !pathname.startsWith("/api/admin"))
    ) {
      return NextResponse.next();
    }

    // --- INTELIGENTNE PRZEKIEROWANIE ZE STRONY LOGOWANIA ---
    if (pathname === "/logowanie" && token) {
      if (token.role === "ADMIN") {
        return NextResponse.redirect(new URL("/admin", request.url));
      } else {
        return NextResponse.redirect(new URL("/panel-kursanta", request.url));
      }
    }

    // --- OCHRONA PANELU ADMINA ---
    const isAdminRoute =
      pathname.startsWith("/admin") || pathname.startsWith("/api/admin");

    if (isAdminRoute && token?.role !== "ADMIN") {
      // Zwykły user ucieka stąd na stronę główną
      return NextResponse.redirect(new URL("/", request.url));
    }

    // --- NOWE: OCHRONA PANELU KURSANTA PRZED ADMINEM ---
    const isUserPanelRoute = pathname.startsWith("/panel-kursanta");

    if (isUserPanelRoute && token?.role === "ADMIN") {
      // Jeśli Admin zapędzi się na panel kursanta, wyrzucamy go do jego bazy (na /admin)
      return NextResponse.redirect(new URL("/admin", request.url));
    }
    // ---------------------------------------------------

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ req, token }) => {
        const { pathname } = req.nextUrl;

        if (
          pathname.startsWith("/admin") ||
          pathname.startsWith("/api/admin") ||
          pathname.startsWith("/panel-kursanta")
        ) {
          return !!token;
        }

        return true;
      },
    },
    pages: {
      signIn: "/logowanie",
    },
  },
);

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|images|logotypy).*)"],
};
