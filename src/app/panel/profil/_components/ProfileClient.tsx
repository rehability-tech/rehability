"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { SessionProvider, useSession, signOut } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import {
  Globe,
  DownloadSimple,
  SignOut,
  CircleNotch,
  EnvelopeSimple,
  ShieldCheck,
  Bell,
  Camera,
  PencilSimple,
  Check,
  X,
} from "@phosphor-icons/react/dist/ssr";
import NotificationToggle from "@/components/notifications/NotificationToggle";
import { isStandalone } from "@/lib/pwa/clientEnv";
import { triggerInstallPrompt } from "@/lib/pwa/triggers";

export interface ProfileUser {
  name: string | null;
  email: string | null;
  image: string | null;
  role: string;
}

// Wejście strony — sekcje pojawiają się kaskadowo (stagger).
const pageContainer = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08, delayChildren: 0.04 } },
};
const sectionItem = {
  hidden: { opacity: 0, y: 18 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] as const },
  },
};

export default function ProfileClient({ user }: { user: ProfileUser }) {
  // Lokalny SessionProvider — projekt nie ma globalnego, a potrzebujemy
  // useSession().update() do odświeżenia imienia/zdjęcia w tokenie JWT.
  return (
    <SessionProvider>
      <ProfileInner user={user} />
    </SessionProvider>
  );
}

function ProfileInner({ user }: { user: ProfileUser }) {
  const router = useRouter();
  const { update } = useSession();
  const fileRef = useRef<HTMLInputElement>(null);

  const initial = user.name ?? "";
  const [displayName, setDisplayName] = useState(initial);
  const [image, setImage] = useState(user.image);
  const [editing, setEditing] = useState(false);
  const [firstName, setFirstName] = useState(initial.split(" ")[0] ?? "");
  const [lastName, setLastName] = useState(
    initial.split(" ").slice(1).join(" "),
  );
  const [savingName, setSavingName] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [canInstall, setCanInstall] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => setCanInstall(!isStandalone()), []);

  const firstLetter = (displayName.trim().charAt(0) || "U").toUpperCase();
  const isAdmin = user.role === "ADMIN";

  async function saveName() {
    const name = `${firstName} ${lastName}`.trim().replace(/\s+/g, " ");
    if (name.length < 2) {
      toast.error("Podaj imię i nazwisko");
      return;
    }
    setSavingName(true);
    try {
      const res = await fetch("/api/user/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Nie udało się zapisać");

      setDisplayName(name);
      setEditing(false);
      await update({ name });
      router.refresh();
      toast.success("Zapisano dane");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Nie udało się zapisać");
    } finally {
      setSavingName(false);
    }
  }

  async function onPickFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const res = await fetch(
        `/api/user/avatar?filename=${encodeURIComponent(file.name)}`,
        { method: "POST", body: file },
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Nie udało się przesłać");

      setImage(data.url);
      await update({ image: data.url });
      router.refresh();
      toast.success("Zdjęcie zaktualizowane");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Nie udało się przesłać");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  const handleLogout = async () => {
    setLoggingOut(true);
    await signOut({ callbackUrl: "/" });
  };

  return (
    <motion.div
      variants={pageContainer}
      initial="hidden"
      animate="show"
      className="w-full max-w-2xl mx-auto px-4 py-8"
    >
      {/* Nagłówek */}
      <motion.div variants={sectionItem} className="mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-brand-primary/10 border border-brand-primary/15 mb-3">
          <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-brand-primary">
            Mój profil
          </span>
        </div>
        <h1 className="font-jakarta font-bold text-3xl md:text-4xl text-brand-secondary tracking-tight">
          Twoje konto
        </h1>
      </motion.div>

      {/* Karta tożsamości */}
      <motion.div
        variants={sectionItem}
        className="relative overflow-hidden rounded-3xl rounded-tr-none bg-white/70 backdrop-blur-2xl border border-white/50 shadow-[0_20px_60px_-30px_rgba(3,63,99,0.35)] p-6 mb-6"
      >
        <div className="pointer-events-none absolute -bottom-8 -right-8 w-36 h-36 bg-brand-yellow/30 rounded-full blur-2xl" />

        <div className="relative flex items-center gap-5">
          {/* Avatar z uploadem */}
          <div className="relative shrink-0">
            <div className="absolute -inset-[3px] rounded-full bg-gradient-to-br from-brand-primary to-brand-secondary shadow-[0_0_20px_rgba(40,125,136,0.45)] opacity-90" />
            <div className="relative w-20 h-20 rounded-full bg-brand-primary flex items-center justify-center overflow-hidden">
              {image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={image}
                  alt="Avatar"
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <span className="font-jakarta font-bold text-[28px] text-white">
                  {firstLetter}
                </span>
              )}
              {uploading && (
                <div className="absolute inset-0 bg-brand-secondary/50 flex items-center justify-center">
                  <CircleNotch size={22} className="animate-spin text-white" />
                </div>
              )}
            </div>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              transition={{ type: "spring", stiffness: 400, damping: 15 }}
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              aria-label="Zmień zdjęcie"
              className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-brand-primary text-white border-2 border-white flex items-center justify-center shadow-md hover:bg-brand-primary/90 transition disabled:opacity-60"
            >
              <Camera size={15} weight="fill" />
            </motion.button>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={onPickFile}
            />
          </div>

          {/* Dane */}
          <div className="min-w-0 flex-1">
            <AnimatePresence mode="wait" initial={false}>
            {editing ? (
              <motion.div
                key="edit"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                className="flex flex-col gap-2"
              >
                <div className="flex gap-2">
                  <input
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="Imię"
                    className="w-full px-3 py-2 rounded-xl bg-white/80 border border-brand-secondary/15 text-[14px] text-brand-secondary outline-none focus:border-brand-primary/50 transition"
                  />
                  <input
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Nazwisko"
                    className="w-full px-3 py-2 rounded-xl bg-white/80 border border-brand-secondary/15 text-[14px] text-brand-secondary outline-none focus:border-brand-primary/50 transition"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={saveName}
                    disabled={savingName}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-brand-primary text-white text-[13px] font-bold disabled:opacity-60 transition"
                  >
                    {savingName ? (
                      <CircleNotch size={14} className="animate-spin" />
                    ) : (
                      <Check size={14} weight="bold" />
                    )}
                    Zapisz
                  </button>
                  <button
                    onClick={() => {
                      setFirstName(displayName.split(" ")[0] ?? "");
                      setLastName(displayName.split(" ").slice(1).join(" "));
                      setEditing(false);
                    }}
                    disabled={savingName}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/70 border border-white/60 text-brand-secondary/70 text-[13px] font-medium transition"
                  >
                    <X size={14} weight="bold" />
                    Anuluj
                  </button>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="view"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
              >
                <div className="flex items-center gap-2">
                  <h2 className="font-jakarta font-bold text-[20px] text-brand-secondary truncate">
                    {displayName || "Uczestnik"}
                  </h2>
                  <button
                    onClick={() => setEditing(true)}
                    aria-label="Edytuj imię i nazwisko"
                    className="shrink-0 w-7 h-7 rounded-lg flex items-center justify-center text-brand-secondary/50 hover:text-brand-primary hover:bg-brand-primary/10 transition"
                  >
                    <PencilSimple size={15} weight="bold" />
                  </button>
                </div>
                {user.email && (
                  <p className="flex items-center gap-1.5 text-[13px] text-brand-secondary/60 mt-1 truncate">
                    <EnvelopeSimple
                      size={14}
                      weight="bold"
                      className="shrink-0"
                    />
                    <span className="truncate">{user.email}</span>
                  </p>
                )}
                {isAdmin && (
                  <span className="inline-flex items-center gap-1.5 mt-3 px-2.5 py-1 rounded-full bg-brand-primary/10 text-brand-primary text-[11px] font-bold">
                    <ShieldCheck size={13} weight="fill" />
                    Administrator
                  </span>
                )}
              </motion.div>
            )}
            </AnimatePresence>
          </div>
        </div>
      </motion.div>

      {/* Powiadomienia */}
      <motion.div variants={sectionItem} className="mb-6">
        <SectionTitle
          icon={<Bell size={16} weight="fill" />}
          label="Powiadomienia"
        />
        <NotificationToggle />
      </motion.div>

      {/* Aplikacja */}
      {canInstall && (
        <motion.div variants={sectionItem}>
          <SectionTitle
            icon={<DownloadSimple size={16} weight="fill" />}
            label="Aplikacja"
          />
          <motion.button
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.99 }}
            transition={{ type: "spring", stiffness: 400, damping: 22 }}
            onClick={() => triggerInstallPrompt()}
            className="w-full flex items-center gap-4 p-4 rounded-2xl bg-white/70 backdrop-blur-md border border-white/40 hover:bg-white transition shadow-[0_4px_18px_-10px_rgba(3,63,99,0.18)] text-left mb-6"
          >
            <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 bg-brand-primary text-white shadow-[0_4px_15px_rgba(242,217,103,0.35)]">
              <DownloadSimple size={22} weight="fill" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-jakarta font-bold text-[14px] text-brand-secondary">
                Zainstaluj aplikację
              </p>
              <p className="font-montserrat text-[12px] text-brand-secondary/60 mt-0.5">
                Dodaj Rehability do ekranu głównego — szybszy dostęp i
                powiadomienia.
              </p>
            </div>
          </motion.button>
        </motion.div>
      )}

      {/* Konto */}
      <motion.div variants={sectionItem}>
        <SectionTitle icon={<Globe size={16} weight="fill" />} label="Konto" />
        <div className="rounded-2xl bg-white/70 backdrop-blur-md border border-white/40 shadow-[0_4px_18px_-10px_rgba(3,63,99,0.18)] overflow-hidden">
        <Link
          href="/"
          className="flex items-center gap-3 px-4 py-3.5 text-[14px] text-brand-secondary hover:bg-brand-primary/5 transition"
        >
          <Globe size={18} weight="duotone" className="text-brand-primary" />
          Strona główna
        </Link>
        <div className="h-px bg-brand-secondary/5 mx-4" />
        <button
          onClick={handleLogout}
          disabled={loggingOut}
          className="w-full flex items-center gap-3 px-4 py-3.5 text-[14px] text-red-500 hover:bg-red-50 transition text-left disabled:opacity-70 disabled:cursor-wait"
        >
          {loggingOut ? (
            <>
              <CircleNotch size={18} className="animate-spin" />
              Wylogowywanie…
            </>
          ) : (
            <>
              <SignOut size={18} weight="duotone" />
              Wyloguj się
            </>
          )}
        </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

function SectionTitle({
  icon,
  label,
}: {
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <div className="flex items-center gap-2 mb-3 px-1">
      <span className="text-brand-primary">{icon}</span>
      <h3 className="font-jakarta font-bold text-[13px] uppercase tracking-wide text-brand-secondary/70">
        {label}
      </h3>
    </div>
  );
}
