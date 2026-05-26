"use client";

import React from "react";
import { Info, YoutubeLogo } from "@phosphor-icons/react/dist/ssr";

// TYPOWANIE PROPSÓW
interface VideoEmbedBlockProps {
  content: any;
  onChange: (newContent: any) => void;
}

export default function VideoEmbedBlock({
  content,
  onChange,
}: VideoEmbedBlockProps) {
  const videoUrl = content?.url || "";

  const getYoutubeId = (url: string) => {
    const regExp =
      /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return match && match[2].length === 11 ? match[2] : null;
  };

  const videoId = getYoutubeId(videoUrl);

  return (
    <div className="w-full flex flex-col gap-4 bg-white p-5 md:p-6 rounded-2xl border border-gray-100 transition-colors focus-within:border-brand-primary/30 shadow-sm">
      <div className="flex flex-col gap-2">
        <label className="font-montserrat font-semibold text-[#0B3B4C] text-sm flex flex-col gap-2">
          Link do filmu na YouTube
          <input
            type="text"
            value={videoUrl}
            onChange={(e) => onChange({ url: e.target.value })}
            placeholder="np. https://youtu.be/WlxSfQVr6U8"
            className="w-full p-3.5 bg-gray-50/80 border border-gray-100 rounded-xl font-montserrat text-sm outline-none focus:border-brand-primary/30 focus:bg-white transition-all placeholder:text-gray-400 text-gray-700"
          />
        </label>

        <div className="flex items-start gap-2.5 bg-gray-50 border border-gray-100 p-3.5 rounded-xl text-[#0B3B4C]/70">
          <Info size={20} className="text-[#287D88] shrink-0 mt-0.5" />
          <p className="font-montserrat text-[13px] md:text-[14px] leading-[1.6]">
            Przed wklejeniem upewnij się, że film jest przesłany na YouTube,
            opublikowany jako{" "}
            <strong className="text-[#287D88]">publiczny</strong> lub{" "}
            <strong className="text-[#287D88]">niepubliczny</strong>.
          </p>
        </div>
      </div>

      {videoId ? (
        <div className="relative w-full aspect-video rounded-2xl overflow-hidden bg-gray-900 border-2 border-gray-100 shadow-lg mt-3">
          <iframe
            src={`https://www.youtube.com/embed/${videoId}?rel=0`}
            className="absolute top-0 left-0 w-full h-full"
            allowFullScreen
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          />
        </div>
      ) : (
        <div className="w-full aspect-video rounded-2xl bg-gray-50 border-2 border-dashed border-gray-200 flex flex-col items-center justify-center text-gray-400 gap-4 mt-3">
          <YoutubeLogo size={56} weight="duotone" className="text-gray-300" />
          <span className="font-montserrat text-sm font-medium text-center px-6">
            Wklej link YouTube, aby zobaczyć podgląd wideo
          </span>
        </div>
      )}
    </div>
  );
}
