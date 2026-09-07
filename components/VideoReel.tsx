"use client";

import CloudImage from "./CloudImage";
import { useState } from "react";

const SRC = "https://player.vimeo.com/video/1000663654?h=2a8118c676";

/** The iframe is only created on click — no third-party frame on first load. */
export default function VideoReel() {
  const [playing, setPlaying] = useState(false);

  return (
    <div className={`reel tone-night${playing ? " is-playing" : ""}`} data-reveal="scale">
      {playing ? (
        <iframe
          src={`${SRC}&autoplay=1`}
          title="Sankamithra Fireworks factory tour"
          allow="autoplay; fullscreen; picture-in-picture"
          allowFullScreen
        />
      ) : (
        <>
          <div className="reel__poster">
            <CloudImage id="sankamithra/site/factory" alt="" fill sizes="(max-width: 900px) 100vw, 1200px" maxWidth={1600} />
          </div>
          <button className="reel__play" type="button" aria-label="Play the factory tour" onClick={() => setPlaying(true)}>
            <svg width="26" height="30" viewBox="0 0 24 28" fill="currentColor"><path d="M23 14L0 28V0z" /></svg>
          </button>
          <div className="reel__cap">
            <h3>Inside the blast zone</h3>
            <p>Two minutes on the floor — mixing, rolling, drying, testing.</p>
          </div>
        </>
      )}
    </div>
  );
}
