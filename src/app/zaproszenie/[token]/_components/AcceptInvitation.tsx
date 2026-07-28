"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { CircleNotch, GoogleLogo, ArrowRight } from "@phosphor-icons/react";

interface Props {
  token: string;
  isLoggedIn: boolean;
}

export default function AcceptInvitation({ token, isLoggedIn }: Props) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Niezalogowana: logujemy przez Google z powrotem na ten sam link zaproszenia.
  const handleLogin = async () => {
    setIsLoading(true);
    await signIn("google", { callbackUrl: `/zaproszenie/${token}` });
  };

  // Zalogowana: przejmujemy rezerwację i idziemy do panelu opłacić zadatek.
  const handleAccept = async () => {
    setError(null);
    setIsLoading(true);
    try {
      const res = await fetch("/api/zaproszenia/accept", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error ?? "Nie udało się przyjąć zaproszenia.");
      }
      router.push("/panel/wydarzenia");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Coś poszło nie tak.");
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-3">
      <button
        type="button"
        onClick={isLoggedIn ? handleAccept : handleLogin}
        disabled={isLoading}
        className="relative flex items-center justify-center gap-2 w-full px-6 py-4 rounded-2xl rounded-tr-none bg-brand-primary text-white font-semibold text-sm shadow-[0_4px_15px_0px_rgba(242,217,103,0.35)] border border-brand-yellow/30 transition-transform hover:scale-[1.02] active:scale-95 disabled:opacity-60 disabled:hover:scale-100"
      >
        <span className="absolute -bottom-1 -right-1 w-6 h-6 bg-brand-yellow/50 blur-[12px] rounded-full pointer-events-none" />
        {isLoading ? (
          <CircleNotch size={20} weight="bold" className="animate-spin" />
        ) : isLoggedIn ? (
          <>
            Dołączam do wydarzenia
            <ArrowRight size={18} weight="bold" />
          </>
        ) : (
          <>
            <GoogleLogo size={18} weight="bold" />
            Zaloguj się i dołącz
          </>
        )}
      </button>

      {error && (
        <p className="text-center text-xs font-medium text-rose-500">{error}</p>
      )}

      {!isLoggedIn && (
        <p className="text-center text-[11px] text-brand-secondary/50">
          Po zalogowaniu wrócisz tutaj, aby potwierdzić udział.
        </p>
      )}
    </div>
  );
}
