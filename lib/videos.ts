import "server-only";
import { readFileSync } from "node:fs";
import { join } from "node:path";

export type Video = {
  id: string;
  title: string;
  views: string | null;
  published: string | null;
  duration: string | null;
  /** vertical, ≤60s — laid out 9:16 rather than 16:9 */
  short: boolean;
  /** S.No on the 2026 price list, when the video demos a listed item */
  sno: string | null;
};

export type Channel = {
  handle: string;
  id: string;
  url: string;
  name: string;
};

type Feed = { channel: Channel; fetchedAt: string; videos: Video[] };

let cache: Feed | null = null;

/** Read once at build time — the site never calls YouTube itself. */
function feed(): Feed {
  if (!cache) {
    cache = JSON.parse(
      readFileSync(join(process.cwd(), "data", "videos.json"), "utf8"),
    ) as Feed;
  }
  return cache;
}

export const getChannel = () => feed().channel;
export const getVideos = () => feed().videos;

/** The demo for one price-list item, if the channel has one. */
export const getVideoForProduct = (sno: string) =>
  feed().videos.find((v) => v.sno === sno) ?? null;

/** Strip the trailing " | Category | Sankamithra Fireworks" boilerplate. */
export const shortTitle = (t: string) => t.split("|")[0].trim();

/**
 * These are short *landscape* films, not vertical Shorts — the frames are a
 * true 16:9. `mqdefault` (320×180, ~12 KB) matches the card at 1x and
 * `maxresdefault` (1280×720) covers retina. `hqdefault` is avoided: it is
 * 4:3 and letterboxes the frame, which crops the on-screen product name.
 */
export const thumb = (id: string) => `https://i.ytimg.com/vi/${id}/mqdefault.jpg`;
export const thumbHi = (id: string) => `https://i.ytimg.com/vi/${id}/maxresdefault.jpg`;
export const thumbSrcSet = (id: string) =>
  `${thumb(id)} 320w, ${thumbHi(id)} 1280w`;

export const watchUrl = (id: string) => `https://www.youtube.com/watch?v=${id}`;
