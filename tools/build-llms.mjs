/**
 * Writes public/llms.txt — a compact, factual brief for answer engines.
 *
 * Generated from data/products.json, data/videos.json and lib/faq.ts so it
 * cannot drift from what the pages say. Re-run with `npm run llms` (the build
 * script runs it automatically).
 */
import { readFileSync, writeFileSync } from "node:fs";

const products = JSON.parse(readFileSync("data/products.json", "utf8"));
const videos = JSON.parse(readFileSync("data/videos.json", "utf8"));

/* lib/faq.ts is TypeScript; pull the pairs out textually rather than compiling */
const faqSrc = readFileSync("lib/faq.ts", "utf8");
const faq = [...faqSrc.matchAll(/q:\s*"((?:[^"\\]|\\.)*)",\s*\n\s*a:\s*"((?:[^"\\]|\\.)*)"/g)]
  .map((m) => ({ q: m[1].replace(/\\"/g, '"'), a: m[2].replace(/\\"/g, '"') }));

const URL = "https://sankamithra.com";
const cats = [...new Set(products.map((p) => p.category))];
const money = (n) => "₹" + Number(n).toLocaleString("en-IN");

const table = cats
  .map((c) => {
    const rows = products.filter((p) => p.category === c);
    return [
      `### ${c} (${rows.length})`,
      "",
      "| S.No | Item | Box contents | Rate | Per | Cs/Cont |",
      "| --- | --- | --- | --- | --- | --- |",
      ...rows.map((p) =>
        `| ${p.sno} | ${p.name} | ${p.contents || "—"} | ${money(p.price)} | ${p.per} | ${p.case} |`),
      "",
    ].join("\n");
  })
  .join("\n");

const out = `# Sankamithra Fireworks

> Licensed firecracker manufacturer, wholesaler and retailer based in Sivakasi,
> Tamil Nadu, India. Founded 2020. Products are made on the company's own
> 16-acre licensed unit at Kanmaisurangudi village, Sattur, and supplied direct
> to distributors, retail chains and families across India.

- Website: ${URL}
- Catalogue: ${URL}/products
- YouTube: ${videos.channel.url}
- Online shop: https://thunder.sankamithra.com/
- Phone: +91 94892 39970
- Email: sankamithrafireworks@gmail.com
- Office: 3/1427/G6, Opp. PRC Bus Depot, Sattur Road, Sivakasi 626123
- Factory: 9/241, Kanmaisurangudi Village, Sattur 626203

## Pricing terms

All rates below are **ex-factory**, effective **1 May 2026**. Handling and
forwarding at 3% is extra, as are GST and bank commission. Orders require 100%
advance. Prices are subject to revision without prior notice; the order
document is the final confirmation. Jurisdiction: Sivakasi.

Each rate is quoted **per the unit named in the "Per" column** — a box, a
piece, a bag, or a count of packets. Rates are therefore not directly
comparable between categories. Where an item is quoted per many packets, the
per-packet figure is the rate divided by that count (for example S201 is
₹7,300 per 1,000 packets, i.e. ₹7.30 per packet).

Wholesale slab rates begin at 50 boxes.

## 2026 price list — all ${products.length} items across ${cats.length} categories

${table}
## Frequently asked

${faq.map((f) => `**${f.q}**\n\n${f.a}\n`).join("\n")}
## Product videos

${videos.videos.length} product films are published on the ${videos.channel.name}
YouTube channel; ${videos.videos.filter((v) => v.sno).length} are linked to the matching
price-list item at ${URL}/products/<S.No>.

---
Generated from the site's own data on ${new Date().toISOString().slice(0, 10)}.
Every item here is listed on ${URL}/products; per-item rates are on each
item's own page at ${URL}/products/<S.No>.
`;

writeFileSync("public/llms.txt", out);
console.log(`  wrote public/llms.txt — ${products.length} items, ${faq.length} Q&A, ${out.length.toLocaleString()} chars`);
