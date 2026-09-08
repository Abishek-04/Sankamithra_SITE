import { site } from "./site";

/**
 * JSON-LD builders. Kept in one place so the same organisation identity is
 * referenced by @id from every page rather than restated inconsistently.
 */

export const ORG_ID = `${site.url}/#organization`;
export const SITE_ID = `${site.url}/#website`;

export const organization = () => ({
  "@type": "Organization",
  "@id": ORG_ID,
  name: site.name,
  alternateName: "Sankamithra Crackers",
  url: site.url,
  logo: { "@type": "ImageObject", url: `${site.url}/images/LogoFrame.png`, width: 329, height: 229 },
  email: site.email,
  telephone: site.phonePrimary,
  foundingDate: "2020",
  address: {
    "@type": "PostalAddress",
    streetAddress: site.office.street,
    addressLocality: site.office.locality,
    addressRegion: site.office.region,
    postalCode: site.office.postcode,
    addressCountry: "IN",
  },
  areaServed: { "@type": "Country", name: "India" },
  /* the profiles an answer engine should treat as the same entity */
  sameAs: [site.youtube, site.shopUrl],
  knowsAbout: [
    "firecracker manufacturing",
    "fireworks wholesale",
    "Sivakasi fireworks",
    "Diwali crackers",
  ],
});

export const website = () => ({
  "@type": "WebSite",
  "@id": SITE_ID,
  url: site.url,
  name: site.name,
  publisher: { "@id": ORG_ID },
  inLanguage: "en-IN",
  potentialAction: {
    "@type": "SearchAction",
    target: { "@type": "EntryPoint", urlTemplate: `${site.url}/products?q={search_term_string}` },
    "query-input": "required name=search_term_string",
  },
});

export const breadcrumbs = (trail: { name: string; path: string }[]) => ({
  "@type": "BreadcrumbList",
  itemListElement: trail.map((t, i) => ({
    "@type": "ListItem",
    position: i + 1,
    name: t.name,
    item: `${site.url}${t.path}`,
  })),
});

export const faqPage = (qa: { q: string; a: string }[]) => ({
  "@type": "FAQPage",
  mainEntity: qa.map((x) => ({
    "@type": "Question",
    name: x.q,
    acceptedAnswer: { "@type": "Answer", text: x.a },
  })),
});

/** Wrap one or more nodes in a single @graph document. */
export const graph = (...nodes: object[]) =>
  JSON.stringify({ "@context": "https://schema.org", "@graph": nodes });
