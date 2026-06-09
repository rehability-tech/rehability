import { prisma } from "@/lib/prisma";
import { runCron } from "@/lib/cron/runCron";
import { sendNotificationToAdmins } from "@/lib/notifications/send";

// GET/POST /api/cron/blog/reminders
//
// Przypomnienie dla adminów o zaplanowanych wpisach bloga, które są już "na czasie"
// (zaplanowane na dziś lub zaległe), a wciąż NIE zostały napisane (status PLANNED).
// Wysyła jedno zbiorcze powiadomienie (IN_APP + PUSH) z linkiem do harmonogramu.
//
// Zaprojektowane pod uruchamianie RAZ DZIENNIE rano — wtedy każdy zaległy/dzisiejszy
// wpis przypomina się raz na dobę, aż admin go napisze. Częstsze odpalanie = częstsze
// (powtarzające się) przypomnienia o tych samych wpisach, więc trzymaj się dziennej kadencji.

export async function POST(req: Request) {
  return runCron(req, "blog/reminders", async () => {
    const now = new Date();
    // Koniec dnia "dzisiaj" wg strefy serwera — łapiemy wpisy zaplanowane na dziś
    // oraz wszystkie zaległe, które wciąż czekają na napisanie.
    const endOfToday = new Date(now);
    endOfToday.setHours(23, 59, 59, 999);

    const due = await prisma.blogScheduleEntry.findMany({
      where: {
        status: "PLANNED",
        scheduledDate: { lte: endOfToday },
      },
      orderBy: { scheduledDate: "asc" },
      select: { id: true, title: true, category: true, scheduledDate: true },
    });

    if (due.length === 0) {
      return { checkedAt: now.toISOString(), reminded: 0, entries: [] };
    }

    const isSingle = due.length === 1;
    await sendNotificationToAdmins({
      title: isSingle
        ? "✍️ Czas napisać zaplanowany wpis"
        : `✍️ ${due.length} ${pluralizeWpis(due.length)} czeka na napisanie`,
      message: isSingle
        ? `„${due[0].title}" (${due[0].category}) — zaplanowany wpis czeka na stworzenie treści.`
        : due.map((e) => `• ${e.title} (${e.category})`).join("\n"),
      link: "/admin/blog/harmonogram",
      type: "SYSTEM",
      push: true,
    });

    return {
      checkedAt: now.toISOString(),
      reminded: due.length,
      entries: due.map((e) => ({ id: e.id, title: e.title })),
    };
  });
}

// GET też działa — część schedulerów woli GET. To samo zachowanie.
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
