"use client";

import { Suspense, use } from "react";
import { CircleNotch } from "@phosphor-icons/react/dist/ssr";
import CampaignEditor from "../_components/CampaignEditor";

export default function EdytujKampaniePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[400px]">
          <CircleNotch
            size={40}
            weight="bold"
            className="text-brand-primary animate-spin"
          />
        </div>
      }
    >
      <CampaignEditor campaignId={id} />
    </Suspense>
  );
}
