import { prisma } from "@/lib/prisma";
import { runCron } from "@/lib/cron/runCron";

// GET/POST /api/cron/blog/publish
//
// Promuje każdy `Post` o statusie "SCHEDULED", którego `publishedAt` już minął,
// do statusu "PUBLISHED". Synchronizuje też powiązany `BlogScheduleEntry`.
// Runtime nigdy nie cofa czasu: wpis przechodzi SCHEDULED → PUBLISHED tylko
// w chwili docelowej lub po niej.

export async function POST(req: Request) {
  return runCron(req, "blog/publish", async () => {
    const now = new Date();
    const dueScheduled = await prisma.post.findMany({
      where: {
        status: "SCHEDULED",
        publishedAt: { lte: now },
      },
      select: { id: true, slug: true, title: true },
    });

    if (dueScheduled.length === 0) {
      return { checkedAt: now.toISOString(), promoted: 0, posts: [] };
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

    return {
      checkedAt: now.toISOString(),
      promoted: promoted.length,
      posts: promoted,
    };
  });
}

// GET works too — some cron services prefer GET. Same behavior.
export async function GET(req: Request) {
  return POST(req);
}
