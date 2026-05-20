import { GoogleGenerativeAI } from "@google/generative-ai";
import { prisma } from "@/lib/prisma";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY as string);

function getMWFDays(year: number, month: number): Date[] {
  const days: Date[] = [];
  const date = new Date(year, month, 1);
  while (date.getMonth() === month) {
    const dow = date.getDay();
    if (dow === 1 || dow === 3 || dow === 5) {
      days.push(new Date(date));
    }
    date.setDate(date.getDate() + 1);
  }
  return days;
}

function formatDate(date: Date): string {
  return date.toLocaleDateString("pl-PL", { day: "numeric", month: "long", year: "numeric" });
}

interface SchedulePost {
  title: string;
  topic: string;
  category: string;
  keywords: string[];
}

export async function generateMonthlySchedule(
  year: number,
  month: number,
): Promise<{ year: number; month: number; created: number }> {
  const startOfMonth = new Date(year, month, 1);
  const endOfMonth   = new Date(year, month + 1, 0, 23, 59, 59);

  const existing = await prisma.blogScheduleEntry.count({
    where: { scheduledDate: { gte: startOfMonth, lte: endOfMonth } },
  });
  if (existing > 0) return { year, month, created: 0 };

  const publishDays = getMWFDays(year, month).slice(0, 12);
  if (publishDays.length === 0) return { year, month, created: 0 };

  const monthName = startOfMonth.toLocaleDateString("pl-PL", { month: "long", year: "numeric" });
  const dateList  = publishDays.map((d, i) => `${i + 1}. ${formatDate(d)}`).join("\n");

  const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });

  const systemInstruction = `Jesteś strategiem contentu dla polskiego bloga wellness prowadzonego przez fizjoterapeutkę Piotra Siemaszko.
Blog jest skierowany do kobiet i obejmuje tematy: fizjoterapia, mindfulness, zdrowe żywienie, aktywność fizyczna, relaks i campy wellness.

Zaplanuj DOKŁADNIE ${publishDays.length} artykułów blogowych na miesiąc ${monthName}.
Zadbaj o różnorodność kategorii i tematów. Każdy artykuł powinien przynosić realną wartość czytelniczce.

Zwróć tablicę JSON z dokładnie ${publishDays.length} obiektami (bez żadnych nagłówków, tylko surowy JSON):
[
  {
    "title": "Chwytliwy tytuł po polsku (max 10 słów)",
    "topic": "2-3 zdania opisujące o czym jest artykuł i jaką wartość da czytelniczce",
    "category": "jedna z: Fizjoterapia | Mindfulness | Żywienie | Ruch | Camp Stories | Terapia | Ogólne",
    "keywords": ["słowo1", "słowo2", "słowo3", "słowo4"]
  }
]`;

  const result = await model.generateContent({
    contents: [{ role: "user", parts: [{ text: `${systemInstruction}\n\nPlanowane daty publikacji:\n${dateList}` }] }],
    generationConfig: { responseMimeType: "application/json" },
  });

  const posts: SchedulePost[] = JSON.parse(result.response.text());
  const entries = posts.slice(0, publishDays.length).map((p, i) => ({
    scheduledDate: publishDays[i],
    title:    p.title,
    topic:    p.topic,
    category: p.category,
    keywords: p.keywords,
  }));

  await prisma.blogScheduleEntry.createMany({ data: entries });
  return { year, month, created: entries.length };
}
