"use client";

import React from "react";
import Link from "next/link";
import { Eye, Pencil, CheckCircle } from "@phosphor-icons/react/dist/ssr";
import { Button } from "@/components/ui/Button";

interface SummarySidebarProps {
  id: string;
  isPublishing: boolean;
  onPreview: () => void;
  onPublish: () => void;
}

export default function SummarySidebar({
  id,
  isPublishing,
  onPreview,
  onPublish,
}: SummarySidebarProps) {
  return (
    <div className="flex flex-col gap-5 lg:sticky lg:top-6 animate-in fade-in duration-300">
      <div className="bg-white rounded-[24px] p-5 border border-gray-100 shadow-[0_4px_20px_rgba(0,0,0,0.02)] flex flex-col gap-4">
        <div>
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
            Status obiektu
          </span>
          <div className="flex items-center gap-2 mt-1">
            <span className="w-2.5 h-2.5 rounded-full bg-orange-400 animate-pulse" />
            <span className="font-montserrat font-bold text-sm text-[#0B3B4C] uppercase tracking-wide">
              Szkic w kreatorze
            </span>
          </div>
        </div>

        <div className="w-full h-px bg-gray-100 my-1" />

        <div className="flex flex-col gap-2">
          <Button
            onClick={onPreview}
            variant="secondary"
            className="w-full justify-center text-sm font-semibold"
            leftIcon={<Eye size={18} />}
          >
            Podgląd na żywo
          </Button>
          <Link
            href={`/admin/campy/dodaj/edytor-tresci?id=${id}`}
            className="w-full"
          >
            <Button
              variant="secondary"
              className="w-full justify-center text-sm font-semibold border-gray-200"
              leftIcon={<Pencil size={18} />}
            >
              Cofnij do edytora
            </Button>
          </Link>
        </div>

        <div className="w-full h-px bg-gray-100 my-1" />

        <Button
          onClick={onPublish}
          isLoading={isPublishing}
          disabled={isPublishing}
          className="w-full justify-center text-sm font-bold shadow-[0_4px_20px_rgba(40,125,136,0.3)] hover:shadow-[0_6px_25px_rgba(40,125,136,0.4)]"
          rightIcon={<CheckCircle size={18} weight="bold" />}
        >
          Zatwierdź i opublikuj
        </Button>
      </div>
    </div>
  );
}
