import type { CardProduct } from "@/lib/card";
import ProductCard from "./ProductCard";
import { Box } from "./Icons";

export default function ProductGrid({
  products,
  className = "pgrid",
  priorityCount = 0,
  sizes,
  empty,
}: {
  products: CardProduct[];
  className?: string;
  /** how many images to fetch eagerly — the ones above the fold */
  priorityCount?: number;
  sizes?: string;
  empty?: { title: string; text: string };
}) {
  if (!products.length) {
    return (
      <div className={className}>
        <div className="empty">
          <Box />
          <h3>{empty?.title ?? "Nothing here yet"}</h3>
          <p>{empty?.text ?? "Try a different category or clear your search."}</p>
        </div>
      </div>
    );
  }
  return (
    <div className={className}>
      {products.map((p, i) => (
        <ProductCard key={p.sno} p={p} index={i} priority={i < priorityCount} sizes={sizes} />
      ))}
    </div>
  );
}
