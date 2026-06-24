"use client";

import { useState } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import {
  Clock,
  ArrowRight,
  FlowerLotus,
  Info,
  X,
  Timer,
  CurrencyCircleDollar,
  CalendarCheck,
  CheckCircle,
} from "@phosphor-icons/react/dist/ssr";
import { cn } from "@/lib/utils";
import Portal from "@/components/ui/Portal";
import type { Service } from "./types";

export function ServiceCard({
  service,
  totalFreeBlocks,
  onReserve,
  isPurchased = false,
}: {
  service: Service;
  totalFreeBlocks: number;
  onReserve: () => void;
  isPurchased?: boolean;
}) {
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const noFree = totalFreeBlocks === 0;

  const handleReserveFromDetails = () => {
    setIsDetailsOpen(false);
    onReserve();
  };

  return (
    <>
      <div className="group relative flex flex-col h-full p-2 sm:p-2.5 rounded-[32px] overflow-hidden transition-all duration-700 ease-out hover:shadow-[0_24px_50px_-15px_rgba(40,125,136,0.25)] hover:-translate-y-1 border border-white/60 bg-white/40 shadow-sm">
        {/* Badge "Wykupione" w prawym górnym rogu */}
        {isPurchased && (
          <div className="absolute top-6 right-6 z-30 bg-emerald-500/90 backdrop-blur-md text-white text-[10px] uppercase tracking-widest font-bold px-3 py-1.5 rounded-xl shadow-lg border border-emerald-400 flex items-center gap-1.5">
            <CheckCircle size={14} weight="bold" />
            Wykupione
          </div>
        )}

        <div className="absolute -top-10 -right-10 w-48 h-48 bg-brand-primary/20 rounded-full blur-[40px] pointer-events-none z-0 transition-transform duration-1000 ease-out group-hover:scale-125 group-hover:bg-brand-primary/30 group-hover:translate-x-4" />
        <div className="absolute -bottom-10 -left-10 w-48 h-48 bg-brand-yellow/20 rounded-full blur-[40px] pointer-events-none z-0 transition-transform duration-1000 ease-out group-hover:scale-125 group-hover:bg-brand-yellow/30 group-hover:-translate-y-4" />

        <div
          className="relative w-full h-[220px] sm:h-[240px] bg-white/50 backdrop-blur-sm rounded-[24px] overflow-hidden shrink-0 z-10 shadow-[0_4px_20px_rgba(0,0,0,0.05)] border border-white/50 cursor-pointer"
          onClick={() => setIsDetailsOpen(true)}
        >
          {service.image ? (
            <Image
              src={service.image}
              alt={`Zabieg: ${service.name}`}
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              className="object-cover transition-transform duration-1000 group-hover:scale-105"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <FlowerLotus
                size={56}
                weight="thin"
                className="text-brand-primary/30"
              />
            </div>
          )}
        </div>

        <div className="relative z-20 flex-1 flex flex-col mx-2 sm:mx-3 -mt-12 p-4 sm:p-5 rounded-[24px] overflow-hidden">
          <div className="absolute inset-0 bg-white/65 backdrop-blur-xl border border-white shadow-[0_8px_32px_rgba(3,63,99,0.06)] rounded-[24px] -z-10 transition-colors duration-500 group-hover:bg-white/75" />

          <div className="flex justify-between items-center mb-3">
            <div className="flex items-center gap-1 text-brand-primary font-bold text-[10px] uppercase tracking-widest bg-white/80 shadow-sm border border-white px-2.5 py-1 rounded-lg backdrop-blur-md">
              <Clock size={12} weight="bold" />
              <span>{service.duration} min</span>
            </div>
            <div className="font-jakarta font-bold text-brand-secondary text-[15px] sm:text-[16px] bg-white/60 px-2.5 py-1 rounded-lg border border-white shadow-sm backdrop-blur-md">
              {service.price.toFixed(0)} zł
            </div>
          </div>

          <div className="flex-1">
            <h3 className="font-jakarta font-bold text-brand-secondary text-[17px] sm:text-[19px] leading-tight mb-2 drop-shadow-sm">
              {service.name}
            </h3>
            {service.description && (
              <p className="text-[12px] sm:text-[13px] font-medium text-brand-secondary/70 leading-relaxed mb-4 line-clamp-2">
                {service.description}
              </p>
            )}
          </div>

          <div className="flex items-center gap-2 mt-auto">
            <button
              onClick={() => setIsDetailsOpen(true)}
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl font-bold text-[13px] bg-white/50 border border-white/60 text-brand-secondary hover:bg-white/90 hover:text-brand-primary transition-all backdrop-blur-md shadow-sm"
            >
              <Info size={16} weight="duotone" />
              Szczegóły
            </button>

            <button
              onClick={onReserve}
              disabled={noFree}
              className={cn(
                "group/btn relative flex-[1.2] flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl font-bold text-[13px] transition-all duration-300 backdrop-blur-md overflow-hidden",
                noFree
                  ? "bg-white/80 text-gray-400 cursor-not-allowed border border-white/50"
                  : "bg-brand-primary/95 text-white hover:bg-brand-primary border border-brand-primary/20 shadow-[6px_8px_16px_-4px_rgba(40,125,136,0.4)] hover:shadow-[8px_10px_20px_-4px_rgba(40,125,136,0.5)]",
              )}
            >
              {noFree ? (
                "Brak miejsc"
              ) : (
                <>
                  <div className="absolute -bottom-4 -right-4 w-12 h-12 bg-brand-yellow/40 blur-[10px] rounded-full group-hover/btn:bg-brand-yellow/60 transition-all duration-500 pointer-events-none" />
                  <span className="relative z-10">Rezerwuj</span>
                  <ArrowRight
                    size={14}
                    weight="bold"
                    className="relative z-10 text-white ml-0.5 transition-transform duration-300 group-hover/btn:translate-x-0.5"
                  />
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      <Portal>
      <AnimatePresence>
        {isDetailsOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsDetailsOpen(false)}
              className="fixed inset-0 z-[250] bg-brand-secondary/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="fixed inset-0 z-[251] flex items-center justify-center p-4 pointer-events-none"
            >
              <div className="relative w-full max-w-lg bg-white/95 backdrop-blur-2xl border border-white/80 rounded-[32px] shadow-2xl pointer-events-auto overflow-hidden flex flex-col max-h-[90vh]">
                <div className="relative w-full h-48 sm:h-56 shrink-0 bg-brand-primary/5">
                  {service.image ? (
                    <Image
                      src={service.image}
                      alt={service.name}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <FlowerLotus
                        size={48}
                        weight="thin"
                        className="text-brand-primary/30"
                      />
                    </div>
                  )}
                  <button
                    onClick={() => setIsDetailsOpen(false)}
                    className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center text-white hover:bg-white/40 transition-colors shadow-lg z-10"
                  >
                    <X size={18} weight="bold" />
                  </button>
                  <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-white to-transparent" />
                </div>

                <div className="flex-1 overflow-y-auto px-6 pb-6 pt-2 custom-scrollbar">
                  <h2 className="font-jakarta text-[22px] sm:text-[24px] font-bold text-brand-secondary leading-tight mb-4">
                    {service.name}
                  </h2>

                  <div className="flex flex-wrap items-center gap-3 mb-6">
                    <span className="inline-flex items-center gap-1.5 text-[13px] font-bold text-brand-secondary/80 bg-gray-50 px-3 py-1.5 rounded-xl border border-gray-100">
                      <Timer
                        size={16}
                        weight="duotone"
                        className="text-brand-primary"
                      />
                      {service.duration} min
                    </span>
                    <span className="inline-flex items-center gap-1.5 text-[13px] font-bold text-brand-secondary/80 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-100/50">
                      <CurrencyCircleDollar
                        size={16}
                        weight="duotone"
                        className="text-emerald-600"
                      />
                      {service.price.toFixed(0)} zł
                    </span>
                  </div>

                  {service.description ? (
                    <p className="text-[14.5px] font-medium text-brand-secondary/70 leading-relaxed">
                      {service.description}
                    </p>
                  ) : (
                    <p className="text-[14px] italic text-gray-400">
                      Brak opisu dla tej usługi.
                    </p>
                  )}
                </div>

                <div className="p-4 sm:p-6 bg-gray-50/50 border-t border-gray-100 shrink-0">
                  <button
                    onClick={handleReserveFromDetails}
                    disabled={noFree}
                    className={cn(
                      "group/btn relative w-full flex items-center justify-center gap-2 py-4 px-6 rounded-2xl font-bold text-[15px] transition-all duration-300 overflow-hidden",
                      noFree
                        ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                        : "bg-brand-primary/95 text-white hover:bg-brand-primary border border-brand-primary/20 shadow-[6px_8px_16px_-4px_rgba(40,125,136,0.4)] hover:shadow-[8px_10px_20px_-4px_rgba(40,125,136,0.5)]",
                    )}
                  >
                    {noFree ? (
                      "Brak wolnych miejsc"
                    ) : (
                      <>
                        <div className="absolute -bottom-6 -right-6 w-16 h-16 bg-brand-yellow/40 blur-[12px] rounded-full group-hover/btn:bg-brand-yellow/60 transition-all duration-500 pointer-events-none" />
                        <CalendarCheck
                          size={20}
                          weight="bold"
                          className="relative z-10 text-white"
                        />
                        <span className="relative z-10">
                          Zarezerwuj ten zabieg
                        </span>
                        <ArrowRight
                          size={16}
                          weight="bold"
                          className="relative z-10 text-white ml-0.5 transition-transform duration-300 group-hover/btn:translate-x-1"
                        />
                      </>
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
      </Portal>
    </>
  );
}
