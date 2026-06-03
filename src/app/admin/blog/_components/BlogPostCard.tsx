"use client";

import React, { useRef, useState, useEffect } from "react";
import Link from "next/link";
import {
  PencilSimple,
  Trash,
  ArrowsLeftRight,
  CheckCircle,
  FileDashed,
  Archive,
  LockKey,
  Warning,
  ArticleMedium,
} from "@phosphor-icons/react/dist/ssr";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Tooltip } from "@/components/ui/ToolTip";
import { toast } from "sonner";
import { format } from "date-fns";
import { pl } from "date-fns/locale";

// ==========================================
// TYPY
// ==========================================
export interface BlogPostData {
  id: string;
  title: string;
  slug: string;
  excerpt?: string | null;
  coverImage?: string | null;
  category: string;
  tags: string[];
  author: string;
  readTime?: number | null;
  status: string;
  publishedAt?: string | null;
  lastStage: string;
  createdAt: string;
  updatedAt: string;
  metaTitle?: string | null;
  metaDescription?: string | null;
  focusKeyword?: string | null;
  noIndex: boolean;
}

// ==========================================
// STATUS BADGE
// ==========================================
const getStatusBadge = (status: string) => {
  const base = "px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-white shadow-sm rounded-full rounded-tr-none";
  switch (status) {
    case "PUBLISHED": return <span className={`${base} bg-emerald-500`}>Opublikowany</span>;
    case "DRAFT":     return <span className={`${base} bg-gray-400`}>Szkic</span>;
    case "ARCHIVED":  return <span className={`${base} bg-red-400`}>Archiwalny</span>;
    default:          return <span className={`${base} bg-gray-400`}>{status}</span>;
  }
};

// ==========================================
// WALIDACJA SEO (gotowość do publikacji)
// ==========================================
function getSeoIssues(post: BlogPostData): string[] {
  const issues: string[] = [];
  if (!post.metaTitle)       issues.push("Meta tytuł");
  if (!post.metaDescription) issues.push("Meta opis");
  if (!post.focusKeyword)    issues.push("Słowo kluczowe");
  if (!post.coverImage)      issues.push("Zdjęcie główne");
  if (!post.excerpt)         issues.push("Krótki opis (excerpt)");
  return issues;
}

// ==========================================
// KOMPONENT
// ==========================================
interface Props {
  post: BlogPostData;
  onChangeStatus: (id: string, status: string) => void;
  onDelete: (id: string) => void;
}

export function BlogPostCard({ post, onChangeStatus, onDelete }: Props) {
  const [confirmedStatus, setConfirmedStatus] = useState(post.status);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isStatusMenuOpen, setIsStatusMenuOpen] = useState(false);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const deleteRef = useRef<HTMLDivElement>(null);

  const seoIssues = getSeoIssues(post);
  const canPublish = seoIssues.length === 0;
  const isBusy = isUpdating || isDeleting;

  useEffect(() => {
    if (!isUpdating) setConfirmedStatus(post.status);
  }, [post.status, isUpdating]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsStatusMenuOpen(false);
      }
      if (deleteRef.current && !deleteRef.current.contains(e.target as Node)) {
        setIsConfirmingDelete(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleDelete = async () => {
    setIsConfirmingDelete(false);
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/admin/blog/${post.id}`, {
        method: "DELETE",
      });
      const result = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(result.error || "Nie udało się usunąć posta");
      toast.success("Post usunięty.");
      onDelete(post.id); // odmontowuje kartę — nie resetujemy już isDeleting
    } catch (err: any) {
      toast.error(err.message || "Błąd serwera");
      setIsDeleting(false);
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    setIsStatusMenuOpen(false);
    setIsUpdating(true);
    const prev = confirmedStatus;
    onChangeStatus(post.id, newStatus);

    const messages: Record<string, string> = {
      PUBLISHED: "Post opublikowany!",
      ARCHIVED:  "Post zarchiwizowany.",
      DRAFT:     "Post przywrócony do szkiców.",
    };

    try {
      const res = await fetch("/api/admin/blog/status", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: post.id, status: newStatus }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Błąd zmiany statusu");
      setConfirmedStatus(newStatus);
      toast.success(messages[newStatus] || "Status zmieniony!");
    } catch (err: any) {
      toast.error(err.message || "Błąd serwera");
      onChangeStatus(post.id, prev);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.97 }}
      className={cn(
        "group bg-white/70 backdrop-blur-xl rounded-3xl rounded-tr-none p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-5 relative border transition-all duration-300",
        "border-white/60 shadow-[0_10px_40px_-15px_rgba(3,63,99,0.12)] hover:shadow-[0_18px_50px_-18px_rgba(40,125,136,0.28)] hover:border-brand-primary/30 hover:-translate-y-0.5",
      )}
    >
      {/* Brandowa poświata w tle (przyklejona do kształtu kropli) */}
      <div className="absolute inset-0 -z-10 rounded-3xl rounded-tr-none overflow-hidden pointer-events-none">
        <div className="absolute -bottom-10 -right-6 w-36 h-36 bg-brand-yellow/15 rounded-full blur-2xl opacity-70 group-hover:opacity-100 transition-opacity duration-500" />
        <div className="absolute -top-12 left-1/4 w-32 h-32 bg-brand-primary/5 rounded-full blur-2xl" />
      </div>

      {/* Shimmer aktualizacji */}
      {isBusy && (
        <div className="absolute inset-0 z-50 bg-white/50 backdrop-blur-[2px] rounded-3xl rounded-tr-none overflow-hidden pointer-events-none">
          <motion.div
            className="w-full h-full bg-gradient-to-r from-transparent via-white/80 to-transparent"
            animate={{ x: ["-100%", "100%"] }}
            transition={{ repeat: Infinity, duration: 1.2, ease: "linear" }}
          />
        </div>
      )}

      {/* SEO warning badge */}
      {!canPublish && (
        <div className="absolute -top-3 -right-3 z-10">
          <Tooltip
            content={
              <div className="flex flex-col gap-1 text-left p-1">
                <span className="font-semibold border-b border-white/20 pb-1 mb-1">Brakuje do SEO:</span>
                <ul className="list-disc pl-4 space-y-0.5">
                  {seoIssues.map((issue, i) => <li key={i}>{issue}</li>)}
                </ul>
              </div>
            }
            position="left"
          >
            <div className="w-8 h-8 bg-white border border-gray-200 rounded-full flex items-center justify-center text-amber-500 shadow-sm cursor-help hover:bg-gray-50 transition-colors">
              <Warning size={16} weight="bold" />
            </div>
          </Tooltip>
        </div>
      )}

      {/* Lewa część: miniatura + dane */}
      <div className="flex-1 flex gap-4 items-center">
        {/* Miniatura */}
        <div className="hidden sm:flex items-center justify-center w-[84px] min-w-[84px] h-[84px] shrink-0 rounded-2xl rounded-tr-none border border-white/60 overflow-hidden shadow-[0_6px_18px_-8px_rgba(3,63,99,0.25)]">
          {post.coverImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={post.coverImage} alt={post.title} className="w-full h-full object-cover" />
          ) : (
            <div className="relative w-full h-full flex items-center justify-center bg-gradient-to-br from-brand-primary to-brand-secondary text-white/90 overflow-hidden">
              <div className="absolute -bottom-3 -right-2 w-12 h-12 bg-brand-yellow/40 rounded-full blur-lg pointer-events-none" />
              <ArticleMedium size={30} weight="duotone" className="relative z-10" />
            </div>
          )}
        </div>

        <div className="flex flex-col gap-1.5 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            {getStatusBadge(confirmedStatus)}
            <span className="text-[11px] font-semibold font-montserrat text-brand-primary bg-brand-primary/10 px-2 py-0.5 rounded-full">
              {post.category}
            </span>
            {post.noIndex && (
              <span className="text-[11px] font-semibold font-montserrat text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                noindex
              </span>
            )}
          </div>

          <h3 className="font-jakarta font-bold text-brand-secondary text-[18px] leading-tight line-clamp-1 group-hover:text-brand-primary transition-colors duration-300">
            {post.title}
          </h3>

          <div className="flex flex-wrap items-center gap-3 text-[12px] font-montserrat text-gray-400">
            <span className="text-gray-500 font-medium">/{post.slug}</span>
            <span>·</span>
            <span>{post.author}</span>
            {post.readTime && (
              <>
                <span>·</span>
                <span>{post.readTime} min czytania</span>
              </>
            )}
            {post.publishedAt && confirmedStatus === "PUBLISHED" && (
              <>
                <span>·</span>
                <span>{format(new Date(post.publishedAt), "d MMM yyyy", { locale: pl })}</span>
              </>
            )}
          </div>

          {/* SEO mini progress */}
          <div className="flex items-center gap-1.5 mt-0.5">
            {["metaTitle", "metaDescription", "focusKeyword", "coverImage", "excerpt"].map((field) => {
              const filled = Boolean(post[field as keyof BlogPostData]);
              return (
                <div
                  key={field}
                  title={field}
                  className={cn(
                    "h-1.5 w-6 rounded-full transition-colors",
                    filled ? "bg-emerald-400" : "bg-gray-200",
                  )}
                />
              );
            })}
            <span className="text-[11px] font-montserrat text-gray-400 ml-1">
              SEO {5 - seoIssues.length}/5
            </span>
          </div>
        </div>
      </div>

      {/* Przyciski akcji */}
      <div className="flex items-center gap-2 pt-4 lg:pt-0 border-t border-gray-100/80 lg:border-t-0 justify-end shrink-0">
        {/* Pigułka z ikonami akcji */}
        <div className="flex items-center gap-0.5 bg-white/60 border border-white/70 rounded-full p-1 shadow-sm">
        {/* Zmiana statusu */}
        <div className="relative" ref={menuRef}>
          <Tooltip content="Zmień status" position="top">
            <button
              disabled={isBusy}
              onClick={() => setIsStatusMenuOpen((p) => !p)}
              className={cn(
                "p-2 rounded-[10px] transition-colors cursor-pointer disabled:cursor-not-allowed",
                isStatusMenuOpen
                  ? "bg-brand-primary/10 text-brand-primary"
                  : "text-gray-400 hover:text-brand-primary hover:bg-brand-primary/10",
              )}
            >
              <ArrowsLeftRight size={18} weight="bold" />
            </button>
          </Tooltip>

          <AnimatePresence>
            {isStatusMenuOpen && (
              <motion.div
                initial={{ opacity: 0, y: 5, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 5, scale: 0.95 }}
                className="absolute bottom-full right-1/2 translate-x-1/2 mb-2 w-44 bg-white/90 backdrop-blur-xl rounded-2xl rounded-tr-none shadow-[0_12px_36px_-12px_rgba(3,63,99,0.28)] border border-white/60 py-2 z-50 flex flex-col overflow-hidden"
              >
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider px-4 py-1 mb-1 border-b border-gray-50">
                  Ustaw status
                </span>
                <button
                  onClick={() => handleStatusChange("PUBLISHED")}
                  disabled={confirmedStatus === "PUBLISHED" || isUpdating || !canPublish}
                  className="flex items-center gap-2 px-4 py-2.5 text-[13px] font-semibold text-gray-700 hover:bg-emerald-50 hover:text-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors w-full"
                >
                  {!canPublish ? <LockKey size={16} weight="bold" /> : <CheckCircle size={16} weight="bold" />}
                  Opublikowany
                </button>
                <button
                  onClick={() => handleStatusChange("DRAFT")}
                  disabled={confirmedStatus === "DRAFT" || isUpdating}
                  className="flex items-center gap-2 px-4 py-2.5 text-[13px] font-semibold text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors w-full"
                >
                  <FileDashed size={16} weight="bold" />
                  Szkic
                </button>
                <button
                  onClick={() => handleStatusChange("ARCHIVED")}
                  disabled={confirmedStatus === "ARCHIVED" || isUpdating}
                  className="flex items-center gap-2 px-4 py-2.5 text-[13px] font-semibold text-gray-700 hover:bg-red-50 hover:text-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors w-full"
                >
                  <Archive size={16} weight="bold" />
                  Archiwalny
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <Tooltip content="Edytuj post" position="top">
          <Link
            href={`/admin/blog/dodaj/${post.lastStage}?id=${post.id}`}
            className={isBusy ? "pointer-events-none" : ""}
          >
            <button
              disabled={isBusy}
              className="p-2 text-gray-400 hover:text-brand-primary hover:bg-brand-primary/10 rounded-[10px] transition-colors cursor-pointer disabled:cursor-not-allowed"
            >
              <PencilSimple size={18} weight="bold" />
            </button>
          </Link>
        </Tooltip>

        {/* Usuwanie — z popoverem potwierdzenia (operacja nieodwracalna) */}
        <div className="relative" ref={deleteRef}>
          <Tooltip content="Usuń post" position="top">
            <button
              disabled={isBusy}
              onClick={() => setIsConfirmingDelete((p) => !p)}
              className={cn(
                "p-2 rounded-[10px] transition-colors cursor-pointer disabled:cursor-not-allowed",
                isConfirmingDelete
                  ? "bg-red-50 text-red-500"
                  : "text-gray-400 hover:text-red-500 hover:bg-red-50",
              )}
            >
              <Trash size={18} weight="bold" />
            </button>
          </Tooltip>

          <AnimatePresence>
            {isConfirmingDelete && (
              <motion.div
                initial={{ opacity: 0, y: 5, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 5, scale: 0.95 }}
                className="absolute bottom-full right-1/2 translate-x-1/2 mb-2 w-52 bg-white/95 backdrop-blur-xl rounded-2xl rounded-tr-none shadow-[0_12px_36px_-12px_rgba(3,63,99,0.28)] border border-white/60 p-3 z-50 flex flex-col gap-2"
              >
                <p className="text-[12px] font-montserrat text-gray-600 leading-snug px-1">
                  Usunąć ten post na stałe? Tej operacji nie da się cofnąć.
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setIsConfirmingDelete(false)}
                    className="flex-1 px-3 py-2 text-[12.5px] font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
                  >
                    Anuluj
                  </button>
                  <button
                    onClick={handleDelete}
                    className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-[12.5px] font-semibold text-white bg-red-500 hover:bg-red-600 rounded-xl transition-colors"
                  >
                    <Trash size={14} weight="bold" />
                    Usuń
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        </div>

        <Link href={`/blog/${post.slug}`} target="_blank">
          <button
            disabled={confirmedStatus !== "PUBLISHED" || isBusy}
            className="flex items-center gap-1.5 px-5 py-2.5 bg-brand-primary text-white hover:bg-[#0B3B4C] font-semibold text-[13px] rounded-full rounded-tr-none transition-all cursor-pointer shadow-md disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Podgląd
          </button>
        </Link>
      </div>
    </motion.div>
  );
}
