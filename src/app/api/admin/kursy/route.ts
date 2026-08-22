import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/requireAdmin";
import { prisma } from "@/lib/prisma";
import {
  coursePublishBlockers,
  coursePublishError,
} from "@/lib/coursePublishGate";

function slugify(s: string) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/ł/g, "l")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 60);
}

type LessonIn = {
  title?: string;
  description?: string | null;
  video?: string | null;
  durationSec?: number;
};
type ModuleIn = { title?: string; lessons?: LessonIn[] };

const toSec = (v: unknown) => Math.max(0, Math.round(Number(v) || 0));

// Tworzy kurs z danych kreatora (zapis do bazy zamiast kopiowania JSON).
export async function POST(request: Request): Promise<NextResponse> {
  const { isAuthorized, response } = await requireAdmin();
  if (!isAuthorized) return response as NextResponse;

  const body = await request.json().catch(() => null);
  // Szkic z kreatora może nie mieć jeszcze tytułu (zapis np. zaraz po wgraniu
  // wideo) — wymagamy tylko, by było COKOLWIEK do zapisania. Tytuł obowiązkowy
  // jest dopiero przy publikacji (status PUBLISHED).
  const hasContent =
    !!body?.title?.trim() ||
    !!body?.video ||
    (Array.isArray(body?.curriculum) && body.curriculum.length > 0);
  if (!body || !hasContent) {
    return NextResponse.json(
      { error: "Brak treści kursu do zapisania." },
      { status: 400 },
    );
  }

  // Unikalny slug (gdy brak tytułu → bazowy „kurs").
  const base = slugify(body.title || "") || "kurs";
  let slug = base;
  let n = 1;
  while (await prisma.course.findUnique({ where: { slug } })) {
    slug = `${base}-${++n}`;
  }

  const format = body.format === "single" ? "single" : "sections";
  // Szkic (autozapis kreatora) vs publikacja. Domyślnie PUBLISHED — zgodnie z
  // dotychczasowym zachowaniem; kreator przy autozapisie wysyła DRAFT.
  const status =
    body.status === "DRAFT" || body.status === "ARCHIVED"
      ? body.status
      : "PUBLISHED";

  // Bramka publikacji: opublikowany kurs MUSI mieć komplet krytycznych danych
  // (tytuł, kategoria, cena, opis, okładka, wideo, treść, FAQ, OG image).
  // Szkic/archiwum można zapisać bez nich. Reguły = src/lib/coursePublishGate.
  if (status === "PUBLISHED") {
    const gate = coursePublishBlockers({
      title: body.title,
      category: body.category,
      price:
        body.price === "" || body.price == null
          ? null
          : Number(body.price),
      excerpt: body.excerpt,
      image: body.image,
      ogImage: body.ogImage,
      format,
      video: body.video,
      modules: Array.isArray(body.curriculum) ? body.curriculum : [],
      description: body.description,
      faq: body.faq,
    });
    if (!gate.ok) {
      return NextResponse.json(coursePublishError(gate.labels), { status: 400 });
    }
  }

  let lessonsTotalSec = 0;
  const modulesData =
    format === "sections" && Array.isArray(body.curriculum)
      ? (body.curriculum as ModuleIn[])
          .map((m, mi) => {
            const lessons = (m.lessons || [])
              .filter((l) => l.title?.trim())
              .map((l, li) => {
                const durationSec = toSec(l.durationSec);
                lessonsTotalSec += durationSec;
                return {
                  title: (l.title as string).trim(),
                  description: l.description?.trim() || null,
                  video: l.video || null,
                  durationSec,
                  order: li,
                };
              });
            return {
              title: (m.title || `Moduł ${mi + 1}`).trim(),
              order: mi,
              lessons: { create: lessons },
              _count: lessons.length,
            };
          })
          .filter((m) => m._count > 0)
          .map(({ _count, ...m }) => m)
      : [];

  // Czas materiału liczymy z realnych długości wideo (Bunny): „single" = długość
  // filmu, „sections" = suma lekcji. Gdy jeszcze nieznane (0) — fallback do
  // ręcznego durationMin z body.
  const videoDurationSec = toSec(body.videoDurationSec);
  const totalSec = format === "single" ? videoDurationSec : lessonsTotalSec;
  // Poniżej minuty zaokrąglamy w górę do 1 min (krótkie wideo nie ma „0 min").
  const durationMin =
    totalSec > 0
      ? Math.max(1, Math.round(totalSec / 60))
      : Math.max(0, Math.round(Number(body.durationMin) || 0));

  const course = await prisma.course.create({
    data: {
      slug,
      title: (body.title || "").trim(),
      category: (body.category || "Inne").trim(),
      excerpt: (body.excerpt || "").trim(),
      price: Math.max(0, Math.round(Number(body.price) || 0)),
      durationMin,
      format,
      video: body.video || null,
      videoDurationSec,
      image: body.image || null,
      status,
      // Piaskownica — kurs zapisuje się normalnie, ale zobaczą go tylko admin
      // i testerzy (patrz src/lib/sandbox).
      sandbox: body.sandbox === true,
      // Data publikacji — ustawiamy, gdy kurs powstaje już jako opublikowany.
      publishedAt: status === "PUBLISHED" ? new Date() : null,
      // SEO / Open Graph
      metaTitle: body.metaTitle?.trim() || null,
      metaDescription: body.metaDescription?.trim() || null,
      focusKeyword: body.focusKeyword?.trim() || null,
      ogImage: body.ogImage?.trim() || null,
      canonicalUrl: body.canonicalUrl?.trim() || null,
      noIndex: body.noIndex === true,
      // Treść strony sprzedażowej (krok „Treść" w kreatorze).
      description: Array.isArray(body.description) ? body.description : undefined,
      content: Array.isArray(body.content) ? body.content : undefined,
      faq: Array.isArray(body.faq) ? body.faq : undefined,
      ...(modulesData.length ? { modules: { create: modulesData } } : {}),
    },
    select: { id: true, slug: true },
  });

  return NextResponse.json({ ok: true, ...course });
}
