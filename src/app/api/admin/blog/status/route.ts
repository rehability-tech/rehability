import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/requireAdmin";
import { createSystemUpdate } from "@/lib/notifications/send";
import { z } from "zod";

const bodySchema = z
  .object({
    id: z.string().min(1),
    status: z.enum(["DRAFT", "PUBLISHED", "SCHEDULED", "ARCHIVED"]),
    publishedAt: z
      .string()
      .datetime({ offset: true })
      .optional()
      .nullable(),
  })
  .refine(
    (val) => val.status !== "SCHEDULED" || !!val.publishedAt,
    {
      message: "publishedAt jest wymagane dla statusu SCHEDULED.",
      path: ["publishedAt"],
    },
  );

export async function PATCH(req: Request) {
  try {
    const { isAuthorized, response } = await requireAdmin();
    if (!isAuthorized) return response as NextResponse;

    const body = await req.json();
    const { id, status, publishedAt } = bodySchema.parse(body);

    const now = new Date();

    let data: {
      status: string;
      publishedAt?: Date | null;
    };

    if (status === "SCHEDULED") {
      const target = new Date(publishedAt as string);
      if (Number.isNaN(target.getTime())) {
        return NextResponse.json(
          { error: "Nieprawidłowa data publikacji." },
          { status: 400 },
        );
      }
      if (target.getTime() <= now.getTime()) {
        return NextResponse.json(
          {
            error:
              "Data publikacji musi być w przyszłości. Jeżeli chcesz opublikować od razu, użyj statusu PUBLISHED.",
          },
          { status: 400 },
        );
      }
      data = { status: "SCHEDULED", publishedAt: target };
    } else if (status === "PUBLISHED") {
      data = { status: "PUBLISHED", publishedAt: now };
    } else {
      // DRAFT or ARCHIVED — preserve existing publishedAt unless explicitly cleared
      data = { status };
      if (publishedAt === null) data.publishedAt = null;
    }

    const previous = await prisma.post.findUnique({
      where: { id },
      select: { status: true },
    });

    const post = await prisma.post.update({ where: { id }, data });

    // Mirror status on a linked schedule entry, if any.
    await syncScheduleEntryStatus(id, status);

    // SYSTEM_UPDATE [D] — tylko przy faktycznym przejściu na PUBLISHED
    if (status === "PUBLISHED" && previous?.status !== "PUBLISHED") {
      createSystemUpdate({
        type: "BLOG",
        title: `Nowy wpis na blogu: ${post.title}`,
        description: post.excerpt?.slice(0, 240) || "Sprawdź najnowszy wpis.",
        link: `/blog/${post.slug}`,
      }).catch((err) =>
        console.error("[blog/status] createSystemUpdate failed:", err),
      );
    }

    return NextResponse.json(post);
  } catch (error: unknown) {
    console.error("Błąd zmiany statusu:", error);
    if (
      error &&
      typeof error === "object" &&
      "issues" in error &&
      Array.isArray((error as { issues?: Array<{ message: string }> }).issues)
    ) {
      const msg =
        (error as { issues: Array<{ message: string }> }).issues[0]?.message ||
        "Nieprawidłowe dane";
      return NextResponse.json({ error: msg }, { status: 400 });
    }
    return NextResponse.json({ error: "Błąd serwera" }, { status: 500 });
  }
}

async function syncScheduleEntryStatus(postId: string, postStatus: string) {
  const entryStatus =
    postStatus === "PUBLISHED"
      ? "PUBLISHED"
      : postStatus === "SCHEDULED"
        ? "SCHEDULED"
        : postStatus === "ARCHIVED"
          ? "SKIPPED"
          : "IN_PROGRESS";

  try {
    await prisma.blogScheduleEntry.updateMany({
      where: { postId },
      data: { status: entryStatus },
    });
  } catch (err) {
    console.warn("[blog/status] failed to sync schedule entry:", err);
  }
}
