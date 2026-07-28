import { notFound, redirect } from "next/navigation";
import { getDashboardData } from "../_data";

export const dynamic = "force-dynamic";

/**
 * Wejście „Edytuj kurs" — ujednolicone z wydarzenieami: edycja kursu odbywa się w
 * kreatorze (CourseWizard), nie w osobnych zakładkach dashboardu. Trasa zna tylko
 * slug, a kreator wczytuje kurs po ID (GET /api/admin/kursy/[id]), więc tu
 * zamieniamy slug → id i przekierowujemy do kreatora w trybie edycji.
 * `step=1` → ląduje na pierwszym kroku edycji (Program / Dane), pomijając Start.
 */
export default async function EditCourseRedirectPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const data = await getDashboardData(slug);
  if (!data) notFound();
  redirect(`/admin/kursy/dodaj?draft=${data.id}&step=1&format=${data.format}`);
}
