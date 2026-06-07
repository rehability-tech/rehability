"use client";

import { Suspense } from "react";
import { CircleNotch } from "@phosphor-icons/react/dist/ssr";
import EmailTemplateEditor from "../_components/EmailTemplateEditor";

export default function DodajSzablonPage() {
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
      <EmailTemplateEditor templateId={null} />
    </Suspense>
  );
}
