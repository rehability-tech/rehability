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
    <div className="max-w-3xl px-4 w-full">
      <ul className="w-full flex flex-col gap-y-4 @md:gap-y-3">
        {content.items.map((item: any, idx: number) => (
          <li
            key={item.id || idx}
            className="flex items-start gap-3 @md:gap-4 w-full"
          >
            <div className="w-7 h-7 @md:w-8 @md:h-8 flex items-center justify-center rounded-full bg-[#287D88]/10 shrink-0 mt-0.5">
              <CheckCircle
                size={18}
                weight="fill"
                className="text-[#287D88]"
              />
            </div>
            <div className="flex-1 text-gray-700 font-montserrat text-[15px] @md:text-base leading-[1.6] @md:leading-[1.7] pt-0.5">
              {parse(item.text || "")}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
