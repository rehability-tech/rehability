import React from "react";

const getYoutubeId = (url: string): string | null => {
  const regExp =
    /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  return match && match[2].length === 11 ? match[2] : null;
};

export default function VideoEmbedBlock({ content }: { content: any }) {
  if (!content?.url) return null;

  const videoId = getYoutubeId(content.url);
  const embedUrl = videoId
    ? `https://www.youtube-nocookie.com/embed/${videoId}?rel=0`
    : content.url;

  return (
    <div className="relative w-full aspect-video rounded-2xl overflow-hidden bg-gray-900 border-2 border-gray-100 shadow-lg">
      <iframe
        src={embedUrl}
        title="Video Embed"
        loading="lazy"
        className="absolute top-0 left-0 w-full h-full"
        allowFullScreen
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
      />
    </div>
  );
}
