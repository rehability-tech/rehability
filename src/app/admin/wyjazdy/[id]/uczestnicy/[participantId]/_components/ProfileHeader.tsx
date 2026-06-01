"use client";

import React, { useMemo } from "react";
import { motion, type Variants } from "framer-motion";
import { IdentificationCard } from "@phosphor-icons/react/dist/ssr";

const getHighResImageUrl = (url?: string | null): string | null => {
  if (!url) return null;
  return url.includes("googleusercontent.com")
    ? url.replace(/=s\d+-c/g, "=s1024-c")
    : url;
};

const containerVariants: Variants = {
  hidden: { opacity: 0, y: 15 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: "easeOut", staggerChildren: 0.1 },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, x: -10 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.3 } },
};

export const ProfileHeader = ({ participant }: { participant: any }) => {
  const name = participant?.name || participant?.user?.name || "Brak danych";
  const shortId = participant?.id?.slice(-6).toUpperCase() || "BRAK";

  const initials = useMemo(
    () =>
      name !== "Brak danych"
        ? name
            .split(" ")
            .map((n: string) => n[0])
            .join("")
            .substring(0, 2)
            .toUpperCase()
        : "?",
    [name],
  );

  const avatarUrl = useMemo(
    () => getHighResImageUrl(participant?.user?.image),
    [participant?.user?.image],
  );

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      // Zmniejszono min-h ponieważ nie ma tu już tagów kontaktowych
      className="relative w-full max-w-[500px] min-h-[160px] sm:min-h-[180px] rounded-[32px] overflow-hidden flex flex-col p-6 sm:p-7 shadow-[0_12px_40px_-15px_rgba(3,63,99,0.25)] border border-white/20"
    >
      {/* TŁO: ZDJĘCIE */}
      <div className="absolute inset-0 z-0 pointer-events-none select-none bg-slate-900">
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt={name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-brand-primary/40 to-brand-secondary/60 flex items-center justify-center">
            <span className="font-extrabold text-8xl text-white/10">
              {initials}
            </span>
          </div>
        )}
      </div>

      {/* FROSTED GLASS OVERLAY */}
      <div className="absolute inset-0 z-[1] bg-gradient-to-bl from-brand-primary/60 to-black/40 backdrop-blur-[px] pointer-events-none" />

      {/* BRAND YELLOW GLOW */}
      <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-brand-yellow/50 blur-[70px] pointer-events-none z-[2] rounded-full" />

      {/* ID (Prawy górny róg) */}
      <motion.div
        variants={itemVariants}
        className="absolute top-5 right-5 z-10 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-2xl border border-white/20 text-white text-[10px] font-bold uppercase tracking-widest shadow-sm"
      >
        <IdentificationCard size={15} weight="duotone" />
        ID: {shortId}
      </motion.div>

      {/* IMIĘ (Wyrównane do dołu) */}
      <div className="relative z-10 mt-auto flex flex-col items-start pt-12">
        <motion.h1
          variants={itemVariants}
          className="text-[28px] sm:text-[34px] font-jakarta font-extrabold text-white tracking-tight leading-none drop-shadow-lg"
        >
          {name}
        </motion.h1>
      </div>
    </motion.div>
  );
};
