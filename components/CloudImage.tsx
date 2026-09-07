import { site } from "@/lib/site";

/**
 * A plain <img> with a Cloudinary-built srcset.
 *
 * next/image would do the same job, but it ships a client runtime to do it and
 * Cloudinary already handles format negotiation, quality and resizing. This
 * renders as pure markup in a server component and costs zero JS.
 */
const WIDTHS = [320, 420, 560, 768, 1024, 1280, 1600, 2048];

function url(id: string, w: number, extra = "") {
  return `https://res.cloudinary.com/${site.cloudName}/image/upload/f_auto,q_auto,c_limit,w_${w}${extra}/${id}`;
}

export default function CloudImage({
  id,
  alt,
  sizes,
  width,
  height,
  className,
  priority = false,
  fill = false,
  maxWidth = 2048,
  style,
  ref,
  ...rest
}: {
  /** Cloudinary public ID */
  id: string;
  alt: string;
  sizes: string;
  width?: number;
  height?: number;
  className?: string;
  /** eager + high fetch priority — only for what is above the fold */
  priority?: boolean;
  /** absolutely fill the positioned parent */
  fill?: boolean;
  maxWidth?: number;
  style?: React.CSSProperties;
  ref?: React.Ref<HTMLImageElement>;
} & Omit<React.ImgHTMLAttributes<HTMLImageElement>, "src" | "srcSet" | "sizes" | "width" | "height" | "style" | "ref">) {
  const widths = WIDTHS.filter((w) => w <= maxWidth);
  const srcSet = widths.map((w) => `${url(id, w)} ${w}w`).join(", ");

  return (
    <img
      ref={ref}
      src={url(id, Math.min(1024, maxWidth))}
      srcSet={srcSet}
      sizes={sizes}
      alt={alt}
      width={fill ? undefined : width}
      height={fill ? undefined : height}
      className={className}
      loading={priority ? "eager" : "lazy"}
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      fetchPriority={priority ? "high" : undefined}
      decoding={priority ? "sync" : "async"}
      style={fill ? { position: "absolute", inset: 0, width: "100%", height: "100%", ...style } : style}
      {...rest}
    />
  );
}

/** Local asset (logo, lockup) — small, already optimal, no CDN round trip. */
export function LocalImage(props: React.ImgHTMLAttributes<HTMLImageElement>) {
  // eslint-disable-next-line jsx-a11y/alt-text, @next/next/no-img-element
  return <img decoding="async" {...props} />;
}
