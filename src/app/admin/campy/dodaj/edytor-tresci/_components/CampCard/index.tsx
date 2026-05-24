"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { Camp } from "@/generated/prisma";
import { validateCampCompleteness } from "@/lib/camps/validateCampCompleteness";

import { CardShimmer } from "./CardShimmer";
import { PublishWarning } from "./PublishWarning";
import { UnfeatureButton } from "./UnfeatureButton";
import { DragHandle } from "./DragHandle";
import { CampThumbnail } from "./CampThumbnail";
import { CampInfo } from "./CampInfo";
import { CapacityBar } from "./CapacityBar";
import { CardActions } from "./CardActions";

interface CampCardProps {
  camp: Camp;
  isFeaturedZone?: boolean;
  onDragStart?: (e: React.DragEvent<HTMLDivElement>, id: string) => void;
  onUnfeature?: (id: string) => void;
  onChangeStatus?: (id: string, newStatus: string) => void;
  unfeatureTooltipPosition?: "top" | "bottom" | "left" | "right";
}

export function CampCard({
  camp,
  isFeaturedZone,
  onDragStart,
  onUnfeature,
  onChangeStatus,
  unfeatureTooltipPosition = "left",
}: CampCardProps) {
  const [isUpdating, setIsUpdating] = useState(false);
  const [confirmedStatus, setConfirmedStatus] = useState(camp.status);

  const isDraft = confirmedStatus === "DRAFT";
  const canDrag = !isFeaturedZone && !isDraft;
  const enrolled = 0; // Docelowo z bazy

  const { isComplete: canPublish, missing: missingFields } =
    validateCampCompleteness(camp);

  useEffect(() => {
    if (!isUpdating) setConfirmedStatus(camp.status);
  }, [camp.status, isUpdating]);

  const handleStatusChange = async (newStatus: string) => {
    setIsUpdating(true);
    const previousStatus = confirmedStatus;

    if (onChangeStatus) {
      onChangeStatus(camp.id, newStatus);
    }

    const statusMessages: Record<string, string> = {
      PUBLISHED: "Wyjazd został pomyślnie opublikowany!",
      ARCHIVED: "Wyjazd został zarchiwizowany (zakończony).",
      DRAFT: "Wyjazd przywrócono do szkiców.",
    };

    try {
      const response = await fetch("/api/admin/campy/status", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: camp.id, status: newStatus }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Błąd podczas zmiany statusu");
      }

      setConfirmedStatus(newStatus);
      toast.success(statusMessages[newStatus] || "Status zmieniony!");
    } catch (error: any) {
      toast.error(
        error.message || "Wystąpił błąd serwera. Przywracam poprzedni status.",
      );
      if (onChangeStatus) {
        onChangeStatus(camp.id, previousStatus);
      }
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      draggable={canDrag}
      onDragStart={(e) =>
        canDrag &&
        onDragStart &&
        onDragStart(e as unknown as React.DragEvent<HTMLDivElement>, camp.id)
      }
      className={cn(
        "bg-white rounded-[20px] p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-6 transition-all group relative border",
        isFeaturedZone
          ? "border-transparent shadow-[0_8px_30px_rgba(40,125,136,0.3)]"
          : isDraft
            ? "border-gray-100 shadow-[0_4px_20px_rgba(0,0,0,0.2)] opacity-95"
            : "border-gray-100 shadow-[0_4px_20px_rgba(0,0,0,0.2)] hover:shadow-[0_8px_30px_rgba(40,125,136,0.36)] hover:border-brand-primary/20 cursor-grab active:cursor-grabbing",
      )}
    >
      {isUpdating && <CardShimmer />}

      {!canPublish && (
        <PublishWarning
          missingFields={missingFields}
          isFeaturedZone={isFeaturedZone}
          hasUnfeatureButton={Boolean(onUnfeature)}
        />
      )}

      {isFeaturedZone && onUnfeature && (
        <UnfeatureButton
          onUnfeature={() => onUnfeature(camp.id)}
          disabled={isUpdating}
          tooltipPosition={unfeatureTooltipPosition}
        />
      )}

      <div className="flex-1 flex gap-4 items-center">
        {!isFeaturedZone && <DragHandle isDraft={isDraft} />}

        <CampThumbnail
          src={camp.heroImage}
          alt={camp.title}
          canDrag={canDrag}
        />

        <CampInfo
          camp={camp}
          confirmedStatus={confirmedStatus}
          isFeaturedZone={isFeaturedZone}
        />
      </div>

      <CapacityBar enrolled={enrolled} capacity={camp.capacity} />

      <CardActions
        camp={camp}
        confirmedStatus={confirmedStatus}
        canPublish={canPublish}
        isUpdating={isUpdating}
        onChangeStatus={
          onChangeStatus ? (newStatus) => handleStatusChange(newStatus) : undefined
        }
      />
    </motion.div>
  );
}
