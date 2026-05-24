"use client";

import { Image as ImageIcon } from "@phosphor-icons/react/dist/ssr";
import { cn } from "@/lib/utils";

interface CampThumbnailProps {
  src?: string | null;
  alt: string;
  canDrag: boolean;
}

export function CampThumbnail({ src, alt, canDrag }: CampThumbnailProps) {
  return (
    <div className="hidden sm:flex flex-col items-center justify-center w-[80px] min-w-[80px] h-[80px] shrink-0 bg-gray-50 rounded-[14px] border border-gray-100 overflow-hidden relative">
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt={alt}
          className={cn(
            "w-full h-full object-cover transition-transform",
            canDrag && "group-hover:scale-105",
          )}
        />
      ) : (
        <div className="flex flex-col items-center justify-center text-gray-300">
          <ImageIcon size={26} weight="duotone" />
        </div>
      )}
    </div>
  );
}
