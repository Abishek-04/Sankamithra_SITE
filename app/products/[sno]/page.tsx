import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import "@/styles/home.css";
import "@/styles/catalogue.css";

import ProductGallery from "@/components/ProductGallery";
import ProductGrid from "@/components/ProductGrid";
import { getProduct, getProducts, getRelated } from "@/lib/products";
import { toCard } from "@/lib/card";
import { money, moneyFine, perLabel, unitPrice, waLink } from "@/lib/format";
import { site } from "@/lib/site";
import { Arrow, Info, Whatsapp } from "@/components/Icons";

/* One static page per row of the price list — 91 pre-rendered documents. */
export function generateStaticParams() {
  return getProducts().map((p) => ({ sno: p.sno }));
}

export const dynamicParams = false;

export async function generateMetadata({ params }: { params: Promise<{ sno: string }> }): Promise<Metadata> {
  const { sno } = await params;
  const p = getProduct(sno);
  if (!p) return { title: "Product not found" };

  const desc =
    `${p.name} (${p.sno}) — ${money(p.price)} per ${perLabel(p.per)}` +
    (p.contents ? `, ${p.contents} per box` : "") +
    `, ${p.case} per case. Ex-factory rate from Sankamithra Fireworks, Sivakasi.`;

  return {
    title: `${p.sno} ${p.name}`,
    description: desc,
    alternates: { canonical: `/products/${p.sno}` },
    openGraph: {
      title: `${p.name} — ${site.name}`,
      description: desc,
      images: p.images.length
        ? [`https://res.cloudinary.com/${site.cloudName}/image/upload/f_auto,q_auto,c_limit,w_1200/${p.images[0]}`]
        : undefined,
    },
  };
}

export default async function ProductPage({ params }: { params: Promise<{ sno: string }> }) {
  const { sno } = await params;
  const p = getProduct(sno);
  if (!p) notFound();

  const unit = unitPrice(p);
  const related = getRelated(p);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    sku: p.sno,
    name: p.name,
    category: p.category,
    description: p.unitNote,
    brand: { "@type": "Brand", name: site.name },
    image: p.images.map((i) => `https://res.cloudinary.com/${site.cloudName}/image/upload/f_auto,q_auto,c_limit,w_1200/${i}`),
    offers: {
      "@type": "Offer",
      price: p.price,
      priceCurrency: "INR",
      availability: "https://schema.org/InStock",
      url: `${site.url}/products/${p.sno}`,
      seller: { "@type": "Organization", name: site.name },
    },
  };

  return (
    <main id="main">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <section className="page-head noise tone-night" style={{ paddingBottom: "clamp(1rem,2.5vw,1.75rem)" }}>
        <div className="shell page-head__inner">
          <nav className="crumbs" aria-label="Breadcrumb">
            <Link href="/">Home</Link><span>/</span>
            <Link href="/products">Catalogue</Link><span>/</span>
            <Link href="/products">{p.category}</Link><span>/</span>
            <span style={{ opacity: 1, color: "var(--accent)" }}>{p.sno}</span>
          </nav>
        </div>
      </section>

      <div className="shell">
        <div className="pdp">
          <ProductGallery images={p.images} name={p.name} />

          <div style={{ display: "grid", gap: "1.35rem" }}>
            <div className="pdp__head">
              <p className="pdp__sku"><span className="pdp__snotag">{p.sno}</span> {p.category}</p>
              <h1 className="pdp__title">{p.name}</h1>
              <p className="lead">{p.unitNote}.</p>
            </div>

            <div className="pdp__pricebox">
              <span className="pdp__now">{money(p.price)}</span>
              <span className="pdp__per">per {perLabel(p.per)}</span>
              {unit && <span className="pdp__save">{moneyFine(unit.each)} per packet</span>}
            </div>

            <dl className="pdp__facts">
              <div className="pdp__fact"><dt>S.No</dt><dd>{p.sno}</dd></div>
              <div className="pdp__fact"><dt>Box contents</dt><dd>{p.contents || "—"}</dd></div>
              <div className="pdp__fact"><dt>Per rate</dt><dd>{p.per}</dd></div>
              <div className="pdp__fact"><dt>Cs / Cont</dt><dd>{p.case}</dd></div>
              <div className="pdp__fact"><dt>Category</dt><dd>{p.category}</dd></div>
              <div className="pdp__fact"><dt>Made at</dt><dd>Sivakasi, TN</dd></div>
            </dl>

            <div className="pdp__actions">
              <a className="btn btn--lg btn--wa" href={waLink(p)} target="_blank" rel="noopener">
                <Whatsapp />Enquire on WhatsApp
              </a>
              <a className="btn btn--lg btn--ghost" href={site.shopUrl} target="_blank" rel="noopener">Buy in the shop</a>
            </div>

            <div className="pdp__terms">
              <h3>Rate terms</h3>
              <ul>{site.priceList.terms.map((t) => <li key={t}>{t}</li>)}</ul>
              <p className="form-note">{site.priceList.effective}.</p>
            </div>

            <p className="pdp__note">
              <Info />
              <span>
                Fireworks cannot be shipped by air or courier. Consignments move by approved
                road transport with the required paperwork — we&apos;ll confirm the route when you enquire.
              </span>
            </p>

            <div className="pdp__body">
              <h3>Handling &amp; safety</h3>
              <p>
                Use outdoors in an open space, keep a safe distance after lighting, never relight
                a dud, and keep a bucket of water or sand within reach. Children must be
                supervised by an adult at all times.
              </p>
            </div>
          </div>
        </div>
      </div>

      <section className="section section--tight">
        <div className="shell">
          <div className="sec-head sec-head--split">
            <div>
              <span className="eyebrow">You might also stock</span>
              <h2 className="h2" style={{ marginTop: ".7rem" }}>From the same shelf</h2>
            </div>
            <Link className="link-arrow" href="/products">See the full catalogue<Arrow /></Link>
          </div>
          <ProductGrid
            products={related.map(toCard)}
            className="pgrid pgrid--home"
            sizes="(max-width: 560px) 92vw, (max-width: 980px) 45vw, 23vw"
          />
        </div>
      </section>

      <section className="section section--tight">
        <div className="shell">
          <div className="cta-band tone-night">
            <span className="eyebrow">Buying for a shop or an event?</span>
            <h2>Send us your list. We&apos;ll quote in a day.</h2>
            <p>Wholesale slabs start at 50 boxes. Tell us the S.Nos, the quantity and the delivery town.</p>
            <div className="cta-band__actions">
              <a className="btn btn--lg btn--wa" href={waLink(p)} target="_blank" rel="noopener">Chat on WhatsApp</a>
              <Link className="btn btn--lg btn--ghost" href="/#contact">Use the enquiry form</Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
