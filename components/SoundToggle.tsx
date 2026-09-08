"use client";

import { useEffect, useState } from "react";
import { soundOn, subscribeSound, toggleSound } from "@/lib/firework-audio";

/**
 * Sound is off until asked for. Browsers block autoplay regardless, but the
 * real reason is that nobody should get a bang they didn't request. The choice
 * is remembered — and still needs one tap next visit, because a gesture is
 * required to start an AudioContext.
 */
export default function SoundToggle() {
  const [on, setOn] = useState(false);

  useEffect(() => {
    setOn(soundOn());
    return subscribeSound(setOn);
  }, []);

  return (
    <button
      className={`chip chip--sound${on ? " is-on" : ""}`}
      type="button"
      aria-pressed={on}
      aria-label={on ? "Mute firework sound" : "Play firework sound"}
      onClick={() => void toggleSound()}
    >
      <span className="chip__ico" aria-hidden="true">
        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 9.5h3.2L12 5.4v13.2L7.2 14.5H4z" />
          {on ? (
            <>
              <path d="M15.6 9.2a4 4 0 0 1 0 5.6" />
              <path d="M18.2 6.6a7.6 7.6 0 0 1 0 10.8" />
            </>
          ) : (
            <path d="M16.4 9.8l4 4.4M20.4 9.8l-4 4.4" />
          )}
        </svg>
      </span>
      {on ? "Sound on" : "Sound"}
    </button>
  );
}
