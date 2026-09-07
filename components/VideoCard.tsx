import Link from "next/link";
import type { Video } from "@/lib/videos";
import { shortTitle, thumb, thumbSrcSet, watchUrl } from "@/lib/videos";
import VideoPlayer from "./VideoPlayer";

/** Server component — only the play facade is interactive. */
export default function VideoCard({
  video,
  index = 0,
  productName,
}: {
  video: Video;
  index?: number;
  productName?: string | null;
}) {
  return (
    <article
      className="vcard"
      data-reveal=""
      style={{ ["--reveal-delay" as string]: Math.min(index, 11) * 0.05 + "s" }}
    >
      <div className="vcard__media">
        <VideoPlayer
          video={video}
          poster={
            <img
              className="vcard__thumb"
              src={thumb(video.id)}
              srcSet={thumbSrcSet(video.id)}
              sizes="(max-width: 420px) 46vw, (max-width: 980px) 30vw, 220px"
              alt=""
              width={320}
              height={180}
              loading="lazy"
              decoding="async"
            />
          }
        >
          {video.duration && <span className="vcard__dur">{video.duration}</span>}
        </VideoPlayer>
      </div>

      <div className="vcard__body">
        <h3 className="vcard__title">{shortTitle(video.title)}</h3>
        <p className="vcard__meta">
          {[video.views, video.published].filter(Boolean).join(" · ")}
        </p>
        <div className="vcard__links">
          {video.sno && (
            <Link className="vcard__sno" href={`/products/${video.sno}`}>
              {video.sno}
              {productName ? ` · ${productName}` : ""}
            </Link>
          )}
          <a
            className="vcard__yt"
            href={watchUrl(video.id)}
            target="_blank"
            rel="noopener"
          >
            YouTube
          </a>
        </div>
      </div>
    </article>
  );
}
