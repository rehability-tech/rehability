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
      <div className="w-full flex flex-col gap-3">
        {content.items.map((item: any, idx: number) => (
          <div
            key={item.id || idx}
            className="flex items-start gap-4 w-full"
          >
            <CheckCircle
              size={24}
              weight="fill"
              className="text-[#287D88] shrink-0 mt-1"
            />
            <div className="flex-1 w-full text-gray-600 font-montserrat text-base leading-[1.7]">
              {parse(item.text || "")}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
