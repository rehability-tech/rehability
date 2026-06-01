"use client";

import React, { memo, useMemo } from "react";
import { motion } from "framer-motion";
import {
  Megaphone,
  BellRinging,
  Info,
  Sparkle,
  VideoCamera,
  Article,
  Tent,
  ArrowUpRight,
  Bell,
  Heart,
  Tag,
  Wallet,
} from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";

// Definicja zgodna z modelem Prisma: SystemUpdate
export interface SystemUpdateItem {
  id: string;
  type: string; // "VOD" | "CAMP" | "BLOG" | "SYSTEM"
  title: string;
  description: string;
  link?: string | null;
  createdAt: string;
}

// Definicja zgodna z modelem Prisma: Notification (powiadomienia personalne)
export type PersonalNotificationType =
  | "INFO"
  | "SUCCESS"
  | "WARNING"
  | "BOOKING"
  | "PAYMENT"
  | "HEALTH"
  | "SPA"
  | "SYSTEM";

export interface PersonalNotificationItem {
  id: string;
  title: string;
  message: string | null;
  type: PersonalNotificationType;
  isRead: boolean;
  link: string | null;
  createdAt: string;
}

const PERSONAL_NOTIFICATIONS_VISIBLE = 3;

// Funkcja zamieniająca datę na przyjazny format
function formatRelativeDate(isoString: string) {
  const date = new Date(isoString);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (date.toDateString() === today.toDateString()) return "Dzisiaj";
  if (date.toDateString() === yesterday.toDateString()) return "Wczoraj";

  return date.toLocaleDateString("pl-PL", {
    day: "numeric",
    month: "short",
  });
}

// System przypisywania kolorów i ikon do danego Typu wpisu
function getUpdateStyling(type: string) {
  switch (type) {
    case "VOD":
      return {
        icon: (
          <VideoCamera size={18} weight="duotone" className="text-purple-500" />
        ),
        bg: "bg-purple-100/50 border-purple-200/50",
      };
    case "CAMP":
      return {
        icon: <Tent size={18} weight="duotone" className="text-emerald-500" />,
        bg: "bg-emerald-100/50 border-emerald-200/50",
      };
    case "BLOG":
      return {
        icon: <Article size={18} weight="duotone" className="text-blue-500" />,
        bg: "bg-blue-100/50 border-blue-200/50",
      };
    case "SPA":
      return {
        icon: <Sparkle size={18} weight="duotone" className="text-amber-500" />,
        bg: "bg-amber-100/50 border-amber-200/50",
      };
    case "SYSTEM":
    default:
      return {
        icon: (
          <BellRinging
            size={18}
            weight="duotone"
            className="text-brand-primary"
          />
        ),
        bg: "bg-brand-primary/10 border-brand-primary/20",
      };
  }
}

// ---------------------------------------------------------------------------
// PERSONAL NOTIFICATIONS — wewnętrzna sekcja u góry karty
// ---------------------------------------------------------------------------

const PERSONAL_ACCENT: Record<
  PersonalNotificationType,
  {
    icon: React.ComponentType<{
      size?: number;
      weight?: "duotone" | "fill" | "bold";
    }>;
    ring: string;
    iconColor: string;
  }
> = {
  PAYMENT: { icon: Wallet, ring: "ring-emerald-200/60", iconColor: "text-emerald-600" },
  HEALTH: { icon: Heart, ring: "ring-rose-200/60", iconColor: "text-rose-600" },
  SPA: { icon: Sparkle, ring: "ring-purple-200/60", iconColor: "text-purple-600" },
  BOOKING: { icon: Tag, ring: "ring-sky-200/60", iconColor: "text-sky-600" },
  SUCCESS: { icon: Sparkle, ring: "ring-emerald-200/60", iconColor: "text-emerald-600" },
  WARNING: { icon: Bell, ring: "ring-amber-200/60", iconColor: "text-amber-600" },
  SYSTEM: { icon: Bell, ring: "ring-brand-primary/30", iconColor: "text-brand-primary" },
  INFO: { icon: Bell, ring: "ring-brand-primary/30", iconColor: "text-brand-primary" },
};

const STRIP_CONTAINER_VARIANTS = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } },
};

const STRIP_ITEM_VARIANTS = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0, transition: { duration: 0.25 } },
};

interface PersonalNotificationsSectionProps {
  notifications: PersonalNotificationItem[];
}

const PersonalNotificationsSection = memo(function PersonalNotificationsSection({
  notifications,
}: PersonalNotificationsSectionProps) {
  if (notifications.length === 0) return null;

  return (
    <motion.div
      variants={STRIP_CONTAINER_VARIANTS}
      initial="hidden"
      animate="show"
      className="relative mb-6 pb-6 border-b border-brand-secondary/10"
    >
      <div className="flex items-center gap-2 mb-3">
        <Bell size={14} weight="fill" className="text-brand-primary" />
        <p className="text-[11px] font-bold uppercase tracking-widest text-brand-primary">
          Twoje powiadomienia
        </p>
      </div>

      <div className="flex flex-col gap-2">
        {notifications.map((notif) => {
          const accent = PERSONAL_ACCENT[notif.type] ?? PERSONAL_ACCENT.INFO;
          const Icon = accent.icon;
          const Wrapper: React.ElementType = notif.link ? Link : "div";
          const wrapperProps = notif.link
            ? { href: notif.link }
            : ({} as Record<string, never>);

          return (
            <motion.div key={notif.id} variants={STRIP_ITEM_VARIANTS}>
              <Wrapper
                {...wrapperProps}
                className={`group flex items-center gap-3 p-3 pr-4 bg-white/80 backdrop-blur-xl border border-white/60 rounded-2xl ring-1 ${accent.ring} shadow-[0_4px_14px_-8px_rgba(3,63,99,0.15)] transition hover:bg-white hover:shadow-[0_8px_20px_-10px_rgba(3,63,99,0.22)]`}
              >
                <div
                  className={`w-9 h-9 rounded-xl bg-white shadow-sm flex items-center justify-center shrink-0 ${accent.iconColor}`}
                >
                  <Icon size={16} weight="duotone" />
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-bold text-brand-secondary leading-tight truncate">
                    {notif.title}
                  </p>
                  {notif.message && (
                    <p className="text-[12px] text-brand-secondary/65 mt-0.5 truncate">
                      {notif.message}
                    </p>
                  )}
                </div>

                {!notif.isRead && (
                  <span
                    aria-label="Nieprzeczytane"
                    className="w-2 h-2 rounded-full bg-brand-primary shadow-[0_0_8px_rgba(40,125,136,0.6)] shrink-0"
                  />
                )}

                {notif.link && (
                  <ArrowUpRight
                    size={16}
                    weight="bold"
                    className="text-brand-secondary/40 group-hover:text-brand-primary transition shrink-0"
                  />
                )}
              </Wrapper>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
});

// ---------------------------------------------------------------------------
// GŁÓWNY KOMPONENT
// ---------------------------------------------------------------------------

interface DashboardNewsProps {
  updates?: SystemUpdateItem[];
  personalNotifications?: PersonalNotificationItem[];
}

export default function DashboardNews({
  updates = [],
  personalNotifications = [],
}: DashboardNewsProps) {
  const visibleNotifications = useMemo<PersonalNotificationItem[]>(() => {
    if (personalNotifications.length === 0) return [];
    return [...personalNotifications]
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      )
      .slice(0, PERSONAL_NOTIFICATIONS_VISIBLE);
  }, [personalNotifications]);

  return (
    <div className="relative h-full isolate overflow-hidden rounded-[32px]">
      {/* --- GŁÓWNY BRAND PRIMARY REAR GLOW --- */}
      <div
        className="pointer-events-none absolute -inset-6 bg-gradient-to-br from-brand-primary/40 via-brand-primary/10 to-brand-primary/5 blur-[100px] rounded-full animate-pulse-slow"
        style={{ animationDuration: "6s" }}
      />

      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, delay: 0.25 }}
        className="relative rounded-[32px] bg-white/60 backdrop-blur-3xl border border-white/10 shadow-[0_25px_80px_-15px_rgba(3,63,99,0.2)] p-6 lg:p-7 overflow-hidden h-full z-10"
      >
        {/* Dekoracyjny glow w rogu (wewnątrz) */}
        <div className="absolute -top-16 -right-16 w-44 h-44 rounded-full bg-brand-primary/15 blur-3xl pointer-events-none" />

        {/* HEADER SEKCJI */}
        <div className="relative flex items-center gap-3.5 mb-7">
          <div className="w-12 h-12 rounded-2xl bg-brand-primary/10 text-brand-primary flex items-center justify-center shadow-[inset_0_2px_12px_-2px_rgba(3,63,99,0.1)]">
            <Megaphone size={22} weight="duotone" />
          </div>
          <div>
            <h3 className="font-jakarta font-bold text-[16px] lg:text-[17px] text-brand-secondary tracking-tight">
              Aktualności
            </h3>
            <p className="text-[12px] text-brand-secondary/60">
              Wiadomości i aktualizacje od nas
            </p>
          </div>
        </div>

        {/* PERSONALNE POWIADOMIENIA — widoczne tylko gdy są */}
        <PersonalNotificationsSection notifications={visibleNotifications} />

        {/* LISTA AKTUALNOŚCI LUB PUSTY STAN */}
        <div className="relative flex flex-col gap-4.5">
          {updates.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center bg-white/30 rounded-3xl border border-white/40 border-dashed">
              <Info
                size={32}
                weight="duotone"
                className="text-brand-secondary/30 mb-2"
              />
              <p className="text-[13px] font-bold text-brand-secondary/70">
                Brak nowych wiadomości
              </p>
              <p className="text-[11px] text-brand-secondary/50 mt-1">
                Gdy tylko pojawi się coś nowego, damy Ci znać!
              </p>
            </div>
          ) : (
            updates.map((item) => {
              const style = getUpdateStyling(item.type);
              const isLink = !!item.link;

              const CardContent = (
                <div className="group flex gap-4 p-4 rounded-3xl bg-gradient-to-br from-white via-white/80 to-white/60 hover:bg-white/100 border border-transparent hover:border-gray-50 transition-all duration-300 shadow-[0_12px_25px_-5px_rgba(0,0,0,0.08)] hover:shadow-[0_18px_35px_-8px_rgba(0,0,0,0.12)] relative">
                  {isLink && (
                    <div className="absolute top-4 right-4 text-gray-300 group-hover:text-brand-primary transition-colors">
                      <ArrowUpRight size={14} weight="bold" />
                    </div>
                  )}

                  <div
                    className={`shrink-0 w-10 h-10 rounded-2xl flex items-center justify-center group-hover:scale-105 transition-transform duration-300 border ${style.bg}`}
                  >
                    {style.icon}
                  </div>

                  <div className="flex flex-col flex-1 pr-3">
                    <div className="flex items-center justify-between gap-3 mb-1.5">
                      <h4 className="font-jakarta font-semibold text-[13.5px] lg:text-[14px] text-brand-secondary leading-snug tracking-tight">
                        {item.title}
                      </h4>
                      <span className="shrink-0 text-[10px] font-bold uppercase tracking-wider text-brand-secondary/40 font-montserrat">
                        {formatRelativeDate(item.createdAt)}
                      </span>
                    </div>
                    <p className="text-[12px] lg:text-[12.5px] text-brand-secondary/80 leading-relaxed font-montserrat line-clamp-2">
                      {item.description}
                    </p>
                  </div>
                </div>
              );

              return isLink ? (
                <Link
                  key={item.id}
                  href={item.link as string}
                  target={item.link?.startsWith("http") ? "_blank" : "_self"}
                >
                  {CardContent}
                </Link>
              ) : (
                <React.Fragment key={item.id}>{CardContent}</React.Fragment>
              );
            })
          )}
        </div>
      </motion.section>
    </div>
  );
}
