import { requireAdmin } from "@/lib/auth/requireAdmin";
import { addMembers, removeMember } from "@/lib/discounts/adminHandlers";
import { loadCourseForDiscounts } from "@/lib/discounts/adminWrite";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string; edId: string }> };

/** POST — masowe dodanie adresów do listy rabatu mailowego kursu. */
export async function POST(req: Request, { params }: Params) {
  const auth = await requireAdmin();
  if (!auth.isAuthorized) return auth.response;

  const { id: slug, edId } = await params;
  const course = await loadCourseForDiscounts(slug);
  if (!course.ok) return course.response;

  return addMembers(req, course.owner, edId);
}

/** DELETE ?email=... — usunięcie jednego adresu z listy. */
export async function DELETE(req: Request, { params }: Params) {
  const auth = await requireAdmin();
  if (!auth.isAuthorized) return auth.response;

  const { id: slug, edId } = await params;
  const course = await loadCourseForDiscounts(slug);
  if (!course.ok) return course.response;

  return removeMember(req, course.owner, edId);
}
