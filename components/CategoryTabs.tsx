"use client";

import { useState } from "react";
import type { CardProduct } from "@/lib/card";
import ProductCard from "./ProductCard";

/**
 * Only the active grid is ever rendered. The alternative — pre-rendering all
 * eight panels and hiding seven — put 64 cards into both the HTML and the
 * hydration payload for eight that anyone sees.
 */
export default function CategoryTabs({
  groups,
}: {
  groups: { name: string; count: number; products: CardProduct[] }[];
}) {
  const [active, setActive] = useState(0);

  return (
    <>
      <div className="cat-bar" role="tablist" aria-label="Product categories">
        {groups.map((g, i) => (
          <button
            key={g.name}
            className={`pill${i === active ? " is-on" : ""}`}
            type="button"
            role="tab"
            aria-selected={i === active}
            onClick={() => setActive(i)}
          >
            {g.name}<span className="pill__c">{g.count}</span>
          </button>
        ))}
      </div>

      <div className="pgrid pgrid--home" role="tabpanel">
        {groups[active].products.map((p, i) => (
          <ProductCard
            key={p.sno}
            p={p}
            index={i}
            priority={active === 0 && i < 4}
            sizes="(max-width: 560px) 92vw, (max-width: 980px) 45vw, 23vw"
          />
        ))}
      </div>
    </>
  );
}
