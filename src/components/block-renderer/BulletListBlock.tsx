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
    <ul className="w-full flex flex-col gap-3 text-left">
      {content.items.map((item: any, idx: number) => (
        <li key={item.id || idx} className="flex items-start gap-4 w-full">
          <CheckCircle
            size={24}
            weight="fill"
            className="text-[#287D88] shrink-0 mt-1"
          />
          <div
            className="
              flex-1 text-gray-600 font-montserrat text-base leading-[1.7]
              [&_p]:m-0 [&_p+p]:mt-2
              [&_strong]:font-semibold [&_strong]:text-[#0B3B4C]
              [&_em]:italic
              [&_a]:text-[#287D88] [&_a]:underline
              [&_span]:text-inherit
            "
          >
            {parse(item.text || "")}
          </div>
        </li>
      ))}
    </ul>
  );
}
