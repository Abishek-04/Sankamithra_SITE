import type { MetadataRoute } from "next";
import { getProducts } from "@/lib/products";
import { site } from "@/lib/site";
import { readFileSync, statSync } from "node:fs";
import { join } from "node:path";

export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  // the price list's own mtime is a truer lastModified than "whenever we built"
  const listed = (() => {
    try { return statSync(join(process.cwd(), "data", "products.json")).mtime; }
    catch { return new Date(); }
  })();
  const now = listed;
  return [
    { url: `${site.url}/`, lastModified: now, changeFrequency: "weekly", priority: 1 },
    { url: `${site.url}/products`, lastModified: now, changeFrequency: "weekly", priority: 0.9 },
    ...getProducts().map((p) => ({
      url: `${site.url}/products/${p.sno}`,
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: 0.6,
    })),
  ];
}
