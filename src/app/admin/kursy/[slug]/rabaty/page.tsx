"use client";

import { useParams } from "next/navigation";

import DiscountsPanel from "@/app/admin/_components/discounts/DiscountsPanel";

/** Rabaty kursu — ten sam panel co przy wydarzeniach, inna baza tras API. */
export default function CourseDiscountsPage() {
  const { slug } = useParams<{ slug: string }>();

  return (
    <DiscountsPanel
      apiBase={`/api/admin/kursy/${slug}/rabaty`}
      backHref={`/admin/kursy/${slug}`}
      backLabel="Pulpit kursu"
      currentProductId={slug}
    />
  );
}
