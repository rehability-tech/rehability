import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth/requireAdmin";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@/generated/prisma";
import { sendNotification, sendNotificationToAll } from "@/lib/notifications/send";
import {
  coursePublishBlockers,
  coursePublishError,
} from "@/lib/coursePublishGate";

const paramsSchema = z.object({ id: z.string().min(1) });

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

const lessonSchema = z.object({
  id: z.string().optional(),
  title: z.string().trim().min(1),
  description: z.string().nullable().optional(),
  video: z.string().nullable().optional(),
  durationSec: z.number().int().min(0).optional(),
});

const moduleSchema = z.object({
  id: z.string().optional(),
  title: z.string().trim().min(1),
  lessons: z.array(lessonSchema).default([]),
});

const patchSchema = z.object({
  title: z.string().trim().min(1).optional(),
  category: z.string().trim().min(1).optional(),
  excerpt: z.string().optional(),
  price: z.number().int().min(0).optional(),
  durationMin: z.number().int().min(0).optional(),
  status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]).optional(),
  format: z.enum(["single", "sections"]).optional(),
  image: z.string().nullable().optional(),
  video: z.string().nullable().optional(),
  videoDurationSec: z.number().int().min(0).optional(),
  // Treść strony kursu (sekcje „O kursie" / „Zawartość" / „FAQ"). null = fallback.
  description: z.array(z.any()).nullable().optional(),
  content: z.array(z.any()).nullable().optional(),
  faq: z
    .array(z.object({ q: z.string(), a: z.string() }))
    .nullable()
    .optional(),
  // SEO / Open Graph
  metaTitle: z.string().nullable().optional(),
  metaDescription: z.string().nullable().optional(),
  focusKeyword: z.string().nullable().optional(),
  ogImage: z.string().nullable().optional(),
  canonicalUrl: z.string().nullable().optional(),
  noIndex: z.boolean().optional(),
  /** Pełna struktura programu — synchronizowana w miejscu po ID. */
  modules: z.array(moduleSchema).optional(),
});

function isP2025(error: unknown): boolean {
  return (
    !!error &&
    typeof error === "object" &&
    "code" in error &&
    (error as { code?: string }).code === "P2025"
  );
}

// Pełny kurs w kształcie Draft kreatora — używane do przywrócenia szkicu
// po odświeżeniu strony (kreator wczytuje ?draft=<id>).
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { isAuthorized, response } = await requireAdmin();
    if (!isAuthorized) return response as NextResponse;

    const { id } = paramsSchema.parse(await params);
    const course = await prisma.course.findUnique({
      where: { id },
      include: {
        modules: {
          orderBy: { order: "asc" },
          include: { lessons: { orderBy: { order: "asc" } } },
        },
      },
    });
    if (!course) {
      return NextResponse.json({ error: "Kurs nie istnieje." }, { status: 404 });
    }

    const draft = {
      title: course.title,
      category: course.category,
      price: course.price,
      durationMin: course.durationMin,
      excerpt: course.excerpt,
      format: course.format === "single" ? "single" : "sections",
      video: course.video ?? "",
      videoDurationSec: course.videoDurationSec ?? 0,
      image: course.image ?? "",
      metaTitle: course.metaTitle ?? "",
      metaDescription: course.metaDescription ?? "",
      focusKeyword: course.focusKeyword ?? "",
      ogImage: course.ogImage ?? "",
      canonicalUrl: course.canonicalUrl ?? "",
      noIndex: course.noIndex ?? false,
      // Treść strony sprzedażowej — edytowana w kreatorze (krok „Treść").
      description: course.description ?? null,
      content: course.content ?? null,
      faq: course.faq ?? null,
      // ID modułów/lekcji wracają do kreatora, żeby PATCH synchronizował je
      // w miejscu (zachowuje postępy kursantów, nie kasuje i nie tworzy od nowa).
      curriculum: course.modules.length
        ? course.modules.map((m) => ({
            id: m.id,
            title: m.title,
            lessons: m.lessons.map((l) => ({
              id: l.id,
              title: l.title,
              description: l.description ?? "",
              video: l.video ?? "",
              durationSec: l.durationSec ?? 0,
            })),
          }))
        : [{ title: "", lessons: [{ title: "", video: "" }] }],
    };

    return NextResponse.json({ draft, status: course.status });
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Nieprawidłowe dane" }, { status: 400 });
    }
    console.error("Błąd GET kursu:", error);
    return NextResponse.json({ error: "Błąd serwera" }, { status: 500 });
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { isAuthorized, response } = await requireAdmin();
    if (!isAuthorized) return response as NextResponse;

    const { id } = paramsSchema.parse(await params);
    const body = await req.json();
    const data = patchSchema.parse(body);

    // Liczymy lekcje PRZED zapisem — żeby wykryć czy dodano nowe.
    const lessonCountBefore =
      data.modules && data.status !== "DRAFT"
        ? await prisma.lesson.count({
            where: { module: { courseId: id } },
          })
        : null;

    // Bramka publikacji: przejście na PUBLISHED wymaga kompletu krytycznych
    // danych. Liczymy stan EFEKTYWNY — z payloadu (kreator) albo z bazy (zmiana
    // statusu z listy nie wysyła pełnych danych). Reguły = coursePublishGate.
    let previousStatus: string | null = null;
    // Czy kurs miał już kiedyś datę publikacji (ustawiamy ją tylko raz).
    let alreadyPublishedAt = true;
    if (data.status === "PUBLISHED") {
      const current = await prisma.course.findUnique({
        where: { id },
        select: {
          title: true,
          category: true,
          price: true,
          excerpt: true,
          image: true,
          ogImage: true,
          video: true,
          format: true,
          description: true,
          faq: true,
          status: true,
          publishedAt: true,
          modules: {
            select: { lessons: { select: { title: true, video: true } } },
          },
        },
      });
      previousStatus = current?.status ?? null;
      alreadyPublishedAt = current?.publishedAt != null;

      const gate = coursePublishBlockers({
        title: data.title !== undefined ? data.title : current?.title,
        category:
          data.category !== undefined ? data.category : current?.category,
        price: data.price !== undefined ? data.price : current?.price ?? null,
        excerpt: data.excerpt !== undefined ? data.excerpt : current?.excerpt,
        image: data.image !== undefined ? data.image : current?.image,
        ogImage: data.ogImage !== undefined ? data.ogImage : current?.ogImage,
        format: (data.format ?? current?.format ?? "sections") as
          | "single"
          | "sections",
        video: data.video !== undefined ? data.video : current?.video,
        modules:
          data.modules !== undefined
            ? data.modules
            : (current?.modules ?? []).map((m) => ({ lessons: m.lessons })),
        description:
          data.description !== undefined
            ? data.description
            : current?.description,
        faq: data.faq !== undefined ? data.faq : current?.faq,
      });
      if (!gate.ok) {
        return NextResponse.json(coursePublishError(gate.labels), {
          status: 400,
        });
      }
    }

    // Pola skalarne kursu (tylko te przesłane).
    const scalar: Record<string, unknown> = {};
    if (data.title !== undefined) scalar.title = data.title;
    if (data.category !== undefined) scalar.category = data.category;
    if (data.excerpt !== undefined) scalar.excerpt = data.excerpt;
    if (data.price !== undefined) scalar.price = data.price;
    if (data.durationMin !== undefined) scalar.durationMin = data.durationMin;
    if (data.status !== undefined) scalar.status = data.status;
    // Pierwsza publikacja → zapisz datę publikacji (raz; potem jej nie ruszamy).
    if (data.status === "PUBLISHED" && !alreadyPublishedAt)
      scalar.publishedAt = new Date();
    if (data.format !== undefined) scalar.format = data.format;
    if (data.image !== undefined) scalar.image = data.image || null;
    if (data.video !== undefined) scalar.video = data.video || null;
    if (data.videoDurationSec !== undefined)
      scalar.videoDurationSec = data.videoDurationSec;
    if (data.description !== undefined)
      scalar.description = data.description ?? Prisma.DbNull;
    if (data.content !== undefined)
      scalar.content = data.content ?? Prisma.DbNull;
    if (data.faq !== undefined) scalar.faq = data.faq ?? Prisma.DbNull;
    if (data.metaTitle !== undefined)
      scalar.metaTitle = data.metaTitle?.trim() || null;
    if (data.metaDescription !== undefined)
      scalar.metaDescription = data.metaDescription?.trim() || null;
    if (data.focusKeyword !== undefined)
      scalar.focusKeyword = data.focusKeyword?.trim() || null;
    if (data.ogImage !== undefined) scalar.ogImage = data.ogImage || null;
    if (data.canonicalUrl !== undefined)
      scalar.canonicalUrl = data.canonicalUrl?.trim() || null;
    if (data.noIndex !== undefined) scalar.noIndex = data.noIndex;

    // Czas materiału z realnych długości wideo (Bunny): „single" = długość filmu,
    // „sections" = suma lekcji. Liczymy tylko, gdy przyszedł `format` (pełny patch
    // z kreatora) — zwykły patch statusu z listy nie rusza durationMin.
    if (data.format !== undefined) {
      const lessonsSec = (data.modules ?? []).reduce(
        (s, m) => s + m.lessons.reduce((ls, l) => ls + (l.durationSec ?? 0), 0),
        0,
      );
      const totalSec =
        data.format === "single" ? (data.videoDurationSec ?? 0) : lessonsSec;
      // Poniżej minuty zaokrąglamy w górę do 1 min (krótkie wideo nie ma „0 min").
      if (totalSec > 0) scalar.durationMin = Math.max(1, Math.round(totalSec / 60));
    }

    await prisma.$transaction(async (tx) => {
      // Przy przejściu DRAFT → PUBLISHED reguluj slug z tytułu: szkic mógł
      // powstać bez tytułu (slug „kurs"), a publikowany kurs staje się publiczny.
      // Slugu już opublikowanych kursów NIE ruszamy (stałe linki).
      if (data.status === "PUBLISHED" && data.title) {
        const current = await tx.course.findUnique({
          where: { id },
          select: { status: true },
        });
        if (current?.status === "DRAFT") {
          const base = slugify(data.title) || "kurs";
          let slug = base;
          let n = 1;
          while (
            await tx.course.findFirst({
              where: { slug, NOT: { id } },
              select: { id: true },
            })
          ) {
            slug = `${base}-${++n}`;
          }
          scalar.slug = slug;
        }
      }

      // Zawsze dotykamy kursu (bump updatedAt) — UI rozpoznaje świeży stan po
      // tej dacie (remount edytora z realnymi ID nowych lekcji).
      await tx.course.update({
        where: { id },
        data: { ...scalar, updatedAt: new Date() },
      });

      if (data.modules) {
        const existing = await tx.courseModule.findMany({
          where: { courseId: id },
          include: { lessons: { select: { id: true } } },
        });

        // Usuń moduły, których nie ma już w payloadzie.
        const incomingModuleIds = new Set(
          data.modules.filter((m) => m.id).map((m) => m.id as string),
        );
        const modulesToDelete = existing
          .filter((m) => !incomingModuleIds.has(m.id))
          .map((m) => m.id);
        if (modulesToDelete.length) {
          await tx.courseModule.deleteMany({
            where: { id: { in: modulesToDelete } },
          });
        }

        // Upsert modułów w nowej kolejności.
        for (let mi = 0; mi < data.modules.length; mi++) {
          const m = data.modules[mi];
          const existingMod = m.id
            ? existing.find((e) => e.id === m.id)
            : undefined;

          let moduleId: string;
          if (existingMod) {
            await tx.courseModule.update({
              where: { id: existingMod.id },
              data: { title: m.title, order: mi },
            });
            moduleId = existingMod.id;
          } else {
            const created = await tx.courseModule.create({
              data: { courseId: id, title: m.title, order: mi },
            });
            moduleId = created.id;
          }

          // Synchronizacja lekcji w obrębie modułu (po ID → zachowuje postępy).
          const existingLessonIds = new Set(
            (existingMod?.lessons ?? []).map((l) => l.id),
          );
          const incomingLessonIds = new Set(
            m.lessons.filter((l) => l.id).map((l) => l.id as string),
          );
          const lessonsToDelete = [...existingLessonIds].filter(
            (lid) => !incomingLessonIds.has(lid),
          );
          if (lessonsToDelete.length) {
            await tx.lesson.deleteMany({
              where: { id: { in: lessonsToDelete } },
            });
          }

          for (let li = 0; li < m.lessons.length; li++) {
            const l = m.lessons[li];
            if (l.id && existingLessonIds.has(l.id)) {
              await tx.lesson.update({
                where: { id: l.id },
                data: {
                  title: l.title,
                  description: l.description || null,
                  video: l.video || null,
                  durationSec: l.durationSec ?? 0,
                  order: li,
                },
              });
            } else {
              await tx.lesson.create({
                data: {
                  moduleId,
                  title: l.title,
                  description: l.description || null,
                  video: l.video || null,
                  durationSec: l.durationSec ?? 0,
                  order: li,
                },
              });
            }
          }
        }
      }
    });

    const updated = await prisma.course.findUnique({
      where: { id },
      select: { id: true, slug: true, title: true, status: true },
    });

    // Nowa publikacja kursu (DRAFT/ARCHIVED → PUBLISHED) — push do wszystkich.
    if (
      data.status === "PUBLISHED" &&
      previousStatus !== null &&
      previousStatus !== "PUBLISHED" &&
      updated?.slug &&
      updated.title
    ) {
      void sendNotificationToAll({
        title: "🎓 Nowy kurs dostępny",
        message: `Sprawdź nowy kurs „${updated.title}" — zapisz się już teraz!`,
        type: "VOD",
        link: `/kursy/${updated.slug}`,
      });
    }

    // Jeśli kurs jest opublikowany i przybyły nowe lekcje — powiadom kursantów.
    if (
      lessonCountBefore !== null &&
      updated?.status === "PUBLISHED" &&
      updated.slug &&
      updated.title
    ) {
      const lessonCountAfter = await prisma.lesson.count({
        where: { module: { courseId: id } },
      });
      if (lessonCountAfter > lessonCountBefore) {
        const enrollments = await prisma.enrollment.findMany({
          where: { courseId: id },
          select: { userId: true },
        });
        void Promise.all(
          enrollments.map((e) =>
            sendNotification({
              userId: e.userId,
              title: "🎬 Nowe lekcje w kursie",
              message: `Do kursu „${updated.title}" dodano nowe materiały. Sprawdź co nowego!`,
              type: "VOD",
              link: `/panel/vod/${updated.slug}`,
              push: true,
            }),
          ),
        );
      }
    }

    return NextResponse.json({ ok: true, id: updated?.id, slug: updated?.slug });
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Nieprawidłowe dane", details: error.flatten() },
        { status: 400 },
      );
    }
    if (isP2025(error)) {
      return NextResponse.json(
        { error: "Kurs nie istnieje (mógł zostać usunięty)." },
        { status: 404 },
      );
    }
    console.error("Błąd PATCH kursu:", error);
    return NextResponse.json({ error: "Błąd serwera" }, { status: 500 });
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { isAuthorized, response } = await requireAdmin();
    if (!isAuthorized) return response as NextResponse;

    const { id } = paramsSchema.parse(await params);
    await prisma.course.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (error: unknown) {
    if (isP2025(error)) {
      return NextResponse.json({ ok: true, alreadyGone: true });
    }
    console.error("Błąd usuwania kursu:", error);
    return NextResponse.json({ error: "Błąd serwera" }, { status: 500 });
  }
}
