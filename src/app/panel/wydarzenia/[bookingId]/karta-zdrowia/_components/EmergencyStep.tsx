"use client";

import { PhoneCall, ShieldCheck } from "@phosphor-icons/react/dist/ssr";
import { SectionHeader, TextInput } from "./HealthFields";
import type { HealthData, SetField } from "./health-types";

interface Props {
  data: HealthData;
  setField: SetField;
}

export default function EmergencyStep({ data, setField }: Props) {
  return (
    <>
      <SectionHeader
        icon={<PhoneCall size={20} weight="duotone" />}
        title="Kogo zawiadomić?"
        subtitle="W razie jakiejkolwiek awarii, zadzwonimy pod wskazany numer."
      />

      <TextInput
        label="Imię i nazwisko bliskiej osoby"
        value={data.emergencyName}
        onChange={(v) => setField("emergencyName", v)}
        placeholder="Np. Anna Kowalska (Siostra)"
      />
      <TextInput
        label="Numer telefonu"
        value={data.emergencyPhone}
        onChange={(v) => setField("emergencyPhone", v)}
        placeholder="+48 000 000 000"
        type="tel"
      />

      {/* RODO / Oświadczenie */}
      <div className="mt-2 flex items-start gap-2.5 bg-brand-yellow/10 border border-brand-yellow/20 rounded-[18px] p-4 shrink-0">
        <ShieldCheck
          size={22}
          weight="duotone"
          className="text-brand-yellow shrink-0 mt-0.5"
        />
        <p className="text-[11.5px] font-medium leading-relaxed text-brand-secondary/70">
          Dane są <strong>ściśle poufne</strong>. Trafiają wyłącznie do
          organizatorów, by zapewnić Ci bezpieczeństwo. Zapisując, potwierdzasz
          ich zgodność z prawdą.
        </p>
      </div>
    </>
  );
}
