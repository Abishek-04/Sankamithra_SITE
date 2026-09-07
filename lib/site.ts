/** Site-wide constants. Nothing here is secret; the Cloudinary cloud name is
 *  public by design and appears in every delivery URL. */
export const site = {
  name: "Sankamithra Fireworks",
  url: "https://sankamithra.com",
  cloudName: "mvhayrhr",

  priceList: {
    label: "2026 price list",
    effective: "Effective from 1 May 2026",
    terms: [
      "Prices are ex-factory. Handling & forwarding at 3% is extra, as are GST and bank commission.",
      "Prices are subject to revision without prior notice; the order document is the final confirmation.",
      "Orders must be accompanied by 100% advance.",
      "Subject to the jurisdiction of Sivakasi.",
    ],
  },

  youtube: "https://www.youtube.com/@SankamithraCrackers",
  shopUrl: "https://thunder.sankamithra.com/",
  whatsapp: "919489239970",
  phonePrimary: "+919489239970",
  phoneFactory: "+919962066648",
  phoneAlt: "+918489292901",
  email: "sankamithrafireworks@gmail.com",

  /** Contact endpoint. Null → the form hands the enquiry to WhatsApp. */
  formEndpoint: null as string | null,

  office: {
    street: "3/1427/G6, Opp. PRC Bus Depot, Sattur Road",
    locality: "Sivakasi",
    region: "Tamil Nadu",
    postcode: "626123",
  },
  factory: "9/241, Kanmaisurangudi Village, Sattur — 626203",
} as const;

export const nav = [
  { href: "/#story", label: "Our Story", spy: "story" },
  { href: "/#business", label: "What We Do", spy: "business" },
  { href: "/#manufacturing", label: "Manufacturing", spy: "manufacturing" },
  { href: "/products", label: "Catalogue", spy: null },
  { href: "/#videos", label: "Videos", spy: "videos" },
  { href: "/#contact", label: "Contact", spy: "contact" },
] as const;
