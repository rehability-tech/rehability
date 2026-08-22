import { requireAdmin } from "@/lib/auth/requireAdmin";
import { createPromo } from "@/lib/discounts/adminHandlers";
import { loadCourseForDiscounts } from "@/lib/discounts/adminWrite";

export const dynamic = "force-dynamic";

/** POST — nowy rabat mailowy kursu (lista adresów dodawana osobno). */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireAdmin();
  if (!auth.isAuthorized) return auth.response;

  const { id: slug } = await params;
  const course = await loadCourseForDiscounts(slug);
  if (!course.ok) return course.response;

  return createPromo(req, course.owner, course.sandbox, "emailDiscount");
}
