import type { Metadata } from "next";
import Link from "next/link";

import "@/styles/home.css";
import "@/styles/catalogue.css";

import CatalogueClient from "@/components/CatalogueClient";
import { getCategories, getProducts } from "@/lib/products";
import { toCard } from "@/lib/card";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "2026 Price List — 91 items, ex-factory rates",
  description:
    "The complete Sankamithra Fireworks 2026 price list — 91 items across specials, magics, one sound crackers, chakkars, flower pots, atom bombs, bijili, pencils, repeating shots and aerial shots. Ex-factory rates, effective 1 May 2026.",
  alternates: { canonical: "/products" },
};

export default function CataloguePage() {
  const products = getProducts();
  const cards = products.map(toCard);
  const categories = getCategories();

  /* ItemList so the whole sheet is machine-readable in one document */
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: `${site.name} — ${site.priceList.label}`,
    numberOfItems: products.length,
    itemListElement: products.map((p, i) => ({
      "@type": "ListItem",
      position: i + 1,
      item: {
        "@type": "Product",
        sku: p.sno,
        name: p.name,
        category: p.category,
        brand: { "@type": "Brand", name: site.name },
        offers: {
          "@type": "Offer",
          price: p.price,
          priceCurrency: "INR",
          availability: "https://schema.org/InStock",
          url: `${site.url}/products/${p.sno}`,
        },
      },
    })),
  };

  return (
    <main id="main">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <section className="page-head noise tone-night">
        <div className="shell page-head__inner">
          <nav className="crumbs" aria-label="Breadcrumb">
            <Link href="/">Home</Link><span>/</span>
            <span style={{ opacity: 1, color: "var(--accent)" }}>Price list 2026</span>
          </nav>
          <h1 className="h1" data-split="">The 2026 price list, in full.</h1>
          <p className="lead" data-reveal="" data-delay="180">
            All {products.length} items exactly as printed — S.No, box contents, rate, the unit
            that rate applies to, and the case quantity. Ex-factory, effective 1 May 2026.
          </p>
          <p className="pricebar" data-reveal="" data-delay="240">
            <span className="chip"><span className="chip__dot" />Effective 1 May 2026</span>
            <span className="chip">Ex-factory rates</span>
            <span className="chip">H&amp;F 3% extra</span>
            <span className="chip">GST extra</span>
          </p>
        </div>
      </section>

      <CatalogueClient products={cards} categories={categories} />
    </main>
  );
}
