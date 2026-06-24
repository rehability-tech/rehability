import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { z } from "zod";
import { authOptions } from "@/lib/auth/auth";
import { prisma } from "@/lib/prisma";
import {
  upsertCourseReview,
  deleteCourseReview,
} from "@/lib/courses-db";
import { sendNotificationToAdmins } from "@/lib/notifications/send";

const bodySchema = z.object({
  rating: z.number().int().min(1).max(5),
  text: z.string().trim().min(3, "Opinia jest za krótka.").max(2000),
});

/** Pobiera ID i tytuł kursu po slug i sprawdza, czy kursant ma do niego dostęp. */
async function resolveEnrolledCourse(slug: string, userId: string) {
  const course = await prisma.course.findUnique({
    where: { slug },
    select: { id: true, title: true },
  });
  if (!course) return { error: "Kurs nie istnieje.", status: 404 as const };

  const enrollment = await prisma.enrollment.findUnique({
    where: { userId_courseId: { userId, courseId: course.id } },
    select: { id: true },
  });
  if (!enrollment) {
    return {
      error: "Opinię może dodać tylko kursant z dostępem do kursu.",
      status: 403 as const,
    };
  }
  return { courseId: course.id, courseTitle: course.title };
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Zaloguj się." }, { status: 401 });
  }

  const { slug } = await params;
  const resolved = await resolveEnrolledCourse(slug, session.user.id);
  if ("error" in resolved) {
    return NextResponse.json(
      { error: resolved.error },
      { status: resolved.status },
    );
  }

  let data: z.infer<typeof bodySchema>;
  try {
    data = bodySchema.parse(await req.json());
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0]?.message ?? "Nieprawidłowe dane." },
        { status: 400 },
      );
    }
    return NextResponse.json({ error: "Nieprawidłowe dane." }, { status: 400 });
  }

  await upsertCourseReview({
    userId: session.user.id,
    courseId: resolved.courseId,
    rating: data.rating,
    text: data.text,
  });

  void sendNotificationToAdmins({
    title: "⭐ Nowa opinia o kursie",
    message: `Kursant wystawił ${data.rating}/5 gwiazdek dla kursu „${resolved.courseTitle}".`,
    type: "VOD",
    link: `/admin/kursy/${slug}?tab=uczestnicy`,
    push: true,
  });

  return NextResponse.json({ ok: true });
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Zaloguj się." }, { status: 401 });
  }

  const { slug } = await params;
  const resolved = await resolveEnrolledCourse(slug, session.user.id);
  if ("error" in resolved) {
    return NextResponse.json(
      { error: resolved.error },
      { status: resolved.status },
    );
  }

  await deleteCourseReview(session.user.id, resolved.courseId);
  return NextResponse.json({ ok: true });
}
