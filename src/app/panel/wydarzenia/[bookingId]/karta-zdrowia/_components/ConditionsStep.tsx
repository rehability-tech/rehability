"use client";

import { FirstAid } from "@phosphor-icons/react/dist/ssr";
import { SectionHeader, Textarea } from "./HealthFields";
import type { HealthData, SetField } from "./health-types";

interface Props {
  data: HealthData;
  setField: SetField;
}

export default function ConditionsStep({ data, setField }: Props) {
  return (
    <>
      <SectionHeader
        icon={<FirstAid size={20} weight="duotone" />}
        title="Stan zdrowia"
        subtitle="Dopasujemy intensywność zajęć i przygotujemy się do szybkiej reakcji."
      />

      <Textarea
        label="Choroby przewlekłe"
        value={data.chronicConditions}
        onChange={(v) => setField("chronicConditions", v)}
        placeholder="Np. astma, nadciśnienie (jeśli brak - zostaw puste)"
      />
      <Textarea
        label="Przyjmowane leki stałe"
        value={data.medications}
        onChange={(v) => setField("medications", v)}
        placeholder="Nazwy leków i dawkowanie..."
      />
      <Textarea
        label="Kontuzje i ograniczenia ruchowe"
        value={data.injuries}
        onChange={(v) => setField("injuries", v)}
        placeholder="Np. stary uraz kolana..."
      />
      <Textarea
        label="Alergie (niezwiązane z jedzeniem)"
        value={data.allergies}
        onChange={(v) => setField("allergies", v)}
        placeholder="Np. jad osy, metale, leki..."
      />
    </>
  );
}
