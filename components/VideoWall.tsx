"use client";

import { useState } from "react";
import type { Video } from "@/lib/videos";

/**
 * Filters the pre-rendered cards rather than re-rendering them, so the video
 * data never crosses into the client bundle — the cards arrive as HTML from
 * the server and this only toggles which are shown.
 */
export default function VideoWall({
  filters,
  cards,
  keys,
}: {
  filters: { id: string; label: string; count: number }[];
  cards: React.ReactNode[];
  /** filter id each card belongs to, same order as `cards` */
  keys: string[][];
}) {
  const [active, setActive] = useState("all");
  const shown = keys.map((k) => active === "all" || k.includes(active));

  return (
    <>
      <div className="cat-bar" role="tablist" aria-label="Video categories">
        {filters.map((f) => (
          <button
            key={f.id}
            className={`pill${f.id === active ? " is-on" : ""}`}
            type="button"
            role="tab"
            aria-selected={f.id === active}
            onClick={() => setActive(f.id)}
          >
            {f.label}<span className="pill__c">{f.count}</span>
          </button>
        ))}
      </div>

      <div className="vgrid">
        {cards.map((card, i) => (
          <div key={i} hidden={!shown[i]}>{card}</div>
        ))}
      </div>
    </>
  );
}
