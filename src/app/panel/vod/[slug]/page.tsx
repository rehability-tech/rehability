import { getServerSession } from "next-auth/next";
import { redirect, notFound } from "next/navigation";
import { authOptions } from "@/lib/auth/auth";
import {
  getCourseForPlayer,
  getCourses,
  isUserEnrolled,
  getCompletedLessonIds,
  getCourseLessonSeconds,
  getUserCourseReview,
  getCourseWatchState,
  getVodOverview,
} from "@/lib/courses-db";
import { VodCoursePlayer } from "./_components/VodCoursePlayer";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const course = await getCourseForPlayer(slug);
  return { title: course ? `${course.title} – VOD` : "Kurs – VOD" };
}

export default async function VodCoursePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    redirect("/logowanie?callbackUrl=/panel/vod");
  }

  const { slug } = await params;
  const course = await getCourseForPlayer(slug);
  if (!course) notFound();

  // Gating — bez dostępu (Enrollment) kierujemy do zakupu.
  const enrolled = await isUserEnrolled(session.user.id, slug);
  if (!enrolled) {
    redirect(`/kursy/${slug}/checkout`);
  }

  const [
    allCourses,
    completedLessonIds,
    lessonSeconds,
    myReview,
    watchState,
    overview,
  ] = await Promise.all([
    getCourses(),
    getCompletedLessonIds(session.user.id, course.id),
    getCourseLessonSeconds(session.user.id, course.id),
    getUserCourseReview(session.user.id, course.id),
    getCourseWatchState(session.user.id, course.id),
    getVodOverview(session.user.id),
  ]);

  // Mapa slug → postęp dla posiadanych kursów (karty „Podobne kursy").
  const ownedProgress: Record<string, number> = Object.fromEntries(
    overview.courses.map((c) => [c.slug, overview.progressByCourse[c.id] ?? 0]),
  );

  return (
    <VodCoursePlayer
      course={course}
      allCourses={allCourses}
      completedLessonIds={completedLessonIds}
      lessonSeconds={lessonSeconds}
      myReview={myReview}
      viewerName={session.user.name ?? "Ty"}
      initialCompleted={watchState.completed}
      initialWatchedSec={watchState.watchedSec}
      ownedProgress={ownedProgress}
    />
  );
}
