"use client";

import { useDeferredValue, useMemo, useState } from "react";
import type { CardProduct } from "@/lib/card";
import ProductCard from "./ProductCard";
import { Box, Close, Search } from "./Icons";
import { site } from "@/lib/site";
import { waLink } from "@/lib/format";

const PAGE = 24;

/* Rates are quoted on enquiry, so nothing here filters or sorts by price. */
type Sort = "featured" | "sno" | "name";

export default function CatalogueClient({
  products,
  categories,
  priceTable,
}: {
  products: CardProduct[];
  categories: { name: string; count: number }[];
  /** server-rendered full table — passed through so its 91 rows stay in HTML */
  priceTable?: React.ReactNode;
}) {
  const [q, setQ] = useState("");
  const [cats, setCats] = useState<string[]>([]);
  const [sort, setSort] = useState<Sort>("featured");
  const [shown, setShown] = useState(PAGE);
  const [sheet, setSheet] = useState(false);

  // keep typing responsive while the 91-item filter re-runs
  const dq = useDeferredValue(q);

  const filtered = useMemo(() => {
    const needle = dq.trim().toLowerCase();

    const out = products.filter((p) => {
      if (cats.length && !cats.includes(p.category)) return false;
      if (needle) {
        const hay = `${p.sno} ${p.name} ${p.category} ${p.contents} ${p.per}`.toLowerCase();
        if (!hay.includes(needle)) return false;
      }
      return true;
    });

    const by: Record<Sort, (a: CardProduct, z: CardProduct) => number> = {
      name: (a, z) => a.name.localeCompare(z.name, "en", { numeric: true }),
      sno: (a, z) => a.sno.localeCompare(z.sno, "en", { numeric: true }),
      // the printed sheet's own order
      featured: (a, z) =>
        a.categoryOrder - z.categoryOrder || a.sno.localeCompare(z.sno, "en", { numeric: true }),
    };
    return [...out].sort(by[sort]);
  }, [products, dq, cats, sort]);

  const slice = filtered.slice(0, shown);
  const activeCount = cats.length + (q ? 1 : 0);

  const reset = () => { setQ(""); setCats([]); setShown(PAGE); };
  const toggleCat = (c: string) => {
    setCats((v) => (c === "*" ? [] : v.includes(c) ? v.filter((x) => x !== c) : [...v, c]));
    setShown(PAGE);
  };

  const tokens: { key: string; label: string; clear: () => void }[] = [];
  if (q) tokens.push({ key: "q", label: `“${q}”`, clear: () => { setQ(""); setShown(PAGE); } });
  cats.forEach((c) => tokens.push({ key: `c-${c}`, label: c, clear: () => toggleCat(c) }));

  return (
    <>
      <div className="tools">
        <div className="shell tools__row">
          <div className={`search${q ? " has-val" : ""}`}>
            <span className="search__ico"><Search /></span>
            <input
              type="search"
              placeholder="Search 91 items — name, or an S.No like S204"
              aria-label="Search products"
              autoComplete="off"
              value={q}
              onChange={(e) => { setQ(e.target.value); setShown(PAGE); }}
            />
            <button className="search__clear" type="button" aria-label="Clear search" onClick={() => { setQ(""); setShown(PAGE); }}>
              <Close />
            </button>
          </div>

          <button className="tools__toggle" type="button" onClick={() => setSheet((v) => !v)}>
            Filters {activeCount > 0 && <b>{activeCount}</b>}
          </button>

          <select className="select" aria-label="Sort products" value={sort} onChange={(e) => { setSort(e.target.value as Sort); setShown(PAGE); }}>
            <option value="featured">Price list order</option>
            <option value="sno">S.No</option>
            <option value="name">Name A–Z</option>
          </select>
        </div>
      </div>

      <div className="shell cat-layout">
        <aside className={`facets${sheet ? " is-open" : ""}`} aria-label="Filters">
          <span className="facets__grab" aria-hidden="true" />

          <div className="facet">
            <h3>Category</h3>
            <div className="facet__list">
              <button className={`facet__opt${cats.length === 0 ? " is-on" : ""}`} type="button" onClick={() => toggleCat("*")}>
                All products <span>{products.length}</span>
              </button>
              {categories.map((c) => (
                <button key={c.name} className={`facet__opt${cats.includes(c.name) ? " is-on" : ""}`} type="button" onClick={() => toggleCat(c.name)}>
                  {c.name} <span>{c.count}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="facet">
            <h3>Buying in bulk?</h3>
            <p style={{ fontSize: "var(--t-xs)", marginBottom: ".9rem" }}>
              Send us your S.No list with quantities and we&apos;ll come back within a working day.
            </p>
            <a className="btn btn--sm btn--block btn--wa" href={waLink()} target="_blank" rel="noopener">
              Get a wholesale quote
            </a>
          </div>

          <button className="btn btn--block facets__done" type="button" onClick={() => setSheet(false)}>
            Show results
          </button>
        </aside>

        <div className="results">
          <div className="results__bar">
            <p className="results__count">
              {filtered.length ? (
                <>
                  <b>{filtered.length}</b> product{filtered.length === 1 ? "" : "s"}
                  {filtered.length > slice.length && <> &middot; showing {slice.length}</>}
                </>
              ) : "No matches"}
            </p>
            <div className="tokens">
              {tokens.map((t) => (
                <span className="token" key={t.key}>
                  {t.label}
                  <button type="button" aria-label="Remove filter" onClick={t.clear}><Close width={14} height={14} /></button>
                </span>
              ))}
              {tokens.length > 1 && (
                <button className="token" type="button" style={{ color: "var(--accent)" }} onClick={reset}>Clear all</button>
              )}
            </div>
          </div>

          {slice.length ? (
            <div className="pgrid">
              {slice.map((p, i) => (
                <ProductCard key={p.sno} p={p} index={i} priority={i < 4} showPrice={false} />
              ))}
            </div>
          ) : (
            <div className="pgrid">
              <div className="empty">
                <Box />
                <h3>No products match that</h3>
                <p>Clear a category, or search for something like “chakkar”, “bijili”, “fancy” or an S.No such as S204.</p>
              </div>
            </div>
          )}

          {filtered.length > shown && (
            <div className="load-more">
              <button className="btn btn--ghost btn--lg" type="button" onClick={() => setShown((v) => v + PAGE)}>
                Load {Math.min(PAGE, filtered.length - shown)} more
              </button>
            </div>
          )}

          {priceTable}

          <section className="terms" data-reveal="">
            <h2 className="h3">Terms &amp; conditions</h2>
            <ol className="terms__list">
              {site.priceList.terms.map((t) => <li key={t}>{t}</li>)}
            </ol>
            <p className="form-note">
              Printed on the Sankamithra Fireworks price list, Sivakasi — {site.priceList.effective.toLowerCase()}.
            </p>
          </section>
        </div>
      </div>
    </>
  );
}
