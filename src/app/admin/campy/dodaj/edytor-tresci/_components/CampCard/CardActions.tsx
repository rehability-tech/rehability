"use client";

import Link from "next/link";
import {
  CaretRight,
  PencilSimple,
  Trash,
} from "@phosphor-icons/react/dist/ssr";
import { Camp } from "@/generated/prisma";
import { Tooltip } from "@/components/ui/ToolTip";
import { StatusChangeMenu } from "./StatusChangeMenu";

interface CardActionsProps {
  camp: Camp;
  confirmedStatus: string;
  canPublish: boolean;
  isUpdating: boolean;
  onChangeStatus?: (newStatus: string) => void;
}

export function CardActions({
  camp,
  confirmedStatus,
  canPublish,
  isUpdating,
  onChangeStatus,
}: CardActionsProps) {
  return (
    <div className="flex items-center gap-2 pt-4 lg:pt-0 border-t border-gray-100 lg:border-t-0 justify-end shrink-0">
      <div className="flex items-center gap-1 mr-2">
        {onChangeStatus && (
          <StatusChangeMenu
            currentStatus={confirmedStatus}
            canPublish={canPublish}
            isUpdating={isUpdating}
            onChange={onChangeStatus}
          />
        )}

        <Tooltip content="Edytuj dane wyjazdu" position="top">
          <Link
            href={`/admin/campy/dodaj/${camp.lastStage}?id=${camp.id}`}
            className={`hidden md:block ${isUpdating ? "pointer-events-none" : ""}`}
            aria-label="Edytuj dane wyjazdu"
          >
            <button
              disabled={isUpdating}
              className="p-2 text-gray-400 hover:text-brand-primary hover:bg-brand-primary/10 rounded-[10px] transition-colors cursor-pointer block disabled:cursor-not-allowed"
            >
              <PencilSimple size={18} weight="bold" />
            </button>
          </Link>
        </Tooltip>

        <Tooltip content="Usuń wyjazd z bazy" position="top">
          <button
            disabled={isUpdating}
            className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-[10px] transition-colors cursor-pointer block disabled:cursor-not-allowed"
          >
            <Trash size={18} weight="bold" />
          </button>
        </Tooltip>
      </div>

      <Link
        href={`/admin/campy/${camp.id}`}
        className={isUpdating ? "pointer-events-none" : ""}
      >
        <button
          disabled={isUpdating}
          className="flex items-center gap-1.5 px-6 py-2.5 bg-brand-primary text-white hover:bg-[#0B3B4C] font-semibold text-[13px] rounded-full rounded-tr-none transition-all duration-300 cursor-pointer shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Zarządzaj
          <CaretRight size={14} weight="bold" />
        </button>
      </Link>
    </div>
  );
}
