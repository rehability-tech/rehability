"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  WarningCircle,
  ArrowLeft,
  CircleNotch,
} from "@phosphor-icons/react/dist/ssr";
import type { ClientProfileData } from "@/lib/crm/types";
import ClientProfile from "./_components/ClientProfile";

/**
 * Strona profilu klienta — lekki Client Component.
 *
 * Świadomie NIE pobieramy danych na serwerze: dzięki temu przejście w trasę jest
 * natychmiastowe (layout renderuje się od razu), a pełny profil dociągamy
 * asynchronicznie z `/api/admin/klienci/[id]` ze stanami loading / 404 / błąd.
 * Autoryzację ADMIN egzekwuje endpoint API (401) oraz guard w /admin/layout.tsx.
 */
export default function ClientProfilePage() {
  const params = useParams();
  const id = params.id as string;

  const [client, setClient] = useState<ClientProfileData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;

    let cancelled = false;
    setIsLoading(true);
    setError(null);
    setNotFound(false);

    fetch(`/api/admin/klienci/${id}`)
      .then(async (res) => {
        if (res.status === 404) {
          if (!cancelled) setNotFound(true);
          return null;
        }
        if (!res.ok) throw new Error("Nie udało się pobrać danych klienta.");
        return res.json();
      })
      .then((data) => {
        if (cancelled || !data) return;
        setClient(data.client);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [id]);

  // 1. ŁADOWANIE
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-brand-primary">
        <CircleNotch size={40} weight="bold" className="animate-spin mb-4" />
        <p className="text-xs font-bold uppercase tracking-widest opacity-70">
          Pobieranie profilu klienta...
        </p>
      </div>
    );
  }

  // 2. NIE ZNALEZIONO / BŁĄD
  if (notFound || error || !client) {
    return (
      <div className="flex flex-col items-center justify-center py-20 bg-white/60 backdrop-blur-xl border border-white/80 rounded-[28px] rounded-tr-none max-w-xl mx-auto mt-10 shadow-sm text-center px-6">
        <div className="w-16 h-16 rounded-full bg-rose-50 text-rose-500 flex items-center justify-center mb-4">
          <WarningCircle size={36} weight="duotone" />
        </div>
        <h2 className="text-lg font-bold text-brand-secondary mb-1">
          {notFound ? "Nie znaleziono klienta" : "Wystąpił błąd"}
        </h2>
        <p className="font-medium text-sm text-brand-secondary/60 max-w-sm">
          {notFound
            ? "Klient o podanym identyfikatorze nie istnieje lub został usunięty z bazy."
            : error || "Nie udało się wczytać profilu."}
        </p>
        <Link
          href="/admin/klienci"
          className="mt-6 inline-flex items-center gap-2 text-sm font-bold text-brand-primary hover:underline"
        >
          <ArrowLeft size={16} weight="bold" />
          Wróć do bazy klientów
        </Link>
      </div>
    );
  }

  // 3. SUKCES
  return <ClientProfile data={client} />;
}
