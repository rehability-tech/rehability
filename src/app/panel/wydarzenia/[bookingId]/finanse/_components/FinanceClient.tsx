"use client";

import React from "react";
import { motion } from "framer-motion";
import {
  CheckCircle,
  Clock,
  Sparkle,
  CurrencyCircleDollar,
  ArrowRight,
} from "@phosphor-icons/react/dist/ssr";

interface Order {
  id: string;
  serviceName: string;
  slotTime: string;
  price: number;
  status: string;
  isPaid: boolean;
}

interface Props {
  tripTitle: string;
  campPrice: number;
  campDeposit: number;
  campRemainder: number;
  depositPaidAt: string | null;
  remainderPaidAt: string | null;
  servicesTotal: number;
  orders: Order[];
}

function PaidBadge({ paid }: { paid: boolean }) {
  return paid ? (
    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full">
      <CheckCircle size={11} weight="fill" />
      Opłacone
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-600 bg-amber-50 px-2.5 py-1 rounded-full">
      <Clock size={11} weight="fill" />
      Oczekuje
    </span>
  );
}

function formatSlotTime(iso: string) {
  return new Date(iso).toLocaleString("pl-PL", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function FinanceClient({
  tripTitle,
  campPrice,
  campDeposit,
  campRemainder,
  depositPaidAt,
  remainderPaidAt,
  servicesTotal,
  orders,
}: Props) {
  const grandTotal = campPrice + servicesTotal;
  const paidTotal =
    (depositPaidAt ? campDeposit : 0) +
    (remainderPaidAt ? campRemainder : 0) +
    orders.filter((o) => o.isPaid).reduce((s, o) => s + o.price, 0);
  const outstanding = grandTotal - paidTotal;

  return (
    <div className="space-y-4 pb-6">
      {/* Podsumowanie top */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-[#0B3B4C] rounded-3xl p-5 text-white"
      >
        <p className="text-xs text-white/60 uppercase tracking-widest font-semibold mb-1">
          Do opłacenia łącznie
        </p>
        <p className="text-4xl font-jakarta font-bold">
          {outstanding.toFixed(0)}{" "}
          <span className="text-xl font-semibold text-white/60">zł</span>
        </p>
        <div className="mt-3 pt-3 border-t border-white/10 flex justify-between text-sm">
          <span className="text-white/60">Całkowity koszt</span>
          <span className="font-semibold">{grandTotal.toFixed(0)} zł</span>
        </div>
        <div className="flex justify-between text-sm mt-1">
          <span className="text-white/60">Już opłacono</span>
          <span className="font-semibold text-emerald-300">
            {paidTotal.toFixed(0)} zł
          </span>
        </div>
      </motion.div>

      {/* Wydarzenie */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden"
      >
        <div className="px-5 py-4 border-b border-gray-50">
          <p className="text-xs font-bold uppercase tracking-widest text-gray-400">
            Wydarzenie
          </p>
          <p className="font-jakarta font-bold text-[#0B3B4C] mt-0.5">
            {tripTitle}
          </p>
        </div>

        <div className="divide-y divide-gray-50">
          <div className="flex items-center justify-between px-5 py-3.5">
            <div>
              <p className="text-sm font-medium text-[#0B3B4C]">Zadatek</p>
              <p className="text-xs text-gray-400">{campDeposit.toFixed(0)} zł</p>
            </div>
            <PaidBadge paid={!!depositPaidAt} />
          </div>

          <div className="flex items-center justify-between px-5 py-3.5">
            <div>
              <p className="text-sm font-medium text-[#0B3B4C]">
                Pozostała kwota
              </p>
              <p className="text-xs text-gray-400">
                {campRemainder.toFixed(0)} zł
              </p>
            </div>
            <PaidBadge paid={!!remainderPaidAt} />
          </div>
        </div>

        <div className="flex items-center justify-between px-5 py-3.5 bg-gray-50">
          <p className="text-sm font-semibold text-gray-500">Razem za wydarzenie</p>
          <p className="font-bold text-[#0B3B4C]">{campPrice.toFixed(0)} zł</p>
        </div>
      </motion.div>

      {/* Usługi */}
      {orders.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden"
        >
          <div className="px-5 py-4 border-b border-gray-50 flex items-center gap-2">
            <Sparkle size={15} weight="duotone" className="text-[#287D88]" />
            <p className="text-xs font-bold uppercase tracking-widest text-gray-400">
              Zarezerwowane zabiegi
            </p>
          </div>

          <div className="divide-y divide-gray-50">
            {orders.map((order) => (
              <div
                key={order.id}
                className="flex items-center justify-between px-5 py-3.5"
              >
                <div>
                  <p className="text-sm font-medium text-[#0B3B4C]">
                    {order.serviceName}
                  </p>
                  <p className="text-xs text-gray-400">
                    {formatSlotTime(order.slotTime)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-[#0B3B4C]">
                    {order.price.toFixed(0)} zł
                  </span>
                  <PaidBadge paid={order.isPaid} />
                </div>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between px-5 py-3.5 bg-gray-50">
            <p className="text-sm font-semibold text-gray-500">
              Razem za zabiegi
            </p>
            <p className="font-bold text-[#0B3B4C]">
              {servicesTotal.toFixed(0)} zł
            </p>
          </div>
        </motion.div>
      )}

      {/* CTA płatności — placeholder przed integracją Stripe/P24 */}
      {outstanding > 0 && (
        <motion.button
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="w-full flex items-center justify-center gap-2 bg-[#287D88] text-white font-bold py-4 rounded-2xl shadow-md hover:bg-[#1f6570] transition-colors active:scale-[0.98]"
          onClick={() => alert("Integracja płatności — wkrótce")}
        >
          <CurrencyCircleDollar size={20} weight="duotone" />
          Opłać {outstanding.toFixed(0)} zł
          <ArrowRight size={16} />
        </motion.button>
      )}
    </div>
  );
}
