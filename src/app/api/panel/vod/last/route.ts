import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth/auth";
import { getLastWatchedCourse } from "@/lib/courses-db";

export const dynamic = "force-dynamic";

// Skrót „Ostatnio oglądany" w menu sidebara pobiera stąd ostatni kurs.
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ course: null }, { status: 401 });
  }
  const course = await getLastWatchedCourse(session.user.id);
  return NextResponse.json({ course });
}
