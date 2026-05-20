"use client";

import React from "react";
import { ArrowRight } from "@phosphor-icons/react/dist/ssr";
import { motion } from "framer-motion";

export default function SingleCampForm() {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    alert("Formularz wysłany!");
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="max-w-[700px] mx-auto bg-white rounded-[32px] p-8 md:p-14 shadow-[0_10px_40px_rgba(0,0,0,0.03)] border border-gray-100/50 flex flex-col gap-8"
    >
      <div className="text-center">
        <h3 className="font-jakarta font-bold text-[32px] text-[#0B3B4C] mb-2">
          Zarezerwuj <span className="text-[#659F9F] font-medium">miejsce</span>
        </h3>
        <p className="font-montserrat text-[14px] leading-[1.8] text-[#64748B] font-light">
          Wypełnij formularz, aby zgłosić chęć udziału. Skontaktujemy się z
          Tobą!
        </p>
      </div>

      <form className="flex flex-col gap-5 mt-4" onSubmit={handleSubmit}>
        <div className="flex flex-col gap-1.5">
          <label className="text-[12px] font-semibold text-[#0B3B4C] ml-1 uppercase tracking-wide">
            Imię i Nazwisko *
          </label>
          <input
            type="text"
            required
            className="w-full px-5 py-4 rounded-xl border border-gray-200 bg-[#F8FAFC] focus:outline-none focus:border-[#659F9F] transition-colors text-[14px] text-[#0B3B4C]"
            placeholder="Anna Kowalska"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-[12px] font-semibold text-[#0B3B4C] ml-1 uppercase tracking-wide">
            Adres e-mail *
          </label>
          <input
            type="email"
            required
            className="w-full px-5 py-4 rounded-xl border border-gray-200 bg-[#F8FAFC] focus:outline-none focus:border-[#659F9F] transition-colors text-[14px] text-[#0B3B4C]"
            placeholder="twoj@email.com"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-[12px] font-semibold text-[#0B3B4C] ml-1 uppercase tracking-wide">
            Numer telefonu *
          </label>
          <input
            type="tel"
            required
            className="w-full px-5 py-4 rounded-xl border border-gray-200 bg-[#F8FAFC] focus:outline-none focus:border-[#659F9F] transition-colors text-[14px] text-[#0B3B4C]"
            placeholder="+48 000 000 000"
          />
        </div>

        <div className="flex flex-col items-center gap-3 mt-8">
          <button className="flex items-center gap-3 bg-[#0B3B4C] text-white px-10 py-4 rounded-full font-montserrat font-bold text-[15px] hover:bg-[#1a4a5c] transition-colors w-full md:w-auto justify-center group shadow-md hover:shadow-lg">
            Wyślij zgłoszenie
            <ArrowRight
              size={18}
              weight="bold"
              className="group-hover:translate-x-1 transition-transform"
            />
          </button>
        </div>

        <div className="bg-[#F1F5F9] rounded-xl p-6 mt-6 border border-gray-200/60 text-center">
          <h5 className="font-jakarta font-bold text-[14px] text-[#0B3B4C] mb-2">
            Ważne informacje o płatności
          </h5>
          <p className="font-montserrat text-[12px] text-[#64748B] leading-[1.7]">
            Zadatek w wysokości <strong>1000 zł</strong> płatny do 30.04.2026 r.
            <br />
            Dane do przelewu: <strong>38 1090 2226 0000 0001 5493 5537</strong>.
            <br />
            Zadatek jest bezzwrotny. Wystawiamy faktury na życzenie.
          </p>
        </div>
      </form>
    </motion.div>
  );
}
