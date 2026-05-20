import { cn } from "@/lib/utils";
import React from "react";

type TooltipPosition = "top" | "bottom" | "left" | "right";

interface TooltipProps {
  children: React.ReactNode;
  content: React.ReactNode;
  className?: string;
  position?: TooltipPosition;
  forceOpen?: boolean; // <-- Dodano nowy opcjonalny prop
}

export function Tooltip({
  children,
  content,
  className,
  position = "top",
  forceOpen = false, // <-- Dodano obsługę
}: TooltipProps) {
  // Mapowanie pozycji całego kontenera względem elementu (dziecka)
  const positionClasses = {
    top: "bottom-full mb-2 flex-col",
    bottom: "top-full mt-2 flex-col-reverse",
    left: "right-full mr-2 flex-row",
    right: "left-full ml-2 flex-row-reverse",
  };

  // Mapowanie marginesu strzałki, żeby idealnie wchodziła w główny dymek
  const arrowClasses = {
    top: "-mt-1",
    bottom: "-mb-1",
    left: "-ml-1",
    right: "-mr-1",
  };

  return (
    <div className="group/tooltip relative flex items-center justify-center">
      {children}
      {/* Ciało Tooltipa */}
      <div
        className={cn(
          "absolute w-max max-w-[220px] items-center z-[100] animate-in fade-in zoom-in-95 duration-200",
          positionClasses[position],
          className,
          // Jeśli forceOpen jest prawdą, wymuszamy flex, jeśli nie - korzystamy z klasycznego hovera
          forceOpen ? "flex" : "hidden group-hover/tooltip:flex",
        )}
      >
        <div className="bg-[#0B3B4C] text-white text-[11px] font-medium px-3 py-1.5 rounded-md shadow-lg text-center leading-relaxed relative z-10">
          {content}
        </div>
        {/* Mały trójkącik pod spodem */}
        <div
          className={cn(
            "w-2 h-2 bg-[#0B3B4C] rotate-45 z-0",
            arrowClasses[position],
          )}
        ></div>
      </div>
    </div>
  );
}
