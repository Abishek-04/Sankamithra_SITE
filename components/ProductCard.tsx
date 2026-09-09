import CloudImage from "./CloudImage";
import Link from "next/link";
import type { CardProduct } from "@/lib/card";
import { money, moneyFine, perLabel, unitPrice } from "@/lib/format";
import { Arrow } from "./Icons";

/**
 * One row of the printed price list:
 * S.No · Item Name · Box Contents · Price · Per rate · Cs/Cont
 * `showPrice={false}` drops the rate for surfaces that quote on enquiry.
 *
 * Server component — the whole grid ships as HTML with no client cost.
 */
export default function ProductCard({
  p,
  index = 0,
  priority = false,
  sizes = "(max-width: 560px) 50vw, (max-width: 980px) 33vw, 25vw",
  showPrice = true,
}: {
  p: CardProduct;
  index?: number;
  priority?: boolean;
  sizes?: string;
  /** The catalogue grid quotes on enquiry, so it renders the card without a rate. */
  showPrice?: boolean;
}) {
  const unit = showPrice ? unitPrice(p) : null;
  const img = p.img;

  return (
    <article
      className="pcard"
      data-reveal=""
      style={{ ["--reveal-delay" as string]: Math.min(index, 11) * 0.055 + "s" }}
    >
      <div className={`pcard__media${img ? "" : " is-noimg"}`}>
        {img && (
          <CloudImage id={img} alt={p.name} fill sizes={sizes} priority={priority} maxWidth={768} />
        )}
        <div className="pcard__badges">
          <span className="pcard__sno">{p.sno}</span>
        </div>
      </div>

      <div className="pcard__body">
        <h3 className="pcard__name">{p.name}</h3>

        {showPrice && (
          <div className="pcard__price">
            <span className="pcard__amt">{money(p.price)}</span>
            <span className="pcard__per">per {perLabel(p.per)}</span>
          </div>
        )}
        {unit && <p className="pcard__each">{moneyFine(unit.each)} per packet</p>}

        <dl className="pcard__spec">
          {p.contents && (
            <div><dt>Box contents</dt><dd>{p.contents}</dd></div>
          )}
          <div><dt>Cs / Cont</dt><dd>{p.case}</dd></div>
        </dl>
      </div>

      <span className="pcard__arrow" aria-hidden="true"><Arrow /></span>
      <Link className="pcard__go" href={`/products/${p.sno}`}>
        <span className="sr-only">{p.sno} — {p.name}</span>
      </Link>
    </article>
  );
}
