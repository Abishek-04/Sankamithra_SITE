/**
 * Pull the Sankamithra Crackers channel listing into data/videos.json.
 *
 *   npm run videos
 *
 * No API key: YouTube's own channel page carries the listing in
 * `ytInitialData`, and the RSS feed is used as a fallback if that markup
 * changes shape. Data is baked in at build time, so the site itself never
 * calls YouTube — visitors only load a thumbnail, and only load the player
 * after they click.
 */
import { writeFileSync } from "node:fs";

const HANDLE = "@SankamithraCrackers";
const CHANNEL_ID = "UCB36TMbhV0DYELSCbEnuWdw";
const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0 Safari/537.36";


/**
 * videoId → S.No on the 2026 price list.
 *
 * Kept explicit rather than fuzzy-matched on the title: a name-similarity pass
 * confidently paired "Chakkar BIG (10 Pcs)" with S301, the 25-piece box. A
 * wrong link on a price list is worse than no link, so each pairing here was
 * read off the title by hand. Videos absent from this map still appear in the
 * channel grid; they just don't claim to be a particular item.
 *
 * Unmapped on purpose:
 *   ySvnqwXAVuc  Tiger Deluxe  — not on the 2026 list
 *   5JzZzzVYjgo  Rocket bomb   — rockets are not on the 2026 list
 *   K0l7jo5Kxa8  Colour rocket — ditto
 *   WIiQcbP-12w  Baby Rocket   — ditto
 *   pegQkkM4uN4  Chakkar BIG   — title omits the piece count; S301 and S302
 *                               differ only by that, so it is left unclaimed
 */
const PRODUCT_OF = {
  "LI29PEaqtFY": "S118", // The Leader
  "CE0qrTEKK4w": "S109", // Kids Star Wars
  "jXTjkP7SPkc": "S104", // Popcorn Pencil
  "Z546wwx6NnU": "S102", // Sound Party
  "w7wgjn-Z9hA": "S107", // Kalashinkov
  "c-kfrTjG1s8": "S207", // Zippy
  "ON1jBJZAHe8": "S212", // Thanos Mega Deluxe
  "mLGWUw-HQgI": "S213", // Shiva Mega Deluxe
  "FgPU_Z4416E": "S214", // Lion Mega Deluxe
  "YLJncQKXh18": "S204", // Lakshmi  (plain, not the Deluxe S209)
  "6WLtpnf-UDE": "S201", // Kuruvi
  "1pBgaktb4sk": "S208", // Dead Pool Deluxe
  "oagKiRjfp-8": "S203", // Chhoto Beam
  "I95rGGobM-Q": "S205", // Ant-Man
  "8TGZKrlXsiM": "S302", // Ground Chakkar Big — title says 10 Pcs
  "Wl7uYaY2cpI": "S103", // Oola Vedi
  "JWloEXw9ZIg": "S107", // Kalashinkov (second take)
  "BIM3lneNE10": "S116", // Badaa Peacock
  "ZMuLvRQ1DkA": "S101", // Lucky Money
  "vyZ0H01QRoY": "S354", // Flower Pots Asoka
  "v-sePmBKR1w": "S356", // Flower Pots Deluxe
  "pXNDqYAc97A": "S604", // 60 Shots Gravity
  "cIwHQ5epAfY": "S603", // 30 Shots CR7
  "hX0ZH1pdbGc": "S211", // Gold Ben10 Deluxe
  "EA7ASBm0OtU": "S210", // Little Singam Deluxe
};

const text = (n) =>
  typeof n === "string" ? n : n?.content ?? n?.simpleText ?? n?.runs?.map((r) => r.text).join("") ?? "";

/** Depth-first collect of every node carrying `key`. */
function collect(node, key, out = []) {
  if (Array.isArray(node)) node.forEach((n) => collect(n, key, out));
  else if (node && typeof node === "object") {
    if (key in node) out.push(node[key]);
    Object.values(node).forEach((v) => collect(v, key, out));
  }
  return out;
}

function fromLockup(lock) {
  const id = lock?.contentId;
  if (!id || lock?.contentType !== "LOCKUP_CONTENT_TYPE_VIDEO") return null;

  const meta = lock?.metadata?.lockupMetadataViewModel;
  const title = text(meta?.title).trim();
  if (!title) return null;

  // "12K views" and "3 weeks ago" arrive as separate metadata parts
  const parts = collect(meta?.metadata, "metadataParts")
    .flat()
    .map((p) => text(p?.text).trim())
    .filter(Boolean);

  // duration badge sits on the thumbnail overlay
  const duration =
    collect(lock?.contentImage, "thumbnailBadgeViewModel")
      .map((b) => (b?.text || "").trim())
      .find((t) => /^\d+:\d{2}/.test(t)) || null;

  return {
    id,
    title,
    views: parts.find((p) => /view/i.test(p)) ?? null,
    published: parts.find((p) => /ago$/i.test(p)) ?? null,
    duration,
    // shorts are vertical; keep them flagged so the UI can lay them out right
    short: duration ? toSeconds(duration) <= 60 : false,
  };
}

const toSeconds = (d) =>
  d.split(":").reverse().reduce((acc, v, i) => acc + Number(v) * 60 ** i, 0);

async function fromChannelPage() {
  const res = await fetch(`https://www.youtube.com/${HANDLE}/videos`, {
    headers: { "User-Agent": UA, "Accept-Language": "en-US,en;q=0.9" },
  });
  if (!res.ok) throw new Error(`channel page ${res.status}`);
  const html = await res.text();
  const m = html.match(/var ytInitialData = (\{.*?\});<\/script>/s);
  if (!m) throw new Error("ytInitialData not present");

  const seen = new Set();
  return collect(JSON.parse(m[1]), "lockupViewModel")
    .map(fromLockup)
    .filter((v) => v && !seen.has(v.id) && seen.add(v.id));
}

/** RSS carries the latest 15 with titles and real dates — enough to not go dark. */
async function fromFeed() {
  const res = await fetch(
    `https://www.youtube.com/feeds/videos.xml?channel_id=${CHANNEL_ID}`,
    { headers: { "User-Agent": UA } },
  );
  if (!res.ok) throw new Error(`feed ${res.status}`);
  const xml = await res.text();
  return [...xml.matchAll(/<entry>(.*?)<\/entry>/gs)].map((e) => {
    const g = (re) => (e[1].match(re) || [])[1] ?? null;
    return {
      id: g(/<yt:videoId>([^<]+)</),
      title: (g(/<title>([^<]+)</) || "").replace(/&amp;/g, "&"),
      views: null,
      published: g(/<published>([^<]+)</),
      duration: null,
      short: false,
    };
  }).filter((v) => v.id);
}

let videos = [];
try {
  videos = await fromChannelPage();
  console.log(`  channel page → ${videos.length} videos`);
} catch (err) {
  console.warn(`  channel page failed (${err.message}); falling back to RSS`);
  videos = await fromFeed();
  console.log(`  RSS feed → ${videos.length} videos`);
}

videos = videos.map((v) => ({ ...v, sno: PRODUCT_OF[v.id] ?? null }));

const unmapped = videos.filter((v) => !v.sno);
if (unmapped.length) {
  console.log(`  ${videos.length - unmapped.length} linked to a product, ${unmapped.length} unlinked:`);
  unmapped.forEach((v) => console.log(`      ${v.id}  ${v.title.split("|")[0].trim()}`));
}

if (!videos.length) {
  console.error("  no videos found — leaving data/videos.json untouched");
  process.exit(1);
}

const payload = {
  channel: {
    handle: HANDLE,
    id: CHANNEL_ID,
    url: `https://www.youtube.com/${HANDLE}`,
    name: "Sankamithra Crackers",
  },
  fetchedAt: new Date().toISOString().slice(0, 10),
  videos,
};

writeFileSync("data/videos.json", JSON.stringify(payload, null, 1) + "\n");
console.log(`  wrote data/videos.json — ${videos.length} videos, ${videos.filter(v => v.short).length} shorts`);
