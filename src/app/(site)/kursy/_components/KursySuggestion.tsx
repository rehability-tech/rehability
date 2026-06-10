"use client";

import { useState } from "react";

export function KursySuggestion() {
  const [topic, setTopic] = useState("");
  const [sent, setSent] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim()) return;
    // TODO: podpiąć pod endpoint zbierający sugestie tematów VOD.
    setSent(true);
    setTopic("");
  };

  return (
    <section className="container pb-24">
      <div className="relative overflow-hidden rounded-[40px] md:rounded-[63px] bg-[#76adb6] px-6 py-12 md:px-16 md:py-14">
        {/* Dekoracyjne poświaty */}
        <div className="pointer-events-none absolute -right-20 -top-24 w-[420px] h-[420px] rounded-full bg-white/10 blur-[80px]" />
        <div className="pointer-events-none absolute -left-24 -bottom-28 w-[420px] h-[420px] rounded-full bg-brand-primary/20 blur-[90px]" />

        <div className="relative flex flex-col items-center gap-6 text-center">
          <div className="flex flex-col gap-3 max-w-[653px]">
            <h2 className="font-jakarta font-semibold text-white text-[30px] md:text-[48px] leading-tight">
              Brakuje Ci konkretnego tematu?
            </h2>
            <p className="font-jakarta font-medium text-white/90 text-[16px] leading-[1.4]">
              Stale rozwijamy naszą bazę VOD, opierając się na realnych
              potrzebach pacjentów. Daj znać, jakiego programu brakuje w
              katalogu, a weźmiemy to pod uwagę przy tworzeniu kolejnych
              materiałów.
            </p>
          </div>

          {sent ? (
            <p className="font-jakarta font-semibold text-white bg-white/15 rounded-2xl px-6 py-3">
              Dziękujemy! Twoja sugestia została zapisana. 💙
            </p>
          ) : (
            <form
              onSubmit={handleSubmit}
              className="flex flex-col sm:flex-row gap-2 w-full max-w-[518px]"
            >
              <input
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="Jaki program chcesz zobaczyć?"
                className="flex-1 h-12 px-4 rounded-xl bg-white/80 font-jakarta text-[15px] text-brand-secondary placeholder:text-brand-secondary/40 outline-none focus:bg-white"
              />
              <button
                type="submit"
                className="h-12 px-8 rounded-xl rounded-tr-[20px] bg-brand-primary text-white font-jakarta font-semibold text-[15px] tracking-[0.15px] transition-colors hover:bg-brand-secondary"
              >
                Wyślij
              </button>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}
