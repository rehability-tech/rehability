"use client";

import { motion } from "framer-motion";
import { Eye, Users, Compass, Coins } from "@phosphor-icons/react/dist/ssr";
import { cn } from "@/lib/utils";

interface StatCardsProps {
  totalViews: number;
  soldSeats: number;
  totalSeats: number;
  revenuePln: number;
  activeCount: number;
}

export function StatCards({
  totalViews,
  soldSeats,
  totalSeats,
  revenuePln,
  activeCount,
}: StatCardsProps) {
  // Dane zdefiniowane w tablicy z przypisanymi łagodnymi akcentami
  const cards = [
    {
      label: "Aktywne wyjazdy",
      value: activeCount,
      Icon: Compass,
      colorClass: "bg-emerald-50 text-emerald-600 border-emerald-100",
    },
    {
      label: "Zajęte miejsca",
      value: `${soldSeats} / ${totalSeats}`,
      Icon: Users,
      colorClass: "bg-blue-50 text-blue-600 border-blue-100",
    },
    {
      label: "Odsłony oferty",
      value: totalViews.toLocaleString("pl-PL"),
      Icon: Eye,
      colorClass: "bg-purple-50 text-purple-600 border-purple-100",
    },
    {
      label: "Przychód (Wpłaty)",
      value: `${revenuePln.toLocaleString("pl-PL")} zł`,
      Icon: Coins,
      colorClass: "bg-amber-50 text-amber-600 border-amber-100",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
      {cards.map((card, idx) => (
        <motion.div
          key={card.label}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: idx * 0.05, ease: "easeOut" }}
          className={cn(
            "bg-white rounded-[16px] p-5 border border-gray-200/80",
            "shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-0.5",
            "flex items-center gap-4 cursor-default",
          )}
        >
          {/* Ikonka w zaokrąglonym kwadracie */}
          <div
            className={cn(
              "w-12 h-12 rounded-[12px] border flex items-center justify-center shrink-0",
              card.colorClass,
            )}
          >
            <card.Icon size={24} weight="duotone" />
          </div>

          {/* Teksty */}
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 truncate">
              {card.label}
            </p>
            {/* Dopasowany kolor do całej reszty aplikacji (#0B3B4C) */}
            <p className="text-[22px] font-jakarta font-bold text-[#0B3B4C] leading-none truncate">
              {card.value}
            </p>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
