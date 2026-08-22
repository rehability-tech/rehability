import { requireAdmin } from "@/lib/auth/requireAdmin";
import { deletePromo, patchPromo } from "@/lib/discounts/adminHandlers";
import { loadCourseForDiscounts } from "@/lib/discounts/adminWrite";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string; saleId: string }> };

export async function PATCH(req: Request, { params }: Params) {
  const auth = await requireAdmin();
  if (!auth.isAuthorized) return auth.response;

  const { id: slug, saleId } = await params;
  const course = await loadCourseForDiscounts(slug);
  if (!course.ok) return course.response;

  return patchPromo(req, course.owner, course.sandbox, "sale", saleId);
}

export async function DELETE(_req: Request, { params }: Params) {
  const auth = await requireAdmin();
  if (!auth.isAuthorized) return auth.response;

  const { id: slug, saleId } = await params;
  const course = await loadCourseForDiscounts(slug);
  if (!course.ok) return course.response;

  return deletePromo(course.owner, "sale", saleId);
}
