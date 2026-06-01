"use client";

import {
  CheckCircle,
  ForkKnife,
  FirstAid,
  PhoneCall,
  PencilSimple,
} from "@phosphor-icons/react/dist/ssr";
import { SummaryItem } from "./HealthFields";
import { DIET_OPTIONS, type HealthData } from "./health-types";

interface Props {
  data: HealthData;
  onEdit: () => void;
}

export default function HealthSummary({ data, onEdit }: Props) {
  const dietLabel =
    DIET_OPTIONS.find((o) => o.value === data.dietType)?.label ||
    "Nie określono";

  return (
    <div className="flex flex-col w-full px-1">
      <div className="mb-8">
        <div className="flex items-center justify-between border-b border-brand-primary/10 pb-5 mb-5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-[16px] bg-brand-primary/10 text-brand-primary flex items-center justify-center">
              <CheckCircle size={24} weight="fill" />
            </div>
            <div>
              <h2 className="font-jakarta font-bold text-xl text-brand-secondary">
                Wszystko gotowe
              </h2>
              <p className="text-[13px] text-brand-secondary/60">
                Twoja Karta Zdrowia jest uzupełniona.
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
          <div>
            <h3 className="flex items-center gap-2 font-bold text-[14px] text-brand-secondary mb-3">
              <ForkKnife size={18} className="text-brand-primary" /> Dieta
            </h3>
            <SummaryItem label="Rodzaj diety" value={dietLabel} />
            <SummaryItem
              label="Nietolerancje"
              value={
                data.foodIntolerances.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {data.foodIntolerances.map((i) => (
                      <span
                        key={i}
                        className="px-2 py-1 bg-brand-primary/10 text-brand-primary rounded-lg text-[11px] font-bold"
                      >
                        {i}
                      </span>
                    ))}
                  </div>
                ) : (
                  "Brak zgłoszeń"
                )
              }
            />
            <SummaryItem label="Dodatkowe uwagi" value={data.foodNotes} />
          </div>

          <div>
            <h3 className="flex items-center gap-2 font-bold text-[14px] text-brand-secondary mb-3">
              <FirstAid size={18} className="text-brand-primary" /> Zdrowie
            </h3>
            <SummaryItem
              label="Choroby przewlekłe"
              value={data.chronicConditions || "Brak zgłoszeń"}
            />
            <SummaryItem
              label="Leki stałe"
              value={data.medications || "Brak zgłoszeń"}
            />
            <SummaryItem
              label="Kontuzje"
              value={data.injuries || "Brak zgłoszeń"}
            />
            <SummaryItem
              label="Alergie"
              value={data.allergies || "Brak zgłoszeń"}
            />
          </div>

          <div className="md:col-span-2 mt-2 pt-5 border-t border-brand-primary/10">
            <h3 className="flex items-center gap-2 font-bold text-[14px] text-brand-secondary mb-3">
              <PhoneCall size={18} className="text-brand-primary" /> Kontakt
              awaryjny
            </h3>
            <div className="flex flex-col sm:flex-row gap-4 sm:gap-12">
              <SummaryItem
                label="Osoba kontaktowa"
                value={data.emergencyName}
              />
              <SummaryItem
                label="Numer telefonu"
                value={data.emergencyPhone}
              />
            </div>
          </div>
        </div>
      </div>

      <button
        onClick={onEdit}
        className="flex items-center justify-center gap-2 w-full sm:w-auto sm:self-start bg-white border border-gray-200 text-brand-secondary font-bold px-6 h-12 rounded-[16px] shadow-sm hover:bg-gray-50 transition-all"
      >
        <PencilSimple size={18} weight="bold" />
        Edytuj dane
      </button>
    </div>
  );
}
