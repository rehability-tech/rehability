import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/requireAdmin";
import { prisma } from "@/lib/prisma";
import { sandboxActionSchema } from "@/lib/zod/discountValidators";
import {
  publishCourseSandbox,
  setCourseSandbox,
} from "@/lib/discounts/publishSandbox";
import { loadCourseForDiscounts, validationError } from "@/lib/discounts/adminWrite";

export const dynamic = "force-dynamic";

/** GET — lekki stan piaskownicy dla przełącznika w topbarze. */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireAdmin();
  if (!auth.isAuthorized) return auth.response;

  const { id: slug } = await params;
  const course = await prisma.course.findFirst({
    where: { OR: [{ slug }, { id: slug }] },
    select: { id: true, title: true, discountSandbox: true },
  });
  if (!course) {
    return NextResponse.json({ error: "Kurs nie istnieje." }, { status: 404 });
  }

  const scope = { courseId: course.id, isSandbox: true } as const;
  const [codes, sales, emailDiscounts] = await Promise.all([
    prisma.discountCode.count({ where: scope }),
    prisma.sale.count({ where: scope }),
    prisma.emailDiscount.count({ where: scope }),
  ]);

  return NextResponse.json({
    courseId: course.id,
    tripTitle: course.title,
    enabled: course.discountSandbox,
    since: null,
    // Kurs nie ma cennika testowego — patrz publishSandbox.ts.
    sandboxPriceGrosze: null,
    sandboxDepositGrosze: null,
    draftCount: codes + sales + emailDiscounts,
  });
}

/**
 * PATCH — sterowanie piaskownicą kursu.
 *
 * `prices` nie ma zastosowania (kurs nie ma ceny testowej), więc przyjmujemy
 * je dla zgodności kształtu z wydarzeniami i po prostu ignorujemy.
 */
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireAdmin();
  if (!auth.isAuthorized) return auth.response;

  const { id: slug } = await params;
  const course = await loadCourseForDiscounts(slug);
  if (!course.ok) return course.response;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Nieprawidłowe dane." }, { status: 400 });
  }

  const parsed = sandboxActionSchema.safeParse(body);
  if (!parsed.success) return validationError(parsed.error.issues);

  const courseId = course.owner.kind === "course" ? course.owner.courseId : "";

  try {
    if (parsed.data.action === "prices") {
      return NextResponse.json({
        success: true,
        message: "Kurs nie ma cennika testowego — nic nie zmieniono.",
      });
    }

    if (parsed.data.action === "enable") {
      await setCourseSandbox(courseId, true);
      return NextResponse.json({
        success: true,
        message: "Piaskownica włączona. Nowe promocje widzi tylko administrator.",
      });
    }

    if (parsed.data.action === "publish") {
      await publishCourseSandbox(courseId);
      return NextResponse.json({
        success: true,
        message: "Opublikowano promocje testowe i wyłączono piaskownicę.",
      });
    }

    await setCourseSandbox(courseId, false);
    return NextResponse.json({
      success: true,
      message: "Piaskownica wyłączona. Promocje testowe zostały jako szkice.",
    });
  } catch (error) {
    console.error("[admin/kursy/rabaty/sandbox] PATCH error:", error);
    return NextResponse.json(
      { error: "Nie udało się zmienić trybu piaskownicy." },
      { status: 500 },
    );
  }
}
