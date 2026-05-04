import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Zwróć uwagę, że funkcja nazywa się teraz "proxy", a nie "middleware"
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Definiujemy ścieżki, które są DOZWOLONE
  // UWAGA: Musisz dodać tutaj '/w-budowie', aby uniknąć pętli przekierowań!
  const allowedPaths = ["/", "/gabinet", "/w-budowie"];

  // 2. Ignorujemy pliki statyczne (zdjęcia, ikony) oraz zasoby systemowe Next.js
  if (
    pathname.includes(".") ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api")
  ) {
    return NextResponse.next();
  }

  // 3. Jeśli ścieżka NIE jest na liście dozwolonych, robimy redirect na /w-budowie
  if (!allowedPaths.includes(pathname)) {
    return NextResponse.redirect(new URL("/w-budowie", request.url));
  }

  // 4. Jeśli wszystko się zgadza, przepuszczamy żądanie dalej
  return NextResponse.next();
}

// Opcjonalny, ale zalecany matcher dla optymalizacji
export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|images|logotypy).*)"],
};
