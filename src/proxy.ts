import { getToken } from "next-auth/jwt";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// ZMIANA TUTAJ: Zamiast 'export async function middleware', używamy 'export async function proxy'
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = await getToken({ req: request });

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
  ],
};
