"use client";

import React, { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  CircleNotch,
  WarningCircle,
  ArrowLeft,
  Storefront,
  Sparkle,
} from "@phosphor-icons/react/dist/ssr";

import { ServiceStatsBar } from "./_components/ServiceStatsBar";
import { CampServiceCard } from "./_components/CampServiceCard";
import { CatalogPicker } from "./_components/CatalogPicker";
import {
  EditServiceModal,
  type EditScope,
} from "./_components/EditServiceModal";
import type { CampService, ShopData } from "./_components/types";

export default function CampShopPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [data, setData] = useState<ShopData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [editing, setEditing] = useState<CampService | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch(`/api/admin/wyjazdy/${id}/sklep?t=${Date.now()}`, {
        cache: "no-store",
      });
      if (!res.ok) throw new Error("Błąd pobierania danych sklepu");
      setData(await res.json());
    } catch (err) {
      console.error(err);
      toast.error("Nie udało się wczytać sklepu campu.");
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
        ? `Dodano ${json.added} ${json.added === 1 ? "usługę" : "usług"} do campu.`
        : "Wybrane usługi są już w campie.",
    );
    await fetchData();
  };

  // Utworzenie nowej usługi globalnej + dodanie do campu
  const handleCreate = async (payload: {
    name: string;
    duration: string;
    price: string;
    description: string;
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
    // od razu dodajemy nową usługę do tego campu
    await handleAdd([created.id]);
    return created.id as string;
  };

  // Edycja usługi (camp / global)
  const handleSave = async (
    scope: EditScope,
    payload: {
      name: string;
      duration: string;
      price: string;
      description: string;
    },
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
        ? `Zaktualizowano w katalogu i ${json.propagatedTo} campach.`
        : "Zaktualizowano usługę w tym campie.",
    );
    await fetchData();
    return true;
  };

  // Usunięcie usługi z campu
  const handleDelete = async (service: CampService) => {
    if (!window.confirm(`Usunąć usługę "${service.name}" z tego campu?`)) return;
    const res = await fetch(
      `/api/admin/wyjazdy/${id}/sklep?serviceId=${service.id}`,
      { method: "DELETE" },
    );
    if (!res.ok) {
      const e = await res.json().catch(() => null);
      toast.error(e?.error || "Nie udało się usunąć usługi.");
      return;
    }
    toast.success("Usunięto usługę z campu.");
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
          Wczytywanie sklepu campu...
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

      <main className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 flex flex-col gap-6">
        {/* Header */}
        <header className="flex flex-col gap-4 border-b border-gray-100/80 pb-5">
          <button
            type="button"
            onClick={() => router.push(`/admin/wyjazdy/${id}`)}
            className="inline-flex items-center gap-1.5 text-[13px] font-bold text-slate-400 hover:text-brand-primary transition-colors w-fit"
          >
            <ArrowLeft size={16} weight="bold" /> Pulpit wyjazdu
          </button>
          <div className="flex items-center gap-3">
            <span className="flex items-center justify-center w-12 h-12 rounded-2xl rounded-tr-none bg-gradient-to-br from-brand-primary to-brand-secondary text-white shadow-[0_4px_12px_-2px_rgba(40,125,136,0.5)]">
              <Storefront size={24} weight="bold" />
            </span>
            <div>
              <h1 className="font-jakarta text-2xl sm:text-3xl font-bold text-brand-secondary">
                Sklep / Usługi campu
              </h1>
              <p className="text-[13px] text-brand-secondary/50 font-medium mt-0.5">
                Zarządzaj usługami SPA tego wyjazdu i ich sprzedażą.
              </p>
            </div>
          </div>
        </header>

        {/* Statystyki */}
        <ServiceStatsBar stats={data.stats} />

        {/* Layout: usługi campu + katalog */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
          <section className="xl:col-span-8">
            <div className="flex items-center gap-2 mb-4">
              <Sparkle size={18} weight="fill" className="text-brand-yellow" />
              <h2 className="text-base font-bold text-brand-secondary">
                Usługi w tym campie
              </h2>
              <span className="text-[12px] font-bold text-slate-400">
                ({data.services.length})
              </span>
            </div>

            {data.services.length === 0 ? (
              <div className="rounded-3xl rounded-tr-none border border-dashed border-slate-200 bg-white/50 p-10 text-center">
                <p className="text-sm text-slate-400 font-medium">
                  Ten camp nie ma jeszcze żadnych usług. Dodaj je z katalogu
                  globalnego po prawej.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
          </section>

          <aside className="xl:col-span-4">
            <CatalogPicker
              catalog={data.catalog}
              onAdd={handleAdd}
              onCreate={handleCreate}
            />
          </aside>
        </div>
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
