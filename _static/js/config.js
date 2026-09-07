/* ==========================================================================
   Sankamithra — runtime configuration

   NOTE: only the Cloudinary *cloud name* belongs in here. It is public by
   design (it appears in every delivery URL). The API key and secret must
   never reach the browser — keep them on a server, or in the local build
   script under tools/.
   ========================================================================== */

window.SANKA = {
  /* Product feed. Generated from the printed price list by
     tools/build-catalogue.py. Swap for an API URL when Mongo is live. */
  PRODUCTS_URL: "data/products.json",

  /* --- Cloudinary delivery ------------------------------------------- */
  CLOUD_NAME: "mvhayrhr",
  /* Applied to every image; f_auto picks AVIF/WebP per browser, q_auto picks
     the quality, and c_limit never upscales past the source. */
  CLOUD_TRANSFORM: "f_auto,q_auto,c_limit",

  /* Widths requested at each usage. Cloudinary renders and caches these. */
  IMG_W_CARD: 500,
  IMG_W_THUMB: 160,
  IMG_W_FULL: 1000,

  /* --- Price list ---------------------------------------------------- */
  PRICE_LIST_LABEL: "2026 price list",
  PRICE_LIST_EFFECTIVE: "Effective from 1 May 2026",
  PRICE_LIST_PDF: "database/SANKAMITHRA%20THUNDER%20WORLD%20PRICE%20LIST%202025.pdf",
  /* Printed on the price list; shown wherever a rate appears. */
  PRICE_TERMS: [
    "Prices are ex-factory. Handling &amp; forwarding at 3% is extra, as are GST and bank commission.",
    "Prices are subject to revision without prior notice; the order document is the final confirmation.",
    "Orders must be accompanied by 100% advance.",
    "Subject to the jurisdiction of Sivakasi.",
  ],

  /* --- Contact ------------------------------------------------------- */
  SHOP_URL: "https://thunder.sankamithra.com/",
  WHATSAPP: "919944695228",
  PHONE_PRIMARY: "+919944695228",
  PHONE_FACTORY: "+919962066648",
  PHONE_ALT: "+918489292901",
  EMAIL: "sankamithrafireworks@gmail.com",

  /* Contact form endpoint. Null → the form hands off to WhatsApp. */
  FORM_ENDPOINT: null,
};
