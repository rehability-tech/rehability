import "server-only";
import { getAdminCourseDetail, getCourseParticipants } from "@/lib/courses-db";
import type { DashboardData, ParticipantsData } from "./_components/types";

/** Wczytuje i serializuje uczestników kursu dla zakładki „Uczestnicy". */
export async function getParticipantsData(
  courseId: string,
): Promise<ParticipantsData> {
  const { lessonsTotal, participants } = await getCourseParticipants(courseId);
  return {
    lessonsTotal,
    participants: participants.map((p) => ({
      userId: p.userId,
      name: p.name,
      email: p.email,
      image: p.image,
      enrolledAt: p.enrolledAt.toISOString(),
      lessonsCompleted: p.lessonsCompleted,
      progress: p.progress,
      watchSeconds: p.watchSeconds,
      lastActivity: p.lastActivity ? p.lastActivity.toISOString() : null,
    })),
  };
}

/** Wczytuje i serializuje dane kursu dla dashboardu admina (wspólne dla podstron). */
export async function getDashboardData(
  slug: string,
): Promise<DashboardData | null> {
  const detail = await getAdminCourseDetail(slug);
  if (!detail) return null;

  const { course } = detail;
  return {
    id: course.id,
    slug: course.slug,
    title: course.title,
    category: course.category,
    excerpt: course.excerpt,
    price: course.price,
    durationMin: course.durationMin,
    rating: course.rating,
    reviews: course.reviews,
    status: detail.status,
    format: detail.format,
    image: course.image,
    video: detail.video,
    createdAt: detail.createdAt.toISOString(),
    updatedAt: detail.updatedAt.toISOString(),
    description: course.description ?? null,
    testimonials: course.testimonials ?? null,
    faq: course.faq ?? null,
    metaTitle: course.metaTitle ?? "",
    metaDescription: course.metaDescription ?? "",
    focusKeyword: course.focusKeyword ?? "",
    ogImage: course.ogImage ?? "",
    canonicalUrl: course.canonicalUrl ?? "",
    noIndex: course.noIndex ?? false,
    videoThumb: detail.videoThumb,
    modules: detail.modules.map((m) => ({
      id: m.id,
      title: m.title,
      lessons: m.lessons.map((l) => ({
        id: l.id,
        title: l.title,
        description: l.description,
        video: l.video,
      })),
    })),
    stats: {
      students: detail.students,
      revenue: detail.revenue,
      modulesCount: detail.modulesCount,
      lessonsCount: detail.lessonsCount,
      lessonsWithVideo: detail.lessonsWithVideo,
    },
  };
}
