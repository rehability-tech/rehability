"use client";

import React from "react";
import { FAQ, FAQItemData } from "@/components/ui/FAQ";

export default function FaqBlock({ content }: { content: any }) {
  if (
    !content?.items ||
    !Array.isArray(content.items) ||
    content.items.length === 0
  )
    return null;

  const items: FAQItemData[] = content.items
    .filter((it: any) => it?.question || it?.answer)
    .map((it: any) => ({
      question: it.question || "",
      answer: it.answer || "",
    }));

  if (items.length === 0) return null;

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((it) => ({
      "@type": "Question",
      name: it.question,
      acceptedAnswer: { "@type": "Answer", text: it.answer },
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <FAQ titlePrefix="" titleHighlight="" items={items} />
    </>
  );
}
