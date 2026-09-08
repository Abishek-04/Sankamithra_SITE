"use client";

import { useEffect, useState } from "react";
import { soundOn, subscribeSound, toggleSound } from "@/lib/firework-audio";

/**
 * Sound stays off until asked for — browsers block autoplay, and nobody should
 * get a bang they didn't request. But an unlabelled speaker among four other
 * chips reads as decoration, so this one announces itself: it carries the
 * brand gradient, says what it does, and pulses until it has been used once.
 */
export default function SoundToggle() {
  const [on, setOn] = useState(false);
  const [used, setUsed] = useState(true); // assume used until we know otherwise

  useEffect(() => {
    setOn(soundOn());
    try { setUsed(localStorage.getItem("sanka-sound") !== null); } catch {}
    return subscribeSound(setOn);
  }, []);

  const click = () => {
    setUsed(true);
    void toggleSound();
  };

  return (
    <button
      className={`sound-btn${on ? " is-on" : ""}${!used ? " is-new" : ""}`}
      type="button"
      aria-pressed={on}
      aria-label={on ? "Mute firework sound" : "Turn on firework sound"}
      onClick={click}
    >
      <span className="sound-btn__ico" aria-hidden="true">
        {on ? (
          <span className="sound-btn__bars">
            <i /><i /><i /><i />
          </span>
        ) : (
          <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 9.5h3.2L12 5.4v13.2L7.2 14.5H4z" />
            <path d="M16.4 9.8l4.2 4.4M20.6 9.8l-4.2 4.4" />
          </svg>
        )}
      </span>
      <span className="sound-btn__txt">{on ? "Sound on" : "Hear the crackers"}</span>
    </button>
  );
}
