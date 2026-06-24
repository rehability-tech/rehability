import { prisma } from "@/lib/prisma";
import { runCron } from "@/lib/cron/runCron";
import { sendNotificationToAdmins } from "@/lib/notifications/send";
import { notifyIndexNow } from "@/lib/seo/indexing";
import { absoluteUrl } from "@/lib/seo/site";

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

    // Powiadom adminów, że zaplanowany wpis własnie poszedł na żywo.
    const isSingle = promoted.length === 1;
    await sendNotificationToAdmins({
      title: isSingle
        ? "📝 Opublikowano wpis na blogu"
        : `📝 Opublikowano ${promoted.length} ${pluralizeWpis(promoted.length)} na blogu`,
      message: isSingle
        ? `„${promoted[0].title}" jest już dostępny na blogu.`
        : promoted.map((p) => `• ${p.title}`).join("\n"),
      link: isSingle ? `/blog/${promoted[0].slug}` : "/admin/blog",
      type: "SYSTEM",
      push: true,
    });

    // IndexNow — zgłoś wszystkie świeżo opublikowane wpisy hurtem (Bing/Yandex/...).
    // Google dociąga je z sitemap.xml; IndexNow przyspiesza pozostałe wyszukiwarki.
    await notifyIndexNow(promoted.map((p) => absoluteUrl(`/blog/${p.slug}`)));

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

function pluralizeWpis(n: number): string {
  if (n === 1) return "wpis";
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return "wpisy";
  return "wpisów";
}
