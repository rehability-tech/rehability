import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireCron } from "@/lib/auth/requireCron";

// POST /api/cron/blog/publish
//
// Promotes every `Post` whose status is "SCHEDULED" and whose `publishedAt`
// has already passed to status "PUBLISHED". Also syncs the linked
// `BlogScheduleEntry` (if any) to status "PUBLISHED".
//
// Auth: see `requireCron`. Call from any cron service (Vercel Cron, GitHub
// Actions, EasyCron, …) — the runtime never backdates: an entry can only go
// from SCHEDULED to PUBLISHED *at or after* its target moment.

export async function POST(req: Request) {
  const auth = requireCron(req);
  if (!auth.ok) return auth.response!;

  const now = new Date();
  const dueScheduled = await prisma.post.findMany({
    where: {
      status: "SCHEDULED",
      publishedAt: { lte: now },
    },
    select: { id: true, slug: true, title: true },
  });

  if (dueScheduled.length === 0) {
    return NextResponse.json({
      ok: true,
      checkedAt: now.toISOString(),
      promoted: 0,
      posts: [],
    });
  }

  const promoted: Array<{ id: string; slug: string; title: string }> = [];

  await prisma.$transaction(async (tx) => {
    for (const post of dueScheduled) {
      await tx.post.update({
        where: { id: post.id },
        data: { status: "PUBLISHED" },
      });

      await tx.blogScheduleEntry.updateMany({
        where: { postId: post.id },
        data: { status: "PUBLISHED" },
      });

      promoted.push(post);
    }
  });

  return NextResponse.json({
    ok: true,
    checkedAt: now.toISOString(),
    promoted: promoted.length,
    posts: promoted,
  });
}

// GET works too — some cron services prefer GET. Same behavior.
export async function GET(req: Request) {
  return POST(req);
}
