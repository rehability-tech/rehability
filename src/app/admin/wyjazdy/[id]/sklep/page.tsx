"use client";

import React, { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import {
  CircleNotch,
  WarningCircle,
  ArrowLeft,
  Storefront,
  House,
  Globe,
} from "@phosphor-icons/react/dist/ssr";

import { ServiceStatsBar } from "./_components/ServiceStatsBar";
import { CampServiceCard } from "./_components/CampServiceCard";
import { CatalogPicker } from "./_components/CatalogPicker";
import {
  EditServiceModal,
  type EditScope,
  type EditServicePayload,
} from "./_components/EditServiceModal";
import type { CampService, ShopData } from "./_components/types";

type ShopView = "camp" | "catalog";

export default function CampShopPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [data, setData] = useState<ShopData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [editing, setEditing] = useState<CampService | null>(null);
  const [view, setView] = useState<ShopView>("camp");

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch(`/api/admin/wyjazdy/${id}/sklep?t=${Date.now()}`, {
        cache: "no-store",
      });
      if (!res.ok) throw new Error("Błąd pobierania danych sklepu");
      setData(await res.json());
    } catch (err) {
      console.error(err);
      toast.error("Nie udało się wczytać sklepu wyjazdu.");
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Dodanie usług z katalogu
  const handleAdd = async (extraServiceIds: string[]) => {
    const res = await fetch(`/api/admin/wyjazdy/${id}/sklep`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ extraServiceIds }),
    });
    if (!res.ok) {
      const e = await res.json().catch(() => null);
      toast.error(e?.error || "Nie udało się dodać usług.");
      return;
    }
    const json = await res.json();
    toast.success(
      json.added > 0
        ? `Dodano ${json.added} ${json.added === 1 ? "usługę" : "usług"} do wyjazdu.`
        : "Wybrane usługi są już w wyjeździe.",
    );
    await fetchData();
  };

  // Utworzenie nowej usługi globalnej + dodanie do wyjazdu
  const handleCreate = async (payload: {
    name: string;
    duration: string;
    price: string;
    description: string;
    image: string | null;
  }) => {
    const res = await fetch(`/api/admin/uslugi`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const e = await res.json().catch(() => null);
      toast.error(e?.error || "Nie udało się utworzyć usługi.");
      return null;
    }
    const created = await res.json();
    // od razu dodajemy nową usługę do tego wyjazdu
    await handleAdd([created.id]);
    return created.id as string;
  };

  // Edycja usługi (camp / global)
  const handleSave = async (
    scope: EditScope,
    payload: EditServicePayload,
  ): Promise<boolean> => {
    if (!editing) return false;
    const res = await fetch(`/api/admin/wyjazdy/${id}/sklep`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: editing.id, scope, ...payload }),
    });
    if (!res.ok) {
      const e = await res.json().catch(() => null);
      toast.error(e?.error || "Nie udało się zapisać zmian.");
      return false;
    }
    const json = await res.json();
    toast.success(
      scope === "global"
        ? `Zaktualizowano w katalogu i ${json.propagatedTo} wyjazdach.`
        : "Zaktualizowano usługę w tym wyjeździe.",
    );
    await fetchData();
    return true;
  };

  // Usunięcie usługi z wyjazdu
  const handleDelete = async (service: CampService) => {
    if (!window.confirm(`Usunąć usługę "${service.name}" z tego wyjazdu?`)) return;
    const res = await fetch(
      `/api/admin/wyjazdy/${id}/sklep?serviceId=${service.id}`,
      { method: "DELETE" },
    );
    if (!res.ok) {
      const e = await res.json().catch(() => null);
      toast.error(e?.error || "Nie udało się usunąć usługi.");
      return;
    }
    toast.success("Usunięto usługę z wyjazdu.");
    await fetchData();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50/50">
        <CircleNotch
          size={40}
          weight="bold"
          className="text-brand-primary animate-spin mb-4"
        />
        <p className="text-xs font-montserrat text-brand-secondary/50 font-semibold uppercase tracking-wider">
          Wczytywanie sklepu wyjazdu...
        </p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 text-center">
        <WarningCircle size={48} weight="duotone" className="text-rose-500 mb-3" />
        <h2 className="text-2xl font-jakarta font-bold text-brand-secondary mb-2">
          Nie można wczytać sklepu
        </h2>
        <button
          type="button"
          onClick={() => router.push(`/admin/wyjazdy/${id}`)}
          className="mt-2 text-sm font-bold text-brand-primary hover:underline"
        >
          Wróć do pulpitu
        </button>
      </div>
    );
  }

  return (
    <div className="relative font-montserrat min-h-screen bg-gray-50/30">
      <div className="absolute inset-0 pointer-events-none overflow-hidden -z-10">
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-brand-primary/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-20 right-10 w-[400px] h-[400px] bg-brand-yellow/5 rounded-full blur-[100px]" />
      </div>

      <main className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 flex flex-col gap-8">
        {/* ========================================================= */}
        {/* HERO HEADER (gradient brandowy, glassmorphism)            */}
        {/* ========================================================= */}
        <header className="relative overflow-hidden rounded-[28px] rounded-tr-none p-6 sm:p-8 shadow-[0_18px_50px_-20px_rgba(3,63,99,0.45)] border border-white/20">
          <div className="absolute inset-0 bg-gradient-to-br from-brand-primary via-brand-secondary to-brand-secondary" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(242,217,103,0.20),transparent_55%)]" />
          <div className="absolute -top-12 -right-10 w-64 h-64 bg-brand-yellow/30 rounded-full blur-[90px] pointer-events-none" />
          <div className="absolute -bottom-24 left-1/4 w-72 h-72 bg-white/10 rounded-full blur-[110px] pointer-events-none" />

          <div className="relative z-10 flex flex-col gap-5">
            <button
              type="button"
              onClick={() => router.push(`/admin/wyjazdy/${id}`)}
              className="inline-flex items-center gap-1.5 text-[12px] font-bold text-white/70 hover:text-white transition-colors w-fit bg-white/10 backdrop-blur-md border border-white/10 rounded-full px-3 py-1.5"
            >
              <ArrowLeft size={14} weight="bold" /> Pulpit wyjazdu
            </button>

            <div className="flex items-center gap-4">
              <span className="flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 rounded-2xl rounded-tr-none bg-white/15 backdrop-blur-md border border-white/10 text-white shadow-inner shrink-0">
                <Storefront size={26} weight="bold" />
              </span>
              <div>
                <h1 className="font-jakarta text-2xl sm:text-[32px] font-bold text-white leading-tight drop-shadow-sm">
                  Sklep / Usługi wyjazdu
                </h1>
                <p className="text-[13px] text-white/70 font-medium mt-1">
                  Zarządzaj usługami SPA tego wyjazdu i ich sprzedażą.
                </p>
              </div>
            </div>
          </div>
        </header>

        {/* Statystyki */}
        <ServiceStatsBar stats={data.stats} />

        {/* Sekcja: przełącznik widoku + lista */}
        <section className="flex flex-col gap-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-2.5">
              <span className="w-1.5 h-5 rounded-full bg-gradient-to-b from-brand-primary to-brand-yellow" />
              <h2 className="font-jakarta text-lg font-bold text-brand-secondary">
                {view === "camp" ? "Usługi w tym wyjeździe" : "Katalog globalny"}
                <span className="ml-2 text-brand-secondary/40 font-semibold text-sm">
                  ({view === "camp" ? data.services.length : data.catalog.length}
                  )
                </span>
              </h2>
            </div>

            {/* Przełącznik: Ten camp / Globalnie */}
            <div className="inline-flex rounded-2xl bg-white/60 backdrop-blur-sm border border-white/60 p-1 shadow-sm shrink-0">
              <button
                type="button"
                onClick={() => setView("camp")}
                className={`flex items-center justify-center gap-1.5 rounded-xl px-4 h-9 text-[13px] font-bold transition-all ${
                  view === "camp"
                    ? "bg-brand-primary text-white shadow-[0_4px_15px_0px_rgba(242,217,103,0.35)] border border-brand-yellow/30"
                    : "text-brand-secondary/60 hover:text-brand-secondary"
                }`}
              >
                <House size={15} weight="bold" /> Ten wyjazd
              </button>
              <button
                type="button"
                onClick={() => setView("catalog")}
                className={`flex items-center justify-center gap-1.5 rounded-xl px-4 h-9 text-[13px] font-bold transition-all ${
                  view === "catalog"
                    ? "bg-brand-primary text-white shadow-[0_4px_15px_0px_rgba(242,217,103,0.35)] border border-brand-yellow/30"
                    : "text-brand-secondary/60 hover:text-brand-secondary"
                }`}
              >
                <Globe size={15} weight="bold" /> Globalnie
              </button>
            </div>
          </div>

          <AnimatePresence mode="wait">
            {view === "camp" ? (
              <motion.div
                key="camp"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.22, ease: "easeOut" }}
              >
                {data.services.length === 0 ? (
                  <div className="rounded-3xl rounded-tr-none border border-dashed border-slate-200 bg-white/50 p-10 text-center">
                    <p className="text-sm text-slate-400 font-medium">
                      Ten camp nie ma jeszcze żadnych usług. Przełącz na{" "}
                      <button
                        type="button"
                        onClick={() => setView("catalog")}
                        className="font-bold text-brand-primary hover:underline"
                      >
                        Globalnie
                      </button>
                      , aby dodać je z katalogu.
                    </p>
                  </div>
                ) : (
                  <div className="flex flex-col gap-3">
                    {data.services.map((s, i) => (
                      <CampServiceCard
                        key={s.id}
                        service={s}
                        index={i}
                        onEdit={setEditing}
                        onDelete={handleDelete}
                      />
                    ))}
                  </div>
                )}
              </motion.div>
            ) : (
              <motion.div
                key="catalog"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.22, ease: "easeOut" }}
              >
                <CatalogPicker
                  catalog={data.catalog}
                  onAdd={handleAdd}
                  onCreate={handleCreate}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </section>
      </main>

      {editing && (
        <EditServiceModal
          service={editing}
          onClose={() => setEditing(null)}
          onSave={handleSave}
        />
      )}
    </div>
  );
}
