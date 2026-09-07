/**
 * Drives the real browser against a running server and asserts that product
 * cards are actually VISIBLE (computed opacity), not merely present in the
 * DOM — the check that would have caught the reveal regression.
 *
 *   node tools/verify.mjs http://127.0.0.1:8901 [--ext]
 *
 * --ext stamps the attributes a browser extension like Grammarly injects on
 * <body> before hydration, reproducing the mismatch that made React rebuild
 * the tree.
 */
import puppeteer from "puppeteer-core";

const BASE = process.argv[2] || "http://127.0.0.1:8901";
const EXT = process.argv.includes("--ext");
const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: "new",
  args: ["--no-sandbox", "--disable-gpu", "--window-size=1440,1000"],
  defaultViewport: { width: 1440, height: 1000 },
});

const errors = [];
const page = await browser.newPage();
page.on("console", (m) => m.type() === "error" && errors.push(m.text().slice(0, 160)));
page.on("pageerror", (e) => errors.push("pageerror: " + String(e).slice(0, 160)));

if (EXT) {
  await page.evaluateOnNewDocument(() => {
    const stamp = () => {
      if (document.body) {
        document.body.setAttribute("data-new-gr-c-s-check-loaded", "14.1326.0");
        document.body.setAttribute("data-gr-ext-installed", "");
      } else requestAnimationFrame(stamp);
    };
    stamp();
  });
}

const visible = () =>
  page.evaluate(() => {
    const sel = (s) => [...document.querySelectorAll(s)];
    const shown = (n) => parseFloat(getComputedStyle(n).opacity) > 0.9;
    const cards = sel(".pcard");
    const reveal = sel("[data-reveal]");
    return {
      cards: cards.length,
      cardsVisible: cards.filter(shown).length,
      reveal: reveal.length,
      revealVisible: reveal.filter(shown).length,
    };
  });

/* Scroll-reveal deliberately leaves below-fold nodes hidden, so walk the page
   to the bottom before asserting — otherwise the test just measures the fold. */
const scrollThrough = async () => {
  await page.evaluate(async () => {
    // the page sets scroll-behavior: smooth, which would make scrollTo animate
    // and the walk never actually reach the bottom
    const prev = document.documentElement.style.scrollBehavior;
    document.documentElement.style.scrollBehavior = "auto";
    const step = Math.round(innerHeight * 0.75);
    const max = () => document.documentElement.scrollHeight;
    for (let y = 0; y <= max(); y += step) {
      window.scrollTo({ top: y, behavior: "instant" });
      await new Promise((r) => requestAnimationFrame(() => setTimeout(r, 90)));
    }
    window.scrollTo({ top: 0, behavior: "instant" });
    document.documentElement.style.scrollBehavior = prev;
    await new Promise((r) => setTimeout(r, 120));
  });
};

const step = async (label, fn) => {
  try {
  if (fn) await fn();
  await new Promise((r) => setTimeout(r, 700));
  await scrollThrough();
  await new Promise((r) => setTimeout(r, 900));
  const v = await visible();
  const ok = v.cards > 0 && v.cardsVisible === v.cards;
  console.log(
    `  ${ok ? "PASS" : "FAIL"}  ${label.padEnd(26)} ${v.cardsVisible}/${v.cards} cards visible · ${v.revealVisible}/${v.reveal} reveal nodes`,
  );
  return ok;
  } catch (e) {
    console.log(`  ERR   ${label.padEnd(26)} ${String(e).split("\n")[0].slice(0, 90)}`);
    return false;
  }
};

const click = (text) =>
  page.evaluate((t) => {
    const b = [...document.querySelectorAll(".facet__opt, .pill, .load-more button")]
      .find((e) => e.textContent.includes(t));
    if (!b) throw new Error("no control: " + t);
    b.click();
  }, text);

let allOk = true;

console.log(`\n=== /products  (${BASE})${EXT ? "  [extension attrs injected]" : ""} ===`);
await page.goto(`${BASE}/products/`, { waitUntil: "networkidle2", timeout: 45000 });
allOk &= await step("initial load");
allOk &= await step("filter → Flower Pots", () => click("Flower Pots"));
allOk &= await step("clear → All products", () => click("All products"));
allOk &= await step("load more", () => click("Load "));
allOk &= await step("sort → rate high→low", () =>
  page.select("select.select", "price-desc"));
allOk &= await step("search 'pencil'", async () => {
  await page.click(".search input");
  await page.type(".search input", "pencil", { delay: 12 });
});

console.log(`\n=== /  (home) ===`);
await page.goto(`${BASE}/`, { waitUntil: "networkidle2", timeout: 45000 });
allOk &= await step("initial load");
allOk &= await step("tab → Aerial Shots", () => click("Aerial Shots"));

console.log(`\n=== /products/S201 ===`);
await page.goto(`${BASE}/products/S201/`, { waitUntil: "networkidle2", timeout: 45000 });
const pdp = await page.evaluate(() => {
  const el = document.querySelector(".pdp__now");
  const gal = document.querySelector(".pgal__main img");
  return { price: el?.textContent, gallery: !!gal, galOpacity: gal ? getComputedStyle(gal).opacity : null };
});
console.log(`  price=${pdp.price}  gallery=${pdp.gallery}`);
allOk &= await step("related grid");

console.log(`\nconsole errors: ${errors.length ? JSON.stringify(errors.slice(0, 4)) : "none"}`);
console.log(allOk && !errors.length ? "\nALL PASS\n" : "\nFAILURES PRESENT\n");

await browser.close();
process.exit(allOk && !errors.length ? 0 : 1);
