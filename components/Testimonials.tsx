"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronL, ChevronR, Star } from "./Icons";

const REVIEWS = [
  { q: "We've moved to Sankamithra for our entire Diwali stock. Consistent burst quality, honest counts per box, and the consignment reached Chennai four days early.", n: "Ramesh Kumar", r: "Distributor · Chennai" },
  { q: "As a retailer I care about two things — margin and returns. Their packing is tight, breakage is close to zero, and the price list actually leaves room to trade.", n: "Priya Selvam", r: "Retail chain · Madurai" },
  { q: "The sparklers and flower pots are what my customers ask for by name now. Smoke is noticeably lower than what we stocked before.", n: "Arun Manickam", r: "Wholesaler · Coimbatore" },
  { q: "Bulk order of 400 boxes for a temple festival, delivered with paperwork in order and every carton labelled. That is rarer than it should be.", n: "Kavya Rajan", r: "Event supplier · Salem" },
];

const initials = (name: string) =>
  name.split(/\s+/).slice(0, 2).map((w) => w[0]).join("").toUpperCase();

export default function Testimonials() {
  const [i, setI] = useState(0);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  const restart = useCallback(() => {
    if (timer.current) clearInterval(timer.current);
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    timer.current = setInterval(() => setI((v) => (v + 1) % REVIEWS.length), 7000);
  }, []);

  useEffect(() => {
    restart();
    return () => { if (timer.current) clearInterval(timer.current); };
  }, [restart]);

  const go = (n: number) => { setI((n + REVIEWS.length) % REVIEWS.length); restart(); };

  return (
    <div className="tstm">
      <div className="tstm__main">
        <div
          className="tstm__stage"
          onPointerEnter={() => timer.current && clearInterval(timer.current)}
          onPointerLeave={restart}
        >
          {REVIEWS.map((r, k) => (
            <figure key={r.n} className={`tstm__slide${k === i ? " is-on" : ""}`}>
              <div className="tstm__stars" aria-label="5 out of 5">
                {Array.from({ length: 5 }, (_, s) => <Star key={s} />)}
              </div>
              <blockquote className="tstm__quote">&ldquo;{r.q}&rdquo;</blockquote>
              <figcaption className="tstm__who">
                <span className="tstm__av" aria-hidden="true">{initials(r.n)}</span>
                <span>
                  <span className="tstm__name">{r.n}</span>
                  <span className="tstm__role">{r.r}</span>
                </span>
              </figcaption>
            </figure>
          ))}
        </div>

        <div className="tstm__ctl">
          <button className="tstm__btn" type="button" aria-label="Previous testimonial" onClick={() => go(i - 1)}><ChevronL /></button>
          <button className="tstm__btn" type="button" aria-label="Next testimonial" onClick={() => go(i + 1)}><ChevronR /></button>
          <span className="tstm__idx">
            {String(i + 1).padStart(2, "0")} / {String(REVIEWS.length).padStart(2, "0")}
          </span>
          <span className="tstm__rail"><i style={{ width: ((i + 1) / REVIEWS.length) * 100 + "%" }} /></span>
        </div>
      </div>

      <aside className="tstm__aside" data-reveal="right">
        <div>
          <p className="tstm__score">4.8 <small>/ 5</small></p>
          <p className="tstm__scorenote">Average rating from buyers who reorder</p>
        </div>
        <ul className="tstm__facts">
          <li>Repeat buyers each season <b>78%</b></li>
          <li>Quote turnaround <b>&lt; 1 day</b></li>
          <li>States we despatch to <b>12</b></li>
          <li>Reported breakage <b>&lt; 1%</b></li>
        </ul>
        <a className="btn btn--sm btn--block" href="#contact">Start an enquiry</a>
      </aside>
    </div>
  );
}
