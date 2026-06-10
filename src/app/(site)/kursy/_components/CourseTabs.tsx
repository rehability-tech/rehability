"use client";

import { useState } from "react";
import {
  COURSE_BENEFITS,
  type Course,
  type CourseBlock,
} from "../_data/courses";

const TABS = ["O kursie", "Zawartość", "Opinie", "FAQ"] as const;
type Tab = (typeof TABS)[number];

// Render prostego **pogrubienia** w obrębie tekstu.
function renderRich(text: string) {
  return text.split(/(\*\*[^*]+\*\*)/g).map((part, i) =>
    part.startsWith("**") && part.endsWith("**") ? (
      <strong key={i} className="font-bold">
        {part.slice(2, -2)}
      </strong>
    ) : (
      <span key={i}>{part}</span>
    ),
  );
}

function Block({ block }: { block: CourseBlock }) {
  if (block.type === "heading") {
    return (
      <h3 className="font-montserrat font-medium text-[20px] text-brand-secondary mt-4">
        {block.text}
      </h3>
    );
  }
  if (block.type === "list") {
    return (
      <ul className="list-disc ps-6 space-y-2">
        {block.items.map((item, i) => (
          <li key={i} className="text-[16px] leading-[1.7] text-brand-secondary">
            {renderRich(item)}
          </li>
        ))}
      </ul>
    );
  }
  return (
    <p className="text-[16px] leading-[1.7] text-brand-secondary font-light">
      {renderRich(block.text)}
    </p>
  );
}

function AboutTab({ course }: { course: Course }) {
  const blocks: CourseBlock[] = course.description ?? [
    { type: "paragraph", text: course.excerpt },
    { type: "heading", text: "Co otrzymujesz, dołączając do kursu?" },
    { type: "list", items: COURSE_BENEFITS },
  ];

  return (
    <div className="flex flex-col gap-5">
      <h2 className="font-montserrat font-semibold text-[24px] tracking-[0.24px] text-brand-secondary">
        Opis
      </h2>
      <div className="flex flex-col gap-4">
        {blocks.map((block, i) => (
          <Block key={i} block={block} />
        ))}
      </div>
    </div>
  );
}

function Placeholder({ label }: { label: string }) {
  return (
    <p className="font-montserrat text-brand-secondary/60 py-10">
      Sekcja „{label}" pojawi się tutaj wkrótce.
    </p>
  );
}

export function CourseTabs({ course }: { course: Course }) {
  const [active, setActive] = useState<Tab>("O kursie");

  return (
    <div className="flex flex-col gap-8 w-full">
      {/* Zakładki */}
      <div className="flex items-center border-b border-brand-primary/20 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {TABS.map((tab) => {
          const isActive = tab === active;
          return (
            <button
              key={tab}
              type="button"
              onClick={() => setActive(tab)}
              className={`h-[50px] px-4 shrink-0 font-montserrat font-medium text-[16px] transition-colors ${
                isActive
                  ? "text-brand-secondary border-b-2 border-brand-primary"
                  : "text-brand-secondary/60 hover:text-brand-secondary"
              }`}
            >
              {tab}
            </button>
          );
        })}
      </div>

      {/* Treść */}
      <div className="px-1 md:px-6">
        {active === "O kursie" ? (
          <AboutTab course={course} />
        ) : (
          <Placeholder label={active} />
        )}
      </div>
    </div>
  );
}
