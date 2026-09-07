import { getChannel, getVideos } from "@/lib/videos";
import { getProduct } from "@/lib/products";
import VideoCard from "./VideoCard";
import VideoWall from "./VideoWall";
import { Arrow } from "./Icons";

/** Server component: builds every card as HTML, hands the filter a client shell. */
export default function ChannelSection() {
  const channel = getChannel();
  const videos = getVideos();

  const linked = videos.filter((v) => v.sno).length;

  const cards = videos.map((v, i) => (
    <VideoCard
      key={v.id}
      video={v}
      index={i}
      productName={v.sno ? getProduct(v.sno)?.name.replace(/\s*\([^)]*\)\s*$/, "") : null}
    />
  ));

  /* group by the category segment of the title, e.g. "… | One Sound | …" */
  const keys = videos.map((v) => {
    const seg = (v.title.split("|")[1] ?? "").trim().toLowerCase();
    const k: string[] = [];
    if (/special/.test(seg)) k.push("specials");
    else if (/one sound/.test(seg)) k.push("onesound");
    else if (/chakkar/.test(seg)) k.push("chakkars");
    else if (/flowerpot|flower pot/.test(seg)) k.push("pots");
    else if (/repeating/.test(seg)) k.push("repeating");
    else if (/rocket/.test(seg)) k.push("rockets");
    if (v.sno) k.push("linked");
    return k;
  });

  const count = (id: string) =>
    id === "all" ? videos.length : keys.filter((k) => k.includes(id)).length;

  const filters = [
    { id: "all", label: "All videos" },
    { id: "specials", label: "Specials" },
    { id: "onesound", label: "One Sound" },
    { id: "chakkars", label: "Chakkars" },
    { id: "pots", label: "Flower Pots" },
    { id: "repeating", label: "Repeating Shots" },
    { id: "rockets", label: "Rockets" },
    { id: "linked", label: "On the price list" },
  ]
    .map((f) => ({ ...f, count: count(f.id) }))
    .filter((f) => f.count > 0);

  return (
    <section className="section" id="videos">
      <div className="glow-orb" style={{ width: 520, height: 520, background: "#f50026", top: "6%", right: "-14%", opacity: 0.12 }} aria-hidden="true" />
      <div className="shell">
        <div className="sec-head sec-head--split">
          <div>
            <span className="eyebrow">Watch it fire</span>
            <h2 className="h1" style={{ marginTop: ".7rem" }} data-split="">
              See it before you stock it.
            </h2>
          </div>
          <div style={{ display: "grid", gap: "1.15rem", justifyItems: "start" }}>
            <p data-reveal="">
              Every clip is our own product, filmed on our own range — {videos.length} of them,
              and {linked} link straight to the item on the 2026 price list.
            </p>
            <a
              className="btn btn--ghost"
              href={channel.url}
              target="_blank"
              rel="noopener"
              data-reveal=""
              data-delay="120"
            >
              <span className="yt-mark" aria-hidden="true">
                <svg viewBox="0 0 28 20" width="22" height="16" fill="currentColor">
                  <path d="M27.4 3.1A3.5 3.5 0 0 0 24.9.6C22.7 0 14 0 14 0S5.3 0 3.1.6A3.5 3.5 0 0 0 .6 3.1C0 5.3 0 10 0 10s0 4.7.6 6.9a3.5 3.5 0 0 0 2.5 2.5c2.2.6 10.9.6 10.9.6s8.7 0 10.9-.6a3.5 3.5 0 0 0 2.5-2.5c.6-2.2.6-6.9.6-6.9s0-4.7-.6-6.9z" />
                  <path d="M11.2 14.3 18.4 10l-7.2-4.3z" fill="var(--bg)" />
                </svg>
              </span>
              Open the channel
              <span className="btn__ico" aria-hidden="true"><Arrow /></span>
            </a>
          </div>
        </div>

        <VideoWall filters={filters} cards={cards} keys={keys} />
      </div>
    </section>
  );
}
