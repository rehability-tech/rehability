"use client";

import { useState } from "react";
import { CaretDown } from "@phosphor-icons/react/dist/ssr";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface FaqItem {
  id: string;
  question: string;
  answer: string;
}

export default function BlogFaqBlock({ items }: { items: FaqItem[] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  if (!items.length) return null;

  return (
    <div className="my-6 flex flex-col gap-2">
      {items.map((item, i) => (
        <div
          key={item.id || i}
          className="border border-gray-100 rounded-2xl overflow-hidden bg-gray-50/50"
        >
          <button
            onClick={() => setOpenIndex(openIndex === i ? null : i)}
            aria-expanded={openIndex === i}
            className="w-full flex items-center justify-between px-5 py-4 text-left cursor-pointer"
          >
            <span className="font-jakarta font-semibold text-[#0B3B4C] text-[15px] pr-4">
              {item.question}
            </span>
            <CaretDown
              size={18}
              weight="bold"
              className={cn(
                "text-brand-primary shrink-0 transition-transform duration-300",
                openIndex === i && "rotate-180",
              )}
            />
          </button>
          <AnimatePresence initial={false}>
            {openIndex === i && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.25, ease: "easeOut" }}
                className="overflow-hidden"
              >
                <div className="px-5 pb-5 font-montserrat text-[14px] text-gray-600 leading-relaxed border-t border-gray-100 pt-3">
                  {item.answer}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      ))}
    </div>
  );
}
