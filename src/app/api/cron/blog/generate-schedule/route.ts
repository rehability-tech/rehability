import { NextResponse } from "next/server";
import { requireCron } from "@/lib/auth/requireCron";
import { generateTrendSchedule } from "@/lib/blog/generateTrendSchedule";
import { sendNotificationToAdmins } from "@/lib/notifications/send";

// POST /api/cron/blog/generate-schedule
//
// Generuje miesięczny harmonogram wpisów (BlogScheduleEntry) na podstawie
// REALNYCH, rosnących trendów wyszukiwań w Polsce (geo: PL), z twardym
// fallbackiem na frazy evergreen, gdy API trendów jest niedostępne / zablokowane.
// Cała logika (provider trendów, rate-limiting, dedupe, zapis) żyje w warstwie
// `@/lib/blog/*` — ten route to cienki handler (auth + parsowanie + odpowiedź).
//
// Body lub query:
//   { "year": 2026, "month": 5 }     // month 0-indexed (maj = 4)
//   "?year=2026&month=4"
//   "?offset=2"                       // bieżący + N miesięcy
//
// Domyślnie generuje dla BIEŻĄCEGO miesiąca (odpalenie 1 czerwca => cały czerwiec).
// Aby zaplanować z wyprzedzeniem, użyj "?offset=1" (następny miesiąc) itd.
// Idempotentny: jeśli plan na dany miesiąc istnieje, zwraca { created: 0 }.

export async function POST(req: Request) {
  const auth = requireCron(req);
  if (!auth.ok) return auth.response!;

  const url = new URL(req.url);
  const body = await safeJson(req);
  const now = new Date();

  let year = num(body.year ?? url.searchParams.get("year"));
  let month = num(body.month ?? url.searchParams.get("month"));
  const offset = num(body.offset ?? url.searchParams.get("offset"));

  if (year === null || month === null) {
    const base = new Date(now.getFullYear(), now.getMonth() + (offset ?? 0), 1);
    year = base.getFullYear();
    month = base.getMonth();
  }

  try {
    const result = await generateTrendSchedule(year, month);

    // Powiadom adminów tylko, gdy faktycznie powstały nowe wpisy
    // (idempotentne wywołanie zwraca created: 0 — wtedy cisza, brak alert fatigue).
    if (result.created > 0) {
      await sendNotificationToAdmins({
        title: "🗓️ Wygenerowano harmonogram bloga",
        message: buildAdminMessage(result.created, year, month, result.source),
        link: "/admin/blog/harmonogram",
        type: "SYSTEM",
        push: true,
      });
    }

    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    // Awaria tutaj oznacza problem infrastrukturalny (np. DB) — błędy samego
    // API trendów są łapane wewnątrz generatora i kończą się fallbackiem.
    console.error("[cron] schedule generation failed:", err);
    return NextResponse.json(
      {
        error:
          err instanceof Error ? err.message : "Schedule generation failed",
      },
      { status: 500 },
    );
  }
}

// Część usług cron preferuje GET — to samo zachowanie.
export async function GET(req: Request) {
  return POST(req);
}

async function safeJson(req: Request): Promise<Record<string, unknown>> {
  try {
    const text = await req.clone().text();
    if (!text) return {};
    return JSON.parse(text);
  } catch {
    return {};
  }
}

function num(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

const MONTHS_PL = [
  "styczeń",
  "luty",
  "marzec",
  "kwiecień",
  "maj",
  "czerwiec",
  "lipiec",
  "sierpień",
  "wrzesień",
  "październik",
  "listopad",
  "grudzień",
];

const SOURCE_LABEL: Record<string, string> = {
  live: "na podstawie realnych trendów wyszukiwań",
  fallback: "na podstawie fraz evergreen",
  mixed: "z trendów i fraz evergreen",
};

function buildAdminMessage(
  created: number,
  year: number,
  month: number,
  source: string,
): string {
  const monthLabel = `${MONTHS_PL[month] ?? `miesiąc ${month + 1}`} ${year}`;
  const entries = `${created} ${pluralizeWpis(created)}`;
  const origin = SOURCE_LABEL[source] ?? "";
  return `Zaplanowano ${entries} na ${monthLabel} ${origin}.`.trim();
}

function pluralizeWpis(n: number): string {
  if (n === 1) return "wpis";
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return "wpisy";
  return "wpisów";
}
