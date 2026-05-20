import React from "react";

export default function VideoEmbedBlock({ content }: { content: any }) {
  if (!content?.url) return null;

  return (
    <div className="max-w-4xl mx-auto px-4 w-full my-10">
      <div className="relative w-full rounded-3xl overflow-hidden shadow-2xl aspect-video bg-black/5 border border-gray-100">
        <iframe
          src={content.url}
          title="Video Embed"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="absolute top-0 left-0 w-full h-full border-0"
        />
      </div>
    </div>
  );
}
