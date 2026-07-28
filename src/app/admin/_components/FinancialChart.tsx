"use client";

import React, { useState, useRef, useEffect } from "react";
import useSWR from "swr";
import { motion, AnimatePresence } from "framer-motion";
import {
  DotsThreeOutline,
  CalendarBlank,
  Stack,
  ChartLineDown, // Nowa ikona dla pustego stanu
} from "@phosphor-icons/react/dist/ssr";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

// Prosty fetcher dla SWR
const fetcher = (url: string) => fetch(url).then((res) => res.json());

// Komponent loadera
const ChartSkeleton = () => (
  <div className="w-full h-[320px] mt-6 bg-gray-50/50 rounded-2xl animate-pulse flex items-center justify-center text-gray-300 font-medium text-sm">
    Ładowanie statystyk...
  </div>
);

// Pusty stan, gdy nie ma żadnych przychodów
const EmptyState = () => (
  <div className="w-full h-[320px] mt-6 flex flex-col items-center justify-center text-brand-secondary/40">
    <ChartLineDown size={48} weight="duotone" className="mb-3 opacity-50" />
    <p className="font-jakarta font-bold text-[14px]">
      Brak danych finansowych
    </p>
    <p className="font-montserrat text-[12px] mt-1 text-center max-w-xs">
      Wygląda na to, że w wybranym okresie nie odnotowano jeszcze żadnych
      płatności.
    </p>
  </div>
);

// Własny Tooltip
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white/95 backdrop-blur-xl border border-white/60 shadow-[0_10px_24px_-8px_rgba(3,63,99,0.15)] rounded-2xl p-4 min-w-[150px]">
        <p className="font-jakarta font-bold text-[#0B3B4C] mb-3 text-[14px] border-b border-gray-100 pb-2">
          {label}
        </p>
        <div className="flex flex-col gap-2 font-montserrat text-[13px] font-semibold">
          {payload.map((entry: any, index: number) => (
            <div
              key={`item-${index}`}
              className="flex items-center justify-between gap-4"
              style={{ color: entry.color }}
            >
              <span className="font-medium opacity-80">{entry.name}:</span>
              <span>{entry.value.toLocaleString()} zł</span>
            </div>
          ))}
        </div>
      </div>
    );
  }
  return null;
};

export default function FinancialChart() {
  const [range, setRange] = useState<"month" | "six_months" | "year">(
    "six_months",
  );
  const [activePillar, setActivePillar] = useState<"ALL" | "CAMP" | "VOD">(
    "ALL",
  );
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Pobieranie danych SWR
  const { data, error, isLoading } = useSWR(
    `/api/admin/financials?range=${range}`,
    fetcher,
    { revalidateOnFocus: false },
  );

  // Zamykanie menu po kliknięciu na zewnątrz
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Sprawdzamy czy wykres ma w ogóle jakieś kwoty, czy to same 0.
  // Dzięki temu możemy pokazać EmptyState zamiast płaskiej linii na samym dole.
  const hasAnyData = data && data.some((d: any) => d.campy > 0 || d.vod > 0);

  return (
    <div className="w-full flex flex-col relative" ref={menuRef}>
      {/* ─── NAGŁÓWEK WIDGETU ─── */}
      <div className="flex justify-between items-start border-b border-gray-50 pb-5">
        <div>
          <h2 className="font-jakarta font-bold text-brand-secondary text-[18px] md:text-[20px]">
            Przychody systemu
          </h2>
          <div className="flex items-center gap-2 font-montserrat text-[12px] text-brand-secondary/50 font-medium mt-1">
            <span>
              {range === "month"
                ? "Ten miesiąc"
                : range === "six_months"
                  ? "Ostatnie 6 miesięcy"
                  : "Ten rok"}
            </span>
            <span className="w-1 h-1 rounded-full bg-gray-300" />

            {/* PRZYWRÓCONA LEGENDA / AGENDA KOLORÓW */}
            <div className="flex items-center gap-3">
              {(activePillar === "ALL" || activePillar === "CAMP") && (
                <div className="flex items-center gap-1.5 font-bold text-brand-primary">
                  <span className="w-2 h-2 rounded-full bg-brand-primary" />
                  Wydarzenia
                </div>
              )}
              {(activePillar === "ALL" || activePillar === "VOD") && (
                <div className="flex items-center gap-1.5 font-bold text-brand-yellow">
                  <span className="w-2 h-2 rounded-full bg-brand-yellow" />
                  VOD
                </div>
              )}
            </div>
          </div>
        </div>

        {/* --- MENU OPCJI --- */}
        <div className="relative">
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className={`w-9 h-9 rounded-full flex items-center justify-center transition-colors ${
              isMenuOpen
                ? "bg-gray-100 text-brand-secondary"
                : "bg-white border border-gray-100 text-brand-secondary/40 hover:bg-gray-50 hover:text-brand-primary"
            }`}
          >
            <DotsThreeOutline size={18} weight="fill" />
          </button>

          {/* Rozwijany Panel Filtrowania */}
          <AnimatePresence>
            {isMenuOpen && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 top-12 w-[240px] rounded-2xl bg-white border border-gray-100 shadow-[0_20px_50px_-10px_rgba(3,63,99,0.15)] z-50 p-4 font-montserrat flex flex-col gap-4"
              >
                {/* Filtry Czasu */}
                <div className="flex flex-col gap-2">
                  <span className="flex items-center gap-2 text-[10px] font-bold text-brand-secondary/40 uppercase tracking-wider mb-1">
                    <CalendarBlank size={14} /> Okres
                  </span>
                  <div className="grid grid-cols-3 gap-1 bg-gray-100 p-1 rounded-xl text-[11px] font-bold">
                    {(["month", "six_months", "year"] as const).map((r) => (
                      <button
                        key={r}
                        onClick={() => {
                          setRange(r);
                          setIsMenuOpen(false);
                        }}
                        className={`py-1.5 rounded-lg transition-all ${
                          range === r
                            ? "bg-white text-brand-secondary shadow-sm"
                            : "text-brand-secondary/50 hover:text-brand-secondary"
                        }`}
                      >
                        {r === "month"
                          ? "1m"
                          : r === "six_months"
                            ? "6m"
                            : "1y"}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Filtry Produktu */}
                <div className="flex flex-col gap-2">
                  <span className="flex items-center gap-2 text-[10px] font-bold text-brand-secondary/40 uppercase tracking-wider mb-1">
                    <Stack size={14} /> Produkt
                  </span>
                  <div className="flex flex-col gap-1">
                    {(["ALL", "CAMP", "VOD"] as const).map((type) => (
                      <button
                        key={type}
                        onClick={() => {
                          setActivePillar(type);
                          setIsMenuOpen(false);
                        }}
                        className={`flex justify-between items-center px-3 py-2 rounded-xl transition-all text-[12px] font-bold ${
                          activePillar === type
                            ? "bg-brand-primary/10 text-brand-primary"
                            : "bg-transparent text-brand-secondary/60 hover:bg-gray-50 hover:text-brand-secondary"
                        }`}
                      >
                        {type === "ALL"
                          ? "Wszystkie systemy"
                          : type === "CAMP"
                            ? "Tylko Wydarzenia"
                            : "Platforma VOD"}
                        {activePillar === type && (
                          <div className="w-1.5 h-1.5 rounded-full bg-brand-primary" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* --- WYKRES --- */}
      {isLoading && <ChartSkeleton />}
      {error && (
        <div className="w-full h-[320px] mt-6 flex items-center justify-center text-rose-500 font-semibold text-sm">
          Nie udało się pobrać danych finansowych.
        </div>
      )}

      {/* Wyświetlanie wykresu (Tylko jeśli są prawdziwe dane, > 0) */}
      {!isLoading && !error && data && hasAnyData && (
        <div className="w-full h-[320px] mt-6">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={data}
              margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
            >
              <defs>
                <linearGradient id="colorCampy" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#287D88" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#287D88" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorVod" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#F2D967" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#F2D967" stopOpacity={0} />
                </linearGradient>
              </defs>

              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke="rgba(3,63,99,0.05)"
              />

              <XAxis
                dataKey="name"
                axisLine={false}
                tickLine={false}
                tick={{
                  fill: "rgba(3,63,99,0.4)",
                  fontSize: 11,
                  fontFamily: "Montserrat",
                  fontWeight: 600,
                }}
                dy={10}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{
                  fill: "rgba(3,63,99,0.4)",
                  fontSize: 11,
                  fontFamily: "Montserrat",
                  fontWeight: 600,
                }}
                tickFormatter={(value) =>
                  value >= 1000 ? `${value / 1000}k` : value
                }
              />

              <Tooltip
                content={<CustomTooltip />}
                cursor={{ fill: "transparent", stroke: "transparent" }}
              />

              {(activePillar === "ALL" || activePillar === "CAMP") && (
                <Area
                  type="monotone"
                  dataKey="campy"
                  name="Wydarzenia"
                  stroke="#287D88"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#colorCampy)"
                  activeDot={{
                    r: 6,
                    fill: "#287D88",
                    stroke: "#fff",
                    strokeWidth: 2,
                  }}
                />
              )}
              {(activePillar === "ALL" || activePillar === "VOD") && (
                <Area
                  type="monotone"
                  dataKey="vod"
                  name="Platforma VOD"
                  stroke="#F2D967"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#colorVod)"
                  activeDot={{
                    r: 6,
                    fill: "#F2D967",
                    stroke: "#fff",
                    strokeWidth: 2,
                  }}
                />
              )}
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Pusty Stan (Jeśli API wróciło, ale wszystkie kwoty wynoszą 0) */}
      {!isLoading && !error && data && !hasAnyData && <EmptyState />}
    </div>
  );
}
