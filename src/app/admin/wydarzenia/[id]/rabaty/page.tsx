"use client";

import { useParams } from "next/navigation";

import DiscountsPanel from "@/app/admin/_components/discounts/DiscountsPanel";

/** Rabaty wydarzenia — cienkie opakowanie na wspólny panel. */
export default function TripDiscountsPage() {
  const { id } = useParams<{ id: string }>();

  return (
    <DiscountsPanel
      apiBase={`/api/admin/wydarzenia/${id}/rabaty`}
      backHref={`/admin/wydarzenia/${id}`}
      backLabel="Pulpit wydarzenia"
      currentProductId={id}
    />
  );
}
