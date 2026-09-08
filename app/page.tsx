import CloudImage from "@/components/CloudImage";
import Link from "next/link";
import dynamic from "next/dynamic";
import type { Metadata } from "next";

import "@/styles/home.css";

import HomeCatalogue from "@/components/HomeCatalogue";
import Testimonials from "@/components/Testimonials";
import VideoReel from "@/components/VideoReel";
import ChannelSection from "@/components/ChannelSection";
import Faq from "@/components/Faq";
import EnquiryForm from "@/components/EnquiryForm";
import { site } from "@/lib/site";
import { getProducts } from "@/lib/products";
import { getVideos } from "@/lib/videos";
import { FAQ } from "@/lib/faq";
import { breadcrumbs, faqPage, graph, organization, website, ORG_ID } from "@/lib/schema";
import { formatPhone } from "@/lib/format";
import {
  Arrow, Check, Spark, Whatsapp, Pin, Mail, Factory, Truck, Store, Shield, Tag, Leaf,
} from "@/components/Icons";

/* Decorative — kept out of the critical path. */
const FireworksCanvas = dynamic(() => import("@/components/FireworksCanvas"), { ssr: true });
const SoundToggle = dynamic(() => import("@/components/SoundToggle"), { ssr: true });

export const metadata: Metadata = { alternates: { canonical: "/" } };

const MARQUEE = [
  "PESO licensed manufacturing", "Direct factory pricing", "Bulk & container loads",
  "Reduced-emission formulations", "Batch-tested before dispatch", "Nationwide despatch",
];

const CAPS = [
  { n: "01 / Manufacturer", icon: <Factory />, h: "We build it ourselves",
    p: "A licensed 16-acre unit with dedicated mixing, filling, drying and finishing sheds — and the magazine capacity to hold season stock.",
    l: ["In-house chemical composition", "Own label printing & packing", "Private-label runs for partners"] },
  { n: "02 / Wholesaler", icon: <Truck width={30} height={30} />, h: "We move it in volume",
    p: "Distributors, retail chains, temple committees and event suppliers order by the carton or the lorry load, at rates that leave room to trade.",
    l: ["Slab pricing from 50 boxes", "Season booking from July", "Documented, labelled consignments"] },
  { n: "03 / Retailer", icon: <Store />, h: "We sell it direct",
    p: "Families buy the same batch the distributors get, through our online shop — factory price, no trader margin stacked on top.",
    l: ["Ready-made family gift boxes", "Build-your-own combination", "Safe, compliant home delivery"] },
];

const STEPS = [
  ["Blended to a formula, not a guess", "Oxidisers, fuels and colour salts are weighed to a written composition in a dedicated mixing shed. Colour, report and burn time are all decided here — before anything is filled."],
  ["Rolled and filled by hand", "Fifty-odd trained hands roll casings, ram charges and set fuses. Hand work is slower than a machine and far better at catching a casing that isn't right."],
  ["Sun-dried and rested", "Filled units cure on open drying yards under controlled spacing. Moisture is the enemy of a clean report, so nothing is hurried out of this stage."],
  ["Fired, then approved", "Samples from every batch are tested on our own range. Height, spread, sound and residue are checked against the spec; a batch that misses is a batch that stays."],
  ["Labelled, boxed, despatched", "Printed in-house, counted to the piece, packed to withstand a lorry, and shipped with the paperwork every consignment legally needs."],
];

const ASSURE = [
  { icon: <Shield />, h: "Licensed & compliant", p: "Explosives licence, magazine approval and transport paperwork in order for every consignment that leaves the gate." },
  { icon: <Tag />, h: "Factory-gate pricing", p: "You buy from the people who made it. No trading layer, no invented MRP, and slab rates that hold through the season." },
  { icon: <Leaf />, h: "Lower-emission mixes", p: "Reformulated compositions that cut smoke and particulate without turning a cracker into a disappointment." },
  { icon: <Truck />, h: "Packed to survive the road", p: "Double-walled cartons, piece counts printed on the box, and breakage rates our repeat buyers will vouch for." },
];

export default function Home() {
  const total = getProducts().length;

  const jsonLd = graph(
    organization(),
    website(),
    {
      "@type": "LocalBusiness",
      "@id": `${site.url}/#business`,
      name: site.name,
      parentOrganization: { "@id": ORG_ID },
      description:
        "Licensed firecracker manufacturer, wholesaler and retailer in Sivakasi, Tamil Nadu. 91 items on the 2026 price list, supplied in bulk across India.",
      url: site.url,
      image: `${site.url}/images/LogoFrame.png`,
      telephone: site.phonePrimary,
      email: site.email,
      priceRange: "₹₹",
      address: {
        "@type": "PostalAddress",
        streetAddress: site.office.street,
        addressLocality: site.office.locality,
        addressRegion: site.office.region,
        postalCode: site.office.postcode,
        addressCountry: "IN",
      },
      geo: { "@type": "GeoCoordinates", latitude: 9.2988, longitude: 77.8711 },
      areaServed: { "@type": "Country", name: "India" },
      makesOffer: {
        "@type": "Offer",
        itemOffered: { "@type": "Product", name: "Firecrackers", category: "Fireworks" },
        priceCurrency: "INR",
        eligibleQuantity: { "@type": "QuantitativeValue", minValue: 50, unitText: "boxes" },
      },
      numberOfEmployees: { "@type": "QuantitativeValue", minValue: 50 },
      foundingDate: "2020",
      sameAs: [site.youtube, site.shopUrl],
    },
    faqPage(FAQ.map((f) => ({ q: f.q, a: f.a }))),
    breadcrumbs([{ name: "Home", path: "/" }]),
  );

  return (
    <main id="main">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd }} />

      {/* ---------------------------------------------------------- hero */}
      <section className="hero noise tone-night">
        <FireworksCanvas />
        <div className="hero__vignette" aria-hidden="true" />

        <div className="hero__inner shell">
          <div className="hero__grid">
            <div className="hero__chips" data-reveal="">
              <span className="chip"><span className="chip__dot" />Sivakasi, Tamil Nadu</span>
              <span className="chip">Manufacturer</span>
              <span className="chip">Wholesaler</span>
              <span className="chip">Retailer</span>
              <SoundToggle />
            </div>

            <h1 className="hero__title" data-split="">
              We don&apos;t sell crackers. We manufacture <em>celebration.</em>
            </h1>

            <p className="hero__sub lead" data-reveal="" data-delay="220">
              Sankamithra Fireworks builds licensed firecrackers on a 16-acre unit outside
              Sivakasi — then supplies them direct to distributors, retail chains and
              families across India. No middlemen between the factory floor and your festival.
            </p>

            <div className="hero__actions" data-reveal="" data-delay="340">
              <Link className="btn btn--lg" href="/products" data-magnetic="0.22">
                Browse the catalogue<span className="btn__ico" aria-hidden="true"><Arrow /></span>
              </Link>
              <a className="btn btn--lg btn--ghost" href="#contact" data-magnetic="0.18">Get wholesale rates</a>
            </div>

            <div className="hero__stats" data-reveal="" data-delay="460">
              <div className="stat"><span className="stat__n"><span data-count={total}>{total}</span></span><span className="stat__l">Items on the 2026 list</span></div>
              <div className="stat"><span className="stat__n"><span data-count="16">16</span></span><span className="stat__l">Acre licensed unit</span></div>
              <div className="stat"><span className="stat__n"><span data-count="50">50</span><sup>+</sup></span><span className="stat__l">Skilled hands</span></div>
              <div className="stat"><span className="stat__n">2020</span><span className="stat__l">Making sparks since</span></div>
            </div>
          </div>
        </div>

        <div className="hero__cue" aria-hidden="true"><span />Scroll</div>
      </section>

      {/* ------------------------------------------------------- marquee */}
      <div className="marquee" aria-hidden="true">
        <div className="marquee__track">
          {MARQUEE.map((m) => (
            <span className="marquee__item" key={m}><Spark />{m}</span>
          ))}
        </div>
      </div>

      {/* --------------------------------------------------------- story */}
      <section className="section" id="story">
        <div className="glow-orb" style={{ width: 520, height: 520, background: "#f50026", top: "-8%", left: "-12%", opacity: 0.16 }} aria-hidden="true" />
        <div className="shell">
          <div className="split">
            <div className="split__media split__media--frame" data-reveal="left">
              <CloudImage
                id="sankamithra/site/floor-hand"
                alt="A worker inspecting a freshly rolled cracker on the Sankamithra factory floor"
                width={1600} height={900}
                sizes="(max-width: 900px) 92vw, 46vw"
                maxWidth={1600}
                priority
                data-parallax="0.06"
              />
              <div className="badge-float badge-float--br">
                <strong>Sivakasi</strong><span>The fireworks capital</span>
              </div>
            </div>

            <div className="flow" data-reveal="right">
              <span className="eyebrow">Our Spark</span>
              <h2 className="h1" style={{ marginTop: ".6rem" }}>
                Born in the town that <span className="underline-swipe">lights up India</span>
              </h2>
              <p className="lead">
                Ninety percent of India&apos;s fireworks come from Sivakasi. We are one of its
                younger units — set up in 2020 — and we grew fast for a plain reason:
                we make what we sell.
              </p>
              <p>
                Every shell, sparkler and flower pot leaving our gate was mixed, rolled,
                filled and tested on our own 16-acre premises at Kanmaisurangudi. That
                means we control the chemistry, the counts per box and the price — and
                none of those three has to pass through a trader before it reaches you.
              </p>
              <blockquote className="quote-block" style={{ marginTop: "1.5rem" }}>
                A celebration without fireworks is a song without sound.
                <cite>— The Sankamithra floor</cite>
              </blockquote>
              <p style={{ marginTop: "1.5rem" }}>
                <a className="link-arrow" href="#manufacturing">See how a cracker is built<Arrow /></a>
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------ business */}
      <section className="section" id="business">
        <div className="shell">
          <div className="sec-head sec-head--split">
            <div>
              <span className="eyebrow">What we do</span>
              <h2 className="h1" style={{ marginTop: ".7rem" }} data-split="">Three businesses, one factory gate.</h2>
            </div>
            <p className="lead" data-reveal="" data-delay="150">
              Most fireworks brands are only one of these. We run all three, which is why
              a distributor and a family buying for Diwali get the same product at
              honest, different prices.
            </p>
          </div>

          <div className="caps" data-stagger="120">
            {CAPS.map((c) => (
              <article className="card cap" key={c.n}>
                <span className="cap__n">{c.n}</span>
                <div className="cap__ico">{c.icon}</div>
                <h3>{c.h}</h3>
                <p>{c.p}</p>
                <ul className="cap__list">
                  {c.l.map((li) => <li key={li}><Check />{li}</li>)}
                </ul>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ------------------------------------------------- manufacturing */}
      <section className="section section--alt" id="manufacturing">
        <div className="shell">
          <div className="process">
            <div className="process__sticky">
              <span className="eyebrow">Behind the boom</span>
              <h2 className="h1" style={{ margin: ".7rem 0 1rem" }} data-split="">From raw powder to the last ember.</h2>
              <p className="lead" data-reveal="" data-delay="150">
                A cracker is chemistry, paper and patience. Here is the route every
                Sankamithra product takes before it earns a label.
              </p>
              <div data-reveal="" data-delay="240" style={{ marginTop: "1.75rem" }}>
                <CloudImage
                  className="process__shot"
                  id="sankamithra/site/skyshots"
                  alt="A row of Sankamithra sky shot cartons"
                  width={1040} height={810}
                  sizes="(max-width: 940px) 92vw, 520px"
                  maxWidth={1280}
                />
              </div>
            </div>

            <ol className="steps" data-stagger="90">
              {STEPS.map(([h, p], i) => (
                <li className="step" key={h}>
                  <span className="step__n">{String(i + 1).padStart(2, "0")}</span>
                  <div><h3>{h}</h3><p>{p}</p></div>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      {/* -------------------------------------------------------- gallery */}
      <section className="section section--tight">
        <div className="shell">
          <div className="sec-head sec-head--split">
            <div>
              <span className="eyebrow">On the floor</span>
              <h2 className="h2" style={{ marginTop: ".7rem" }}>Where the magic is actually made</h2>
            </div>
            <p data-reveal="">No stock photography. These are our sheds, our yards, our people.</p>
          </div>

          <div className="gal" data-stagger="110">
            <figure className="gal__i gal__i--tall">
              <CloudImage id="sankamithra/site/floor-casings" alt="Rolled cracker casings stacked on the factory floor" fill sizes="(max-width: 780px) 92vw, 33vw" maxWidth={768} />
              <figcaption>Casings, freshly rolled</figcaption>
            </figure>
            <figure className="gal__i">
              <CloudImage id="sankamithra/site/floor-sorting" alt="Finished crackers being sorted for packing" fill sizes="(max-width: 780px) 46vw, 33vw" maxWidth={768} />
              <figcaption>Sorting before pack</figcaption>
            </figure>
            <figure className="gal__i">
              <CloudImage id="sankamithra/site/factory" alt="The Sankamithra Fireworks unit at Kanmaisurangudi village" fill sizes="(max-width: 780px) 46vw, 33vw" maxWidth={1024} />
              <figcaption>The unit at Kanmaisurangudi</figcaption>
            </figure>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------- products */}
      <section className="section" id="products">
        <div className="glow-orb" style={{ width: 600, height: 600, background: "#ff7a18", bottom: "-10%", right: "-14%", opacity: 0.13 }} aria-hidden="true" />
        <div className="shell">
          <div className="sec-head sec-head--split">
            <div>
              <span className="eyebrow">The range</span>
              <h2 className="h1" style={{ marginTop: ".7rem" }} data-split="">Not a catalogue. A celebration you can scroll.</h2>
            </div>
            <div style={{ display: "grid", gap: "1.15rem", justifyItems: "start" }}>
              <p data-reveal="">
                {total} items across 11 families on the 2026 list — from a ₹12 bijili bag
                to a 240-shot repeater. Every rate is ex-factory.
              </p>
              <Link className="btn btn--ghost" href="/products" data-reveal="" data-delay="120">
                View the 2026 price list<span className="btn__ico" aria-hidden="true"><Arrow /></span>
              </Link>
            </div>
          </div>

          <HomeCatalogue />
        </div>
      </section>

      {/* ---------------------------------------------------------- video */}
      <section className="section section--tight">
        <div className="shell"><VideoReel /></div>
      </section>

      {/* -------------------------------------------------------- channel */}
      <ChannelSection />

      {/* ------------------------------------------------------ assurance */}
      <section className="section section--tight">
        <div className="shell">
          <div className="sec-head sec-head--center">
            <span className="eyebrow">Why buyers stay</span>
            <h2 className="h2">Four things we refuse to compromise</h2>
          </div>
          <div className="assure" data-stagger="100">
            {ASSURE.map((a) => (
              <div className="assure__c" key={a.h}>{a.icon}<h4>{a.h}</h4><p>{a.p}</p></div>
            ))}
          </div>
        </div>
      </section>

      {/* --------------------------------------------------- testimonials */}
      <section className="section section--alt">
        <div className="shell">
          <div className="sec-head sec-head--split">
            <div>
              <span className="eyebrow">Word of mouth</span>
              <h2 className="h2" style={{ marginTop: ".7rem" }}>People who reorder every season</h2>
            </div>
          </div>
          <Testimonials />
        </div>
      </section>

      <Faq />

      {/* -------------------------------------------------------- contact */}
      <section className="section" id="contact">
        <div className="shell">
          <div className="cta-band tone-night" data-reveal="scale" style={{ marginBottom: "clamp(2.5rem,6vw,5rem)" }}>
            <span className="eyebrow">Season booking is open</span>
            <h2>Tell us what you need. We&apos;ll quote in a day.</h2>
            <p>Wholesale slab, retail combo box or a private-label run — start the conversation and we&apos;ll come back with real numbers, not a brochure.</p>
            <div className="cta-band__actions">
              <a className="btn btn--lg btn--wa" href={`https://wa.me/${site.whatsapp}`} target="_blank" rel="noopener" data-magnetic="0.2">
                <Whatsapp width={18} height={18} />Chat on WhatsApp
              </a>
              <a className="btn btn--lg btn--ghost" href={`tel:${site.phonePrimary}`}>Call {formatPhone(site.phonePrimary)}</a>
            </div>
          </div>

          <div className="sec-head sec-head--split">
            <div>
              <span className="eyebrow">Get in touch</span>
              <h2 className="h1" style={{ marginTop: ".7rem" }} data-split="">Let the sparks begin.</h2>
            </div>
            <p data-reveal="">Business, bulk orders, or a festive hello — we answer every one.</p>
          </div>

          <div className="contact">
            <EnquiryForm />

            <div className="contact__side" data-reveal="right">
              <div className="info-card">
                <span className="info-card__ico"><Pin /></span>
                <div>
                  <h4>Office</h4>
                  <p>{site.office.street},<br />{site.office.locality} — {site.office.postcode}</p>
                  <a href={`tel:${site.phonePrimary}`}>{formatPhone(site.phonePrimary)}</a>
                </div>
              </div>
              <div className="info-card">
                <span className="info-card__ico"><Factory width={20} height={20} /></span>
                <div>
                  <h4>Factory</h4>
                  <p>{site.factory}</p>
                  <a href={`tel:${site.phoneFactory}`}>{formatPhone(site.phoneFactory)}</a>
                  <a href={`tel:${site.phoneAlt}`}>{formatPhone(site.phoneAlt)}</a>
                </div>
              </div>
              <div className="info-card">
                <span className="info-card__ico"><Mail /></span>
                <div><h4>Email</h4><a href={`mailto:${site.email}`}>{site.email}</a></div>
              </div>

              <div className="map-frame">
                <iframe
                  title="Sankamithra Fireworks on the map"
                  src="https://www.google.com/maps/embed?pb=!1m14!1m8!1m3!1d1340.1052666001385!2d77.87118833935341!3d9.298856736284566!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3b06b55da9401d09%3A0xb66acba031fbce0d!2sSankamithra%20Fireworks!5e1!3m2!1sen!2sin!4v1723530302527!5m2!1sen!2sin"
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  allowFullScreen
                />
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
