import { GoogleGenerativeAI } from "@google/generative-ai";
import { prisma } from "@/lib/prisma";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY as string);

function getNextMonday(): Date {
  const now = new Date();
  const day = now.getDay(); // 0 = Sun, 1 = Mon, ...
  const daysUntilMonday = day === 0 ? 1 : 8 - day;
  const monday = new Date(now);
  monday.setDate(now.getDate() + daysUntilMonday);
  monday.setHours(0, 0, 0, 0);
  return monday;
}

function formatDate(date: Date): string {
  return date.toISOString().split("T")[0];
}

interface SchedulePost {
  title: string;
  topic: string;
  category: string;
  keywords: string[];
}

export async function generateWeeklySchedule(): Promise<{ weekStart: Date; created: number }> {
  const weekStart = getNextMonday();

  // Idempotency: skip if plan for this week already exists
  const existing = await prisma.blogScheduleEntry.count({ where: { weekStart } });
  if (existing > 0) {
    return { weekStart, created: 0 };
  }

  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);

  const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });

  const systemInstruction = `Jesteś strategiem contentu dla polskiego bloga wellness prowadzonego przez fizjoterapeutkę.
Blog jest skierowany do kobiet i obejmuje tematy: fizjoterapia, mindfulness, zdrowe żywienie, ruch, relaks i campy wellness.
Zaplanuj DOKŁADNIE 3 pomysły na artykuły blogowe na tydzień ${formatDate(weekStart)}–${formatDate(weekEnd)}.
Zadbaj o różnorodność kategorii.

Zwróć tablicę JSON (bez żadnych nagłówków, tylko surowy JSON):
[
  {
    "title": "Chwytliwy tytuł artykułu po polsku (max 10 słów)",
    "topic": "2-3 zdania opisujące co powinien zawierać artykuł i jaką wartość da czytelniczce",
    "category": "jedna z: Fizjoterapia | Mindfulness | Żywienie | Ruch | Camp Stories | Terapia | Ogólne",
    "keywords": ["słowo1", "słowo2", "słowo3", "słowo4"]
  }
]`;

  const result = await model.generateContent({
    contents: [{ role: "user", parts: [{ text: systemInstruction }] }],
    generationConfig: { responseMimeType: "application/json" },
  });

  const posts: SchedulePost[] = JSON.parse(result.response.text());

  await prisma.blogScheduleEntry.createMany({
    data: posts.map((p) => ({
      weekStart,
      title: p.title,
      topic: p.topic,
      category: p.category,
      keywords: p.keywords,
    })),
  });

  return { weekStart, created: posts.length };
}
