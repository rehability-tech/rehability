"use client";

import React from "react";
import { Plus, Trash, CheckCircle } from "@phosphor-icons/react/dist/ssr";
import RichTextInput from "../lib/RichTextInput";
import { safeUuid } from "@/lib/utils";

// TYPOWANIE PROPSÓW
interface BulletListBlockProps {
  content: any;
  onChange: (newContent: any) => void;
}

export default function BulletListBlock({
  content,
  onChange,
}: BulletListBlockProps) {
  const listItems = content?.items || [];
  // Id punktu, który ma dostać fokus po dodaniu (Enter → nowy punkt).
  const [focusId, setFocusId] = React.useState<string | null>(null);

  // Enter na punkcie idx → wstaw nowy punkt zaraz pod nim i przenieś tam fokus.
  const addItemAfter = (idx: number) => {
    const newItem = { id: safeUuid(), text: "" };
    const newItems = [...listItems];
    newItems.splice(idx + 1, 0, newItem);
    onChange({ items: newItems });
    setFocusId(newItem.id);
  };

  return (
    <div className="w-full flex flex-col gap-3">
      {listItems.map((item: any, idx: number) => (
        <div key={item.id} className="flex items-start gap-4 w-full group/item">
          <CheckCircle
            size={24}
            weight="fill"
            className="text-[#287D88] shrink-0 mt-1"
          />
          <div className="flex-1 w-full">
            <RichTextInput
              value={item.text || ""}
              onChange={(newHtml) => {
                const newItems = [...listItems];
                newItems[idx].text = newHtml;
                onChange({ items: newItems });
              }}
              onEnter={() => addItemAfter(idx)}
              autoFocus={focusId === item.id}
              className="text-gray-600 font-montserrat text-base leading-[1.7]"
            />
          </div>
          <button
            onClick={() =>
              onChange({
                items: listItems.filter((_: any, i: number) => i !== idx),
              })
            }
            className="p-1.5 text-gray-300 hover:text-red-500 opacity-0 group-hover/item:opacity-100 transition-opacity shrink-0"
            title="Usuń punkt"
          >
            <Trash size={18} weight="bold" />
          </button>
        </div>
      ))}

      <button
        onClick={() =>
          onChange({
            items: [...listItems, { id: safeUuid(), text: "" }],
          })
        }
        className="flex items-start gap-4 w-full opacity-50 hover:opacity-100 transition-opacity group/add cursor-pointer mt-1"
      >
        <div className="w-6 h-6 flex items-center justify-center shrink-0 mt-1">
          <Plus size={20} weight="bold" className="text-[#287D88]" />
        </div>
        <span className="text-gray-400 font-montserrat text-base leading-[1.7] italic">
          Dodaj kolejny punkt...
        </span>
      </button>
    </div>
  );
}
