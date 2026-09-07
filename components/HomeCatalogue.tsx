import { getByCategory, getCategories } from "@/lib/products";
import { toCard } from "@/lib/card";
import CategoryTabs from "./CategoryTabs";

const FEATURED = [
  "Sankamithra Specials", "Sankamithra Magics", "Repeating Shots", "Aerial Shots",
  "Flower Pots", "Ground Chakkars", "One Sound Crackers", "Atom Bombs",
];

/** Server component: picks the featured eight and hands down slim card data. */
export default function HomeCatalogue() {
  const all = getCategories();
  const ordered = [
    ...FEATURED.filter((f) => all.some((c) => c.name === f)),
    ...all.map((c) => c.name).filter((n) => !FEATURED.includes(n)),
  ];

  const groups = ordered.map((name) => {
    const meta = all.find((c) => c.name === name)!;
    return { name, count: meta.count, products: getByCategory(name).slice(0, 8).map(toCard) };
  });

  return <CategoryTabs groups={groups} />;
}
