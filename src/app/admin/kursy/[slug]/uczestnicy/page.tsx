import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getDashboardData, getParticipantsData } from "../_data";
import { CourseDashboard } from "../_components/CourseDashboard";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const data = await getDashboardData(slug);
  return {
    title: data ? `Uczestnicy – ${data.title}` : "Kurs nie znaleziony",
  };
}

export default async function AdminCourseParticipantsPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const data = await getDashboardData(slug);
  if (!data) notFound();
  const participants = await getParticipantsData(data.id);
  return (
    <CourseDashboard data={data} active="participants" participants={participants} />
  );
}
