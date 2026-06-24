import "server-only";
import crypto from "node:crypto";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";

// Zlicza wyświetlenie kursu z dedupem: jeden visitor (IP+UA) liczony raz dziennie.
// Wzorowane na recordPostView / recordTripView — spójna logika w całym serwisie.
export async function recordCourseView(courseId: string) {
  try {
    const h = await headers();
    const ip =
      h.get("x-forwarded-for")?.split(",")[0].trim() ??
      h.get("x-real-ip") ??
      "unknown";
    const ua = h.get("user-agent") ?? "unknown";
    const secret = process.env.PAGEVIEW_SECRET ?? "rotate-me";
    const visitorHash = crypto
      .createHash("sha256")
      .update(`${ip}|${ua}|${secret}`)
      .digest("hex");

    const day = new Date();
    day.setUTCHours(0, 0, 0, 0);

    await prisma.$transaction([
      prisma.courseView.create({
        data: { courseId, visitorHash, day },
      }),
      prisma.course.update({
        where: { id: courseId },
        data: { views: { increment: 1 } },
      }),
    ]);
  } catch (err: unknown) {
    // P2002 = unique (courseId, visitorHash, day) — ten visitor już dziś nabił.
    if ((err as { code?: string })?.code !== "P2002") {
      console.error("recordCourseView failed:", err);
    }
  }
}
