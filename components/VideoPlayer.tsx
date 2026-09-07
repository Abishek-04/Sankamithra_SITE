"use client";

import { useState } from "react";
import type { Video } from "@/lib/videos";

/**
 * A facade: the card is a static thumbnail until it is clicked, and only then
 * does a YouTube iframe get created. Embedding 30 players on load would pull
 * megabytes of third-party script and hand YouTube a cookie for every visitor
 * who never pressed play.
 *
 * youtube-nocookie.com keeps it in YouTube's no-cookie mode.
 */
export default function VideoPlayer({
  video,
  poster,
  children,
}: {
  video: Video;
  poster: React.ReactNode;
  children?: React.ReactNode;
}) {
  const [playing, setPlaying] = useState(false);

  if (playing) {
    return (
      <iframe
        className="vplay__frame"
        src={`https://www.youtube-nocookie.com/embed/${video.id}?autoplay=1&rel=0&modestbranding=1&playsinline=1`}
        title={video.title}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
        loading="lazy"
      />
    );
  }

  return (
    <button
      className="vplay"
      type="button"
      onClick={() => setPlaying(true)}
      aria-label={`Play: ${video.title}`}
    >
      {poster}
      <span className="vplay__btn" aria-hidden="true">
        <svg viewBox="0 0 24 28" fill="currentColor" width="22" height="26">
          <path d="M23 14L0 28V0z" />
        </svg>
      </span>
      {children}
    </button>
  );
}
