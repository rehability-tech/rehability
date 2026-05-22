import React from "react";
import parse from "html-react-parser";
import { Plus, Minus } from "@phosphor-icons/react/dist/ssr";

interface FaqItem {
  id?: string;
  question?: string;
  answer?: string;
}

export default function FaqBlock({ content }: { content: any }) {
  const items: FaqItem[] = Array.isArray(content?.items) ? content.items : [];
  if (items.length === 0) return null;

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items
      .filter((it) => it.question && it.answer)
      .map((it) => ({
        "@type": "Question",
        name: it.question,
        acceptedAnswer: {
          "@type": "Answer",
          text: it.answer,
        },
      })),
  };

  return (
    <div className="max-w-[900px] mx-auto px-4 w-full">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <div className="w-full flex flex-col bg-white">
        {items.map((item, idx) => {
          const formattedNumber = String(idx + 1).padStart(2, "0");
          const isFirst = idx === 0;
          return (
            <details
              key={item.id || idx}
              open={isFirst}
              className={`group/faq w-full bg-white border-b border-[#0B3B4C]/20 ${
                isFirst ? "border-t" : ""
              }`}
            >
              <summary
                className="
                  list-none [&::-webkit-details-marker]:hidden
                  flex flex-col @[600px]:flex-row @[600px]:items-start
                  gap-4 @[600px]:gap-10 py-6 @[600px]:py-10
                  cursor-pointer select-none
                "
              >
                <div className="flex justify-between items-center w-full @[600px]:w-auto">
                  <div className="font-jakarta font-bold text-[40px] @[600px]:text-[48px] @[600px]:self-center leading-none text-[#0B3B4C] @[600px]:mt-1">
                    {formattedNumber}
                  </div>
                  <span
                    aria-hidden="true"
                    className="@[600px]:hidden w-8 h-8 shrink-0 rounded-full bg-[#287D88] text-white flex items-center justify-center shadow-[0_4px_10px_rgba(40,125,136,0.3)]"
                  >
                    <Plus
                      size={18}
                      weight="bold"
                      className="block group-open/faq:hidden"
                    />
                    <Minus
                      size={18}
                      weight="bold"
                      className="hidden group-open/faq:block"
                    />
                  </span>
                </div>

                <h3 className="flex-1 font-montserrat font-semibold text-[16px] md:text-[18px] leading-[140%] text-[#0B3B4C] group-hover/faq:text-[#287D88] group-open/faq:text-[#287D88] transition-colors m-0">
                  {item.question}
                </h3>

                <span
                  aria-hidden="true"
                  className="hidden @[600px]:flex w-10 h-10 self-start shrink-0 rounded-full bg-[#287D88] text-white items-center justify-center shadow-[0_4px_10px_rgba(40,125,136,0.3)] mt-1"
                >
                  <Plus
                    size={18}
                    weight="bold"
                    className="block group-open/faq:hidden"
                  />
                  <Minus
                    size={18}
                    weight="bold"
                    className="hidden group-open/faq:block"
                  />
                </span>
              </summary>

              <div className="pb-6 @[600px]:pb-10 @[600px]:pl-[88px] font-montserrat text-[#0B3B4C]/80 text-[14px] md:text-[15px] leading-[170%] [&_p]:m-0 [&_p+p]:mt-3">
                {parse(item.answer || "")}
              </div>
            </details>
          );
        })}
      </div>
    </div>
  );
}
