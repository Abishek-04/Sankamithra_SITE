import { FAQ } from "@/lib/faq";

/**
 * Rendered open by default: <details> that start closed hide their answers
 * from some extraction passes, and the whole point of this block is to be
 * quotable. The toggle is a convenience, not a reveal.
 */
export default function Faq() {
  return (
    <section className="section section--alt" id="faq">
      <div className="shell">
        <div className="sec-head sec-head--split">
          <div>
            <span className="eyebrow">Straight answers</span>
            <h2 className="h1" style={{ marginTop: ".7rem" }} data-split="">
              What buyers ask us first.
            </h2>
          </div>
          <p data-reveal="">
            Rates, minimums, paperwork and delivery — the things worth knowing before
            you send a list.
          </p>
        </div>

        <div className="faq" data-stagger="70">
          {FAQ.map((x) => (
            <details className="faq__item" key={x.q} open>
              <summary className="faq__q">
                <span>{x.q}</span>
                <span className="faq__mark" aria-hidden="true" />
              </summary>
              <div className="faq__a"><p>{x.a}</p></div>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
