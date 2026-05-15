import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Ignorujemy pliki statyczne (zdjęcia, ikony) oraz zasoby systemowe Next.js
  if (
    pathname.includes(".") ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api")
  ) {
    return NextResponse.next();
  }

  // --- SEKCJA "W BUDOWIE" WYŁĄCZONA ---
  /*
  const allowedPaths = [
    "/",
    "/gabinet",
    "/w-budowie",
    "/o-nas",
    "/campy",
    "/campy/*",
  ];

  // Jeśli ścieżka NIE jest na liście dozwolonych, robimy redirect na /w-budowie
  if (!allowedPaths.includes(pathname)) {
    return NextResponse.redirect(new URL("/w-budowie", request.url));
  }
  */

  // 2. Skoro blokada jest wyłączona, przepuszczamy każde żądanie dalej
  return NextResponse.next();
}

// Opcjonalny, ale zalecany matcher dla optymalizacji
export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|images|logotypy).*)"],
};
