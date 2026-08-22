import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/requireAdmin";
import { getDiscountPanelData } from "@/lib/discounts/adminQueries";
import { loadCourseForDiscounts } from "@/lib/discounts/adminWrite";

export const dynamic = "force-dynamic";

/** GET — pełny stan panelu rabatów kursu (te same dane co przy wydarzeniu). */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireAdmin();
  if (!auth.isAuthorized) return auth.response;

  const { id: slug } = await params;
  const course = await loadCourseForDiscounts(slug);
  if (!course.ok) return course.response;

  const data = await getDiscountPanelData(course.owner);
  if (!data) {
    return NextResponse.json({ error: "Kurs nie istnieje." }, { status: 404 });
  }

  return NextResponse.json(data);
}
