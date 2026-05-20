import React from "react";

interface MapBlockProps {
  mapUrl?: string | null;
}

export default function MapBlock({ mapUrl }: MapBlockProps) {
  // Jeśli admin nie ustawił mapy, w ogóle jej nie wyświetlamy
  if (!mapUrl) return null;

  return (
    <div className="w-full flex flex-col">
      <div className="w-full aspect-[21/9] min-h-[350px] md:min-h-[450px] rounded-[24px] overflow-hidden relative shadow-lg bg-gray-50">
        <iframe
          src={mapUrl}
          width="100%"
          height="100%"
          style={{ border: 0 }}
          allowFullScreen
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          className="absolute inset-0"
        />
      </div>
    </div>
  );
}
