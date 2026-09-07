import type { Product } from "./products";

/**
 * The subset a card renders. Client components receive this instead of the
 * full record, which keeps the serialized React payload small — the fields a
 * card never reads would otherwise be shipped 91 times.
 */
export type CardProduct = Pick<
  Product,
  "sno" | "name" | "category" | "categoryOrder" | "contents" | "price" | "per" | "case"
> & { img: string | null };

export const toCard = (p: Product): CardProduct => ({
  sno: p.sno,
  name: p.name,
  category: p.category,
  categoryOrder: p.categoryOrder,
  contents: p.contents,
  price: p.price,
  per: p.per,
  case: p.case,
  img: p.images[0] ?? null,
});
