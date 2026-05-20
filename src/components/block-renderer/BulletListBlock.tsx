import React from "react";
import parse from "html-react-parser";
import { CheckCircle } from "@phosphor-icons/react/dist/ssr";

export default function BulletListBlock({ content }: { content: any }) {
  if (
    !content?.items ||
    !Array.isArray(content.items) ||
    content.items.length === 0
  )
    return null;

  return (
    <div className="max-w-3xl mx-auto px-4 w-full my-6">
      <ul className="flex flex-col gap-4">
        {content.items.map((item: any, idx: number) => (
          <li key={item.id || idx} className="flex items-start gap-4">
            <div className="mt-0.5 shrink-0">
              <CheckCircle
                size={22}
                weight="fill"
                className="text-brand-primary"
              />
            </div>
            <div className="font-montserrat text-gray-600 leading-relaxed text-[15px] md:text-base">
              {parse(item.text || "")}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
