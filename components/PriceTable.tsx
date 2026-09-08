import Link from "next/link";
import { getProducts } from "@/lib/products";
import { money, perLabel } from "@/lib/format";
import { site } from "@/lib/site";

/**
 * The complete 2026 sheet as a real table.
 *
 * The card grid above paginates to 24, which means a crawler — or an answer
 * engine asked "what does Sankamithra charge for a Kuruvi cracker" — only ever
 * saw a quarter of the list. Every one of the 91 rows is in this markup,
 * unfiltered and unpaginated, and it happens to be the format a buyer wants to
 * scan or print anyway.
 */
export default function PriceTable() {
  const products = getProducts();

  // group under the printed section headings
  const groups: { category: string; rows: typeof products }[] = [];
  for (const p of products) {
    const last = groups[groups.length - 1];
    if (last && last.category === p.category) last.rows.push(p);
    else groups.push({ category: p.category, rows: [p] });
  }

  return (
    <section className="ptable-wrap" id="price-table">
      <div className="sec-head">
        <span className="eyebrow">Every row</span>
        <h2 className="h2" style={{ marginTop: ".6rem" }}>
          The complete {site.priceList.label}
        </h2>
        <p>
          All {products.length} items as printed. Rates are ex-factory and quoted per the
          unit in the “Per” column — {site.priceList.effective.toLowerCase()}.
        </p>
      </div>

      <div className="ptable-scroll">
        <table className="ptable">
          <caption className="sr-only">
            Sankamithra Fireworks {site.priceList.label} — {products.length} items with S.No,
            box contents, rate, rate unit and case quantity.
          </caption>
          <thead>
            <tr>
              <th scope="col">S.No</th>
              <th scope="col">Item</th>
              <th scope="col">Box contents</th>
              <th scope="col" className="ptable--num">Rate</th>
              <th scope="col">Per</th>
              <th scope="col">Cs / Cont</th>
            </tr>
          </thead>
          {groups.map((g) => (
            <tbody key={g.category}>
              <tr className="ptable__group">
                <th scope="rowgroup" colSpan={6}>
                  {g.category} <span>{g.rows.length} items</span>
                </th>
              </tr>
              {g.rows.map((p) => (
                <tr key={p.sno}>
                  <th scope="row" className="ptable__sno">
                    <Link href={`/products/${p.sno}`}>{p.sno}</Link>
                  </th>
                  <td className="ptable__name">
                    <Link href={`/products/${p.sno}`}>{p.name}</Link>
                  </td>
                  <td>{p.contents || "—"}</td>
                  <td className="ptable--num ptable__rate">{money(p.price)}</td>
                  <td>{perLabel(p.per)}</td>
                  <td>{p.case}</td>
                </tr>
              ))}
            </tbody>
          ))}
        </table>
      </div>
    </section>
  );
}
