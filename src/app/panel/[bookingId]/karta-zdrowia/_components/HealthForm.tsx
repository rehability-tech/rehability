"use client";

import React, { useState } from "react";
import { toast } from "sonner";
import { motion } from "framer-motion";
import {
  CircleNotch,
  CheckCircle,
  Fork,
  FirstAid,
  PhoneCall,
  Warning,
} from "@phosphor-icons/react/dist/ssr";

interface HealthData {
  dietType: string;
  foodIntolerances: string[];
  foodNotes: string;
  chronicConditions: string;
  medications: string;
  injuries: string;
  allergies: string;
  emergencyName: string;
  emergencyPhone: string;
}

const DIET_OPTIONS = [
  { value: "OMNIVORE", label: "Wszystkożerna" },
  { value: "VEGETARIAN", label: "Wegetariańska" },
  { value: "VEGAN", label: "Wegańska" },
  { value: "OTHER", label: "Inna" },
];

const INTOLERANCE_OPTIONS = [
  "Gluten",
  "Laktoza",
  "Orzechy",
  "Jaja",
  "Ryby",
  "Owoce morza",
  "Soja",
];

const EMPTY: HealthData = {
  dietType: "",
  foodIntolerances: [],
  foodNotes: "",
  chronicConditions: "",
  medications: "",
  injuries: "",
  allergies: "",
  emergencyName: "",
  emergencyPhone: "",
};

function SectionHeader({
  icon,
  title,
}: {
  icon: React.ReactNode;
  title: string;
}) {
  return (
    <div className="flex items-center gap-2 mb-4">
      <span className="text-[#287D88]">{icon}</span>
      <h2 className="font-jakarta font-bold text-base text-[#0B3B4C]">
        {title}
      </h2>
    </div>
  );
}

function Textarea({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div className="mb-4">
      <label className="block text-sm font-semibold text-gray-600 mb-1.5">
        {label}
      </label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={3}
        className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2.5 text-sm text-[#0B3B4C] placeholder-gray-400 focus:outline-none focus:border-[#287D88] focus:bg-white transition-colors resize-none"
      />
    </div>
  );
}

function TextInput({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <div className="mb-4">
      <label className="block text-sm font-semibold text-gray-600 mb-1.5">
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2.5 text-sm text-[#0B3B4C] placeholder-gray-400 focus:outline-none focus:border-[#287D88] focus:bg-white transition-colors"
      />
    </div>
  );
}

export default function HealthForm({
  initial,
}: {
  initial: HealthData | null;
}) {
  const [data, setData] = useState<HealthData>(initial ?? EMPTY);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const set = <K extends keyof HealthData>(key: K, value: HealthData[K]) => {
    setSaved(false);
    setData((prev) => ({ ...prev, [key]: value }));
  };

  const toggleIntolerance = (item: string) => {
    set(
      "foodIntolerances",
      data.foodIntolerances.includes(item)
        ? data.foodIntolerances.filter((i) => i !== item)
        : [...data.foodIntolerances, item]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/panel/health-profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Błąd zapisu");
      setSaved(true);
      toast.success("Karta zdrowia zapisana");
    } catch {
      toast.error("Nie udało się zapisać danych");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5 pb-8">
      {/* Dieta */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-3xl border border-gray-100 shadow-sm p-5"
      >
        <SectionHeader
          icon={<Fork size={18} weight="duotone" />}
          title="Dieta i żywienie"
        />

        <div className="mb-4">
          <label className="block text-sm font-semibold text-gray-600 mb-2">
            Rodzaj diety
          </label>
          <div className="grid grid-cols-2 gap-2">
            {DIET_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => set("dietType", opt.value)}
                className={`py-2.5 rounded-xl text-sm font-semibold border transition-all ${
                  data.dietType === opt.value
                    ? "bg-[#0B3B4C] text-white border-[#0B3B4C]"
                    : "bg-gray-50 text-gray-600 border-gray-200 hover:border-[#287D88]"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-semibold text-gray-600 mb-2">
            Nietolerancje pokarmowe
          </label>
          <div className="flex flex-wrap gap-2">
            {INTOLERANCE_OPTIONS.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => toggleIntolerance(item)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                  data.foodIntolerances.includes(item)
                    ? "bg-[#287D88] text-white border-[#287D88]"
                    : "bg-gray-50 text-gray-500 border-gray-200"
                }`}
              >
                {item}
              </button>
            ))}
          </div>
        </div>

        <Textarea
          label="Dodatkowe uwagi dietetyczne"
          value={data.foodNotes}
          onChange={(v) => set("foodNotes", v)}
          placeholder="Np. dieta bezglutenowa, uczulenie na..."
        />
      </motion.div>

      {/* Zdrowie */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white rounded-3xl border border-gray-100 shadow-sm p-5"
      >
        <SectionHeader
          icon={<FirstAid size={18} weight="duotone" />}
          title="Stan zdrowia"
        />

        <Textarea
          label="Choroby przewlekłe"
          value={data.chronicConditions}
          onChange={(v) => set("chronicConditions", v)}
          placeholder="Np. cukrzyca, nadciśnienie, astma..."
        />
        <Textarea
          label="Przyjmowane leki"
          value={data.medications}
          onChange={(v) => set("medications", v)}
          placeholder="Nazwy leków i dawkowanie..."
        />
        <Textarea
          label="Kontuzje i ograniczenia ruchowe"
          value={data.injuries}
          onChange={(v) => set("injuries", v)}
          placeholder="Np. ból kręgosłupa, po operacji kolana..."
        />
        <Textarea
          label="Alergie (inne niż pokarmowe)"
          value={data.allergies}
          onChange={(v) => set("allergies", v)}
          placeholder="Np. alergia na kosmetyki, metale, leki..."
        />
      </motion.div>

      {/* Kontakt awaryjny */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white rounded-3xl border border-gray-100 shadow-sm p-5"
      >
        <SectionHeader
          icon={<PhoneCall size={18} weight="duotone" />}
          title="Kontakt awaryjny"
        />

        <TextInput
          label="Imię i nazwisko osoby kontaktowej"
          value={data.emergencyName}
          onChange={(v) => set("emergencyName", v)}
          placeholder="Np. Jan Kowalski"
        />
        <TextInput
          label="Numer telefonu"
          value={data.emergencyPhone}
          onChange={(v) => set("emergencyPhone", v)}
          placeholder="+48 000 000 000"
          type="tel"
        />
      </motion.div>

      {/* Zastrzeżenie RODO */}
      <div className="flex gap-2.5 bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3">
        <Warning size={16} className="text-amber-500 shrink-0 mt-0.5" />
        <p className="text-xs text-amber-700">
          Dane zdrowotne są przetwarzane wyłącznie w celu zapewnienia Ci
          bezpieczeństwa podczas wyjazdu i nie są udostępniane osobom trzecim.
        </p>
      </div>

      <motion.button
        type="submit"
        disabled={saving}
        whileTap={{ scale: 0.98 }}
        className="w-full flex items-center justify-center gap-2 bg-[#0B3B4C] text-white font-bold py-4 rounded-2xl shadow-md hover:bg-[#0d4a5f] transition-colors disabled:opacity-60"
      >
        {saving ? (
          <CircleNotch size={18} className="animate-spin" />
        ) : saved ? (
          <CheckCircle size={18} weight="fill" />
        ) : null}
        {saving ? "Zapisuję..." : saved ? "Zapisano!" : "Zapisz kartę zdrowia"}
      </motion.button>
    </form>
  );
}
