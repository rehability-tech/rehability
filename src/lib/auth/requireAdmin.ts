import { NextResponse } from "next/server";

// ============================================================================
// SZKIELET NEXT-AUTH: Weryfikacja Admina
// ============================================================================
export async function requireAdmin() {
  // TODO: Po wdrożeniu NextAuth podmień to na:
  // const session = await getServerSession(authOptions);
  // if (!session || session.user.role !== "ADMIN") {
  //   return false;
  // }

  // Na ten moment symulujemy, że użytkownik to zawsze uwierzytelniony Admin
  const isAuthorized = true;

  if (!isAuthorized) {
    throw new Error("Unauthorized");
  }

  return true;
}
