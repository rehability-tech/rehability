"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowsLeftRight,
  CheckCircle,
  FileDashed,
  Archive,
  LockKey,
} from "@phosphor-icons/react/dist/ssr";
import { cn } from "@/lib/utils";
import { Tooltip } from "@/components/ui/ToolTip";

interface StatusChangeMenuProps {
  currentStatus: string;
  canPublish: boolean;
  isUpdating: boolean;
  onChange: (newStatus: string) => void;
}

export function StatusChangeMenu({
  currentStatus,
  canPublish,
  isUpdating,
  onChange,
}: StatusChangeMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handlePick = (newStatus: string) => {
    setIsOpen(false);
    onChange(newStatus);
  };

  return (
    <div className="relative" ref={menuRef}>
      <Tooltip content="Zmień status" position="top">
        <button
          disabled={isUpdating}
          onClick={(e) => {
            e.stopPropagation();
            setIsOpen((prev) => !prev);
          }}
          className={cn(
            "p-2 rounded-[10px] transition-colors cursor-pointer block disabled:cursor-not-allowed",
            isOpen
              ? "bg-brand-primary/10 text-brand-primary"
              : "text-gray-400 hover:text-brand-primary hover:bg-brand-primary/10",
          )}
        >
          <ArrowsLeftRight size={18} weight="bold" />
        </button>
      </Tooltip>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 5, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 5, scale: 0.95 }}
            className="absolute bottom-full right-1/2 translate-x-1/2 mb-2 w-44 bg-white rounded-xl shadow-[0_4px_20px_rgba(0,0,0,0.1)] border border-gray-100 py-2 z-50 flex flex-col overflow-hidden"
          >
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider px-4 py-1 mb-1 border-b border-gray-50">
              Ustaw status
            </span>

            <button
              onClick={() => handlePick("PUBLISHED")}
              disabled={
                currentStatus === "PUBLISHED" || isUpdating || !canPublish
              }
              className="flex items-center gap-2 px-4 py-2.5 text-[13px] font-semibold text-gray-700 hover:bg-emerald-50 hover:text-emerald-600 disabled:opacity-50 disabled:bg-transparent disabled:text-gray-400 disabled:cursor-not-allowed transition-colors w-full"
            >
              {!canPublish ? (
                <LockKey size={16} weight="bold" />
              ) : (
                <CheckCircle size={16} weight="bold" />
              )}
              <span>Opublikowany</span>
            </button>

            <button
              onClick={() => handlePick("DRAFT")}
              disabled={currentStatus === "DRAFT" || isUpdating}
              className="flex items-center gap-2 px-4 py-2.5 text-[13px] font-semibold text-gray-700 hover:bg-gray-100 hover:text-gray-900 disabled:opacity-50 disabled:bg-transparent disabled:text-gray-400 disabled:cursor-not-allowed transition-colors w-full"
            >
              <FileDashed size={16} weight="bold" />
              <span>Szkic</span>
            </button>

            <button
              onClick={() => handlePick("ARCHIVED")}
              disabled={currentStatus === "ARCHIVED" || isUpdating}
              className="flex items-center gap-2 px-4 py-2.5 text-[13px] font-semibold text-gray-700 hover:bg-red-50 hover:text-red-600 disabled:opacity-50 disabled:bg-transparent disabled:text-gray-400 disabled:cursor-not-allowed transition-colors w-full"
            >
              <Archive size={16} weight="bold" />
              <span>Archiwalny</span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
