"use client";

import { useEffect, useState } from "react";
import { site } from "@/lib/site";
import { Up, Whatsapp } from "./Icons";

export default function Fabs() {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const onScroll = () => setShow(scrollY > 700);
    addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className="fab-stack">
      <button
        className={`fab fab--top${show ? " is-on" : ""}`}
        type="button"
        aria-label="Back to top"
        onClick={() => scrollTo({ top: 0, behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" })}
      >
        <Up />
      </button>
      <a className="fab fab--wa" href={`https://wa.me/${site.whatsapp}`} target="_blank" rel="noopener" aria-label="Chat on WhatsApp">
        <Whatsapp width={24} height={24} />
      </a>
    </div>
  );
}
