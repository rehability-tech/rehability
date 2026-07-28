"use client";

import { ForkKnife } from "@phosphor-icons/react/dist/ssr";
import { SectionHeader, Textarea } from "./HealthFields";
import {
  DIET_OPTIONS,
  INTOLERANCE_OPTIONS,
  type HealthData,
  type SetField,
} from "./health-types";
import { cn } from "@/lib/utils";

interface Props {
  data: HealthData;
  setField: SetField;
}

export default function DietStep({ data, setField }: Props) {
  const toggleIntolerance = (item: string) => {
    setField(
      "foodIntolerances",
      data.foodIntolerances.includes(item)
        ? data.foodIntolerances.filter((i) => i !== item)
        : [...data.foodIntolerances, item],
    );
  };

  return (
    <>
      <SectionHeader
        icon={<ForkKnife size={20} weight="duotone" />}
        title="Czym Cię nakarmimy?"
        subtitle="Zaznacz dietę i wykluczenia, byśmy mogli przygotować idealne posiłki."
      />

      <div className="mb-5 shrink-0">
        <label className="block text-[12.5px] font-bold text-brand-secondary/70 mb-2.5 ml-1">
          Preferowany rodzaj diety
        </label>
        <div className="grid grid-cols-2 gap-2">
          {DIET_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setField("dietType", opt.value)}
              className={cn(
                "relative overflow-hidden py-2.5 rounded-[14px] text-[12px] font-bold border-2 transition-all duration-300",
                data.dietType === opt.value
                  ? "bg-brand-primary text-white border-brand-primary/20 shadow-[0_4px_12px_-2px_rgba(40,125,136,0.3)]"
                  : "bg-white border-gray-100 text-brand-secondary/60 hover:border-brand-primary/30 hover:bg-brand-primary/5",
              )}
            >
              {data.dietType === opt.value && (
                <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-brand-yellow/30 rounded-full blur-md pointer-events-none" />
              )}
              <span className="relative z-10">{opt.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="mb-5 shrink-0">
        <label className="block text-[12.5px] font-bold text-brand-secondary/70 mb-2.5 ml-1">
          Nietolerancje pokarmowe
        </label>
        <div className="flex flex-wrap gap-2">
          {INTOLERANCE_OPTIONS.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => toggleIntolerance(item)}
              className={cn(
                "relative overflow-hidden px-3.5 py-2 rounded-full text-[12px] font-bold border-2 transition-all duration-300",
                data.foodIntolerances.includes(item)
                  ? "bg-brand-primary text-white border-brand-primary/20 shadow-sm"
                  : "bg-white text-brand-secondary/60 border-gray-100 hover:border-brand-primary/30 hover:bg-brand-primary/5",
              )}
            >
              {data.foodIntolerances.includes(item) && (
                <div className="absolute -bottom-2 -right-2 w-6 h-6 bg-brand-yellow/30 rounded-full blur-md pointer-events-none" />
              )}
              <span className="relative z-10">{item}</span>
            </button>
          ))}
        </div>
      </div>

      <Textarea
        label="Dodatkowe uwagi dietetyczne (opcjonalne)"
        value={data.foodNotes}
        onChange={(v) => setField("foodNotes", v)}
        placeholder="Np. alergia krzyżowa na seler..."
      />
    </>
  );
}
