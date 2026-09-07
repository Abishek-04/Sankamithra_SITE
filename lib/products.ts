import "server-only";
import { readFileSync } from "node:fs";
import { join } from "node:path";

/** One row of the printed 2026 price list. */
export type Product = {
  sno: string;
  slug: string;
  name: string;
  category: string;
  categoryOrder: number;
  /** "Box Contents" — empty for rows quoted by packet count */
  contents: string;
  /** the printed rate, for the unit named in `per` */
  price: number;
  /** "Per rate" — "1 Box", "Unit", "1000 Pkt" … */
  per: string;
  /** "Cs/Cont" — case or container quantity */
  case: string;
  unitNote: string;
  /** Cloudinary public IDs */
  images: string[];
};

/** Read once at build time. Nothing fetches this at runtime. */
let cache: Product[] | null = null;

export function getProducts(): Product[] {
  if (!cache) {
    const raw = readFileSync(join(process.cwd(), "data", "products.json"), "utf8");
    cache = JSON.parse(raw) as Product[];
  }
  return cache;
}

export function getProduct(sno: string): Product | undefined {
  const key = sno.toUpperCase();
  return getProducts().find((p) => p.sno.toUpperCase() === key);
}

/** Categories in the order they are printed on the sheet. */
export function getCategories(): { name: string; count: number }[] {
  const map = new Map<string, { name: string; count: number; order: number }>();
  for (const p of getProducts()) {
    const hit = map.get(p.category);
    if (hit) hit.count++;
    else map.set(p.category, { name: p.category, count: 1, order: p.categoryOrder });
  }
  return [...map.values()]
    .sort((a, b) => a.order - b.order)
    .map(({ name, count }) => ({ name, count }));
}

export function getByCategory(category: string): Product[] {
  return getProducts().filter((p) => p.category === category);
}

/** Items sharing a category, then topped up, rotated so it isn't always the same four. */
export function getRelated(p: Product, n = 4): Product[] {
  const all = getProducts();
  const same = all.filter((x) => x.category === p.category && x.sno !== p.sno);
  let list = same;
  if (list.length < n) {
    const seen = new Set(list.map((x) => x.sno));
    list = list.concat(all.filter((x) => x.sno !== p.sno && !seen.has(x.sno)).slice(0, n - list.length));
  }
  if (list.length > n) {
    const start = (parseInt(p.sno.slice(1), 10) || 0) % list.length;
    list = list.slice(start).concat(list.slice(0, start));
  }
  return list.slice(0, n);
}
