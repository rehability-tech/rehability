import { getServerSession } from "next-auth/next";
import { NextResponse } from "next/server";
import { authOptions } from "@/app/api/auth/[...nextauth]/route"; // Upewnij się, że ta ścieżka jest poprawna!

export async function requireAdmin() {
  const session = await getServerSession(authOptions);

  // Sprawdzamy czy w ogóle jest sesja i czy rola to ADMIN
  if (!session || session.user?.role !== "ADMIN") {
    return {
      isAuthorized: false,
      // Gotowa odpowiedź 403 (Forbidden), którą od razu wyrzucisz z API
      response: NextResponse.json(
        { error: "Brak dostępu. Wymagane uprawnienia administratora." },
        { status: 403 },
      ),
      session: null,
    };
  }

  // Jeśli wszystko gra, zwracamy zielone światło i pełną sesję (np. żeby wyciągnąć ID admina)
  return {
    isAuthorized: true,
    response: null,
    session: session,
  };
}
