import { getServerSession } from "next-auth/next";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth/auth";
import { getVodOverview, getCourses } from "@/lib/courses-db";
import { MyCoursesClient } from "./_components/MyCoursesClient";

export const metadata = {
  title: "Moje kursy – Platforma VOD",
};

export const dynamic = "force-dynamic";

export default async function MyCoursesPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    redirect("/logowanie?callbackUrl=/panel/vod/moje");
  }

  // Posiadana biblioteka (+ postęp) oraz pełny katalog do sekcji „do kupienia".
  const [overview, catalog] = await Promise.all([
    getVodOverview(session.user.id),
    getCourses(),
  ]);
  const ownedIds = new Set(overview.courses.map((c) => c.id));
  const buyable = catalog.filter((c) => !ownedIds.has(c.id));

  return (
    <MyCoursesClient
      courses={overview.courses}
      progressByCourse={overview.progressByCourse}
      buyable={buyable}
    />
  );
}
