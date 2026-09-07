"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import Brand from "./Brand";
import ThemeToggle from "./ThemeToggle";
import { nav, site } from "@/lib/site";
import { formatPhone } from "@/lib/format";
import { Arrow } from "./Icons";

export default function Nav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [stuck, setStuck] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [spy, setSpy] = useState<string | null>(null);
  const barRef = useRef<HTMLElement>(null);

  /* close the drawer on navigation */
  useEffect(() => setOpen(false), [pathname]);

  useEffect(() => {
    document.body.classList.toggle("is-locked", open);
    return () => document.body.classList.remove("is-locked");
  }, [open]);

  useEffect(() => {
    const bar = barRef.current;
    if (!bar) return;

    /* Every page opens with a pinned-dark band behind the nav. The nav keeps
       the night palette until it has scrolled clear of it, so its links never
       sit invisibly on the dark hero. */
    const band = document.querySelector<HTMLElement>(".hero, .page-head");
    let lastY = scrollY;

    const onScroll = () => {
      const y = scrollY;
      const stickAt = band ? Math.max(24, band.offsetHeight - bar.offsetHeight - 8) : 24;
      setStuck(y > stickAt);

      const delta = y - lastY;
      // a large delta is a jump (anchor link, restored position) — never hide for those
      setHidden(!open && y > 480 && delta > 6 && delta < 140);
      lastY = y;

      const max = document.documentElement.scrollHeight - innerHeight;
      bar.style.setProperty("--p", String(max > 0 ? Math.min(1, Math.max(0, y / max)) : 0));
    };

    addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => removeEventListener("scroll", onScroll);
  }, [open]);

  /* scroll-spy for the in-page sections on the home route */
  useEffect(() => {
    if (pathname !== "/") return void setSpy(null);
    const targets: { id: string; el: HTMLElement }[] = [];
    for (const n of nav) {
      if (!n.spy) continue;
      const el = document.getElementById(n.spy);
      if (el) targets.push({ id: n.spy, el });
    }
    if (!targets.length) return;
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.isIntersecting &&
        setSpy(targets.find((t) => t.el === e.target)?.id ?? null)),
      { rootMargin: "-45% 0px -50% 0px" },
    );
    targets.forEach((t) => io.observe(t.el));
    return () => io.disconnect();
  }, [pathname]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  const onCatalogue = pathname.startsWith("/products");

  return (
    <>
      <header ref={barRef} className={`nav${stuck ? " is-stuck" : ""}${hidden ? " is-hidden" : ""}`} id="nav">
        <div className="nav__inner">
          <Brand priority />

          <nav className="nav__links" aria-label="Primary">
            {nav.map((n) => {
              const active = n.href === "/products" ? onCatalogue : spy === n.spy;
              return (
                <Link
                  key={n.href}
                  className={`nav__link${active ? " is-active" : ""}`}
                  href={n.href}
                  aria-current={active ? "page" : undefined}
                >
                  {n.label}
                </Link>
              );
            })}
          </nav>

          <div className="nav__cta">
            <a className="btn btn--sm btn--desk" href={site.shopUrl} target="_blank" rel="noopener" data-magnetic="0.2">
              Shop Now <span className="btn__ico" aria-hidden="true"><Arrow width={14} height={14} /></span>
            </a>
            <ThemeToggle />
            <button
              className="nav__burger"
              type="button"
              aria-expanded={open}
              aria-controls="drawer"
              aria-label={open ? "Close menu" : "Open menu"}
              onClick={() => setOpen((v) => !v)}
            >
              <span /><span /><span />
            </button>
          </div>

          <span className="nav__progress" aria-hidden="true" />
        </div>
      </header>

      <div className={`drawer tone-night${open ? " is-open" : ""}`} id="drawer">
        <div />
        <div className="drawer__body">
          <nav className="drawer__nav" aria-label="Mobile">
            {nav.map((n, i) => (
              <Link
                key={n.href}
                className="drawer__link"
                href={n.href}
                style={{ transitionDelay: 0.16 + i * 0.06 + "s" }}
                onClick={() => setOpen(false)}
              >
                <i>{String(i + 1).padStart(2, "0")}</i>{n.label}
              </Link>
            ))}
          </nav>
          <div className="drawer__foot">
            <a className="btn btn--block" href={site.shopUrl} target="_blank" rel="noopener">Shop Now</a>
            <div className="drawer__meta">
              <a href={`tel:${site.phonePrimary}`}>{formatPhone(site.phonePrimary)}</a>
              <a href={`mailto:${site.email}`}>{site.email}</a>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
