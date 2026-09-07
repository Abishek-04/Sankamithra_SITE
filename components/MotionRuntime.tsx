"use client";

import { useEffect } from "react";

/**
 * All page motion in one small client island: scroll reveal, word-split
 * headings, counters, parallax, card spotlight, magnetic buttons, cursor and
 * the marquee duplication.
 *
 * Reveal is a rAF-throttled sweep over a pending set rather than an
 * IntersectionObserver — deterministic, and it re-runs on load, resize and
 * route change so a node can never be left permanently invisible.
 */
export default function MotionRuntime() {
  useEffect(() => {
    const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const fine = matchMedia("(hover: hover) and (pointer: fine)").matches;
    const $$ = <T extends Element>(s: string) => Array.from(document.querySelectorAll<T>(s));
    const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
    const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));
    const cleanups: (() => void)[] = [];

    /* ---------------------------------------------------------- split text */
    if (!reduced) {
      $$<HTMLElement>("[data-split]").forEach((el) => {
        if (el.dataset.done) return;
        el.dataset.done = "1";
        const walk = (node: Node, out: Node[]) => {
          node.childNodes.forEach((child) => {
            if (child.nodeType === 3) {
              (child.textContent ?? "").split(/(\s+)/).forEach((tok) => {
                if (!tok) return;
                if (/^\s+$/.test(tok)) return out.push(document.createTextNode(" "));
                const w = document.createElement("span");
                w.className = "split-word";
                w.textContent = tok;
                out.push(w);
              });
            } else if (child.nodeType === 1) {
              const clone = (child as Element).cloneNode(false);
              const inner: Node[] = [];
              walk(child, inner);
              inner.forEach((n) => clone.appendChild(n));
              out.push(clone);
            }
          });
        };
        const parts: Node[] = [];
        walk(el, parts);
        const line = document.createElement("span");
        line.className = "split-line";
        parts.forEach((n) => line.appendChild(n));
        el.textContent = "";
        el.appendChild(line);
        el.querySelectorAll<HTMLElement>(".split-word").forEach((w, i) =>
          w.style.setProperty("--w-delay", i * 0.055 + "s"),
        );
        if (!el.hasAttribute("data-reveal")) el.setAttribute("data-reveal", "clip");
      });
    }

    /* ------------------------------------------------------------ stagger */
    const stagger = () => $$<HTMLElement>("[data-stagger]").forEach((wrap) => {
      if (wrap.dataset.done) return;
      wrap.dataset.done = "1";
      const step = parseFloat(wrap.dataset.stagger || "") || 90;
      Array.from(wrap.children).forEach((child, i) => {
        if (!child.hasAttribute("data-reveal")) child.setAttribute("data-reveal", "");
        (child as HTMLElement).style.setProperty("--reveal-delay", (i * step) / 1000 + "s");
      });
    });
    stagger();

    /* ------------------------------------------------------------- reveal
       The sweep queries the DOM live rather than holding a captured node
       list. Anything that replaces nodes — a filter, a category tab, load
       more, a route change, or React rebuilding the tree after a hydration
       mismatch — would otherwise leave the new elements registered nowhere
       and stuck at opacity 0. A debounced MutationObserver catches nodes
       added without a scroll. */

    const applyDelay = (n: HTMLElement) => {
      if (n.dataset.rvInit) return;
      n.dataset.rvInit = "1";
      const d = n.getAttribute("data-delay");
      if (d) n.style.setProperty("--reveal-delay", parseFloat(d) / 1000 + "s");
    };

    if (reduced) {
      const revealAll = () =>
        $$<HTMLElement>("[data-reveal]:not(.is-revealed)").forEach((n) => n.classList.add("is-revealed"));
      revealAll();
      const mo = new MutationObserver(revealAll);
      mo.observe(document.body, { childList: true, subtree: true });
      cleanups.push(() => mo.disconnect());
    } else {
      let queued = false;
      const sweep = () => {
        queued = false;
        const vh = innerHeight;
        for (const n of $$<HTMLElement>("[data-reveal]:not(.is-revealed)")) {
          applyDelay(n);
          const r = n.getBoundingClientRect();
          // reveal once the top edge crosses 92% of the viewport
          if (r.top < vh * 0.92 && r.bottom > -40) n.classList.add("is-revealed");
        }
      };
      const queue = () => {
        if (queued) return;
        queued = true;
        requestAnimationFrame(sweep);
      };

      addEventListener("scroll", queue, { passive: true });
      addEventListener("resize", queue, { passive: true });
      addEventListener("load", queue);

      const mo = new MutationObserver(queue);
      mo.observe(document.body, { childList: true, subtree: true });

      queue();

      cleanups.push(() => {
        removeEventListener("scroll", queue);
        removeEventListener("resize", queue);
        removeEventListener("load", queue);
        mo.disconnect();
      });
    }

    /* ----------------------------------------------------------- counters */
    const counters = $$<HTMLElement>("[data-count]");
    if (counters.length) {
      const io = new IntersectionObserver(
        (entries) => {
          entries.forEach((e) => {
            if (!e.isIntersecting) return;
            const el = e.target as HTMLElement;
            io.unobserve(el);
            const target = parseFloat(el.dataset.count || "0");
            if (reduced) return void (el.textContent = String(target));
            const t0 = performance.now();
            const tick = (t: number) => {
              const p = clamp((t - t0) / 1500, 0, 1);
              el.textContent = String(Math.round(target * (1 - Math.pow(1 - p, 3))));
              if (p < 1) requestAnimationFrame(tick);
            };
            requestAnimationFrame(tick);
          });
        },
        { threshold: 0.4 },
      );
      counters.forEach((el) => io.observe(el));
      cleanups.push(() => io.disconnect());
    }

    /* ----------------------------------------------------------- parallax */
    if (!reduced) {
      const items = $$<HTMLElement>("[data-parallax]");
      if (items.length) {
        let ticking = false;
        const update = () => {
          ticking = false;
          const vh = innerHeight;
          items.forEach((el) => {
            const r = el.getBoundingClientRect();
            if (r.bottom < -200 || r.top > vh + 200) return;
            const speed = parseFloat(el.dataset.parallax || "") || 0.12;
            const centre = r.top + r.height / 2 - vh / 2;
            const limit = Math.min(64, r.height * 0.06);
            el.style.setProperty("--par", clamp(-centre * speed, -limit, limit).toFixed(1) + "px");
          });
        };
        const onScroll = () => {
          if (ticking) return;
          ticking = true;
          requestAnimationFrame(update);
        };
        addEventListener("scroll", onScroll, { passive: true });
        addEventListener("resize", onScroll, { passive: true });
        update();
        cleanups.push(() => {
          removeEventListener("scroll", onScroll);
          removeEventListener("resize", onScroll);
        });
      }
    }

    /* ---------------------------------------------------------- spotlight */
    if (fine) {
      const onMove = (e: PointerEvent) => {
        const el = (e.target as Element)?.closest?.(".card, .pcard, .assure__c, .info-card") as HTMLElement | null;
        if (!el) return;
        const r = el.getBoundingClientRect();
        el.style.setProperty("--mx", ((e.clientX - r.left) / r.width) * 100 + "%");
        el.style.setProperty("--my", ((e.clientY - r.top) / r.height) * 100 + "%");
      };
      document.addEventListener("pointermove", onMove, { passive: true });
      cleanups.push(() => document.removeEventListener("pointermove", onMove));
    }

    /* ----------------------------------------------------------- magnetic */
    if (fine && !reduced) {
      $$<HTMLElement>("[data-magnetic]").forEach((el) => {
        const strength = parseFloat(el.dataset.magnetic || "") || 0.28;
        let raf: number | null = null, tx = 0, ty = 0, cx = 0, cy = 0;
        const loop = () => {
          cx = lerp(cx, tx, 0.18);
          cy = lerp(cy, ty, 0.18);
          el.style.transform = `translate3d(${cx.toFixed(2)}px, ${cy.toFixed(2)}px, 0)`;
          raf = Math.abs(cx - tx) > 0.1 || Math.abs(cy - ty) > 0.1 ? requestAnimationFrame(loop) : null;
        };
        const kick = () => { if (!raf) raf = requestAnimationFrame(loop); };
        el.addEventListener("pointermove", (e) => {
          const r = el.getBoundingClientRect();
          tx = (e.clientX - (r.left + r.width / 2)) * strength;
          ty = (e.clientY - (r.top + r.height / 2)) * strength;
          kick();
        });
        el.addEventListener("pointerleave", () => { tx = 0; ty = 0; kick(); });
      });
    }

    /* ------------------------------------------------------------- cursor */
    if (fine && !reduced) {
      const dot = document.createElement("div");
      dot.className = "cursor";
      dot.setAttribute("aria-hidden", "true");
      document.body.appendChild(dot);
      let x = -100, y = -100, cx = -100, cy = -100, raf = 0;
      const onMove = (e: PointerEvent) => { x = e.clientX; y = e.clientY; };
      document.addEventListener("pointermove", onMove, { passive: true });
      const loop = () => {
        cx = lerp(cx, x, 0.2);
        cy = lerp(cy, y, 0.2);
        dot.style.transform = `translate3d(${cx - 13}px, ${cy - 13}px, 0)`;
        raf = requestAnimationFrame(loop);
      };
      loop();
      const HOT = "a, button, .pcard, [data-cursor]";
      const over = (e: Event) => (e.target as Element)?.closest?.(HOT) && dot.classList.add("is-hot");
      const out = (e: Event) => (e.target as Element)?.closest?.(HOT) && dot.classList.remove("is-hot");
      document.addEventListener("pointerover", over);
      document.addEventListener("pointerout", out);
      cleanups.push(() => {
        cancelAnimationFrame(raf);
        document.removeEventListener("pointermove", onMove);
        document.removeEventListener("pointerover", over);
        document.removeEventListener("pointerout", out);
        dot.remove();
      });
    }

    /* ------------------------------------------------------------ marquee */
    $$<HTMLElement>(".marquee").forEach((m) => {
      if (m.dataset.done) return;
      m.dataset.done = "1";
      const track = m.querySelector(".marquee__track");
      if (!track) return;
      const copy = track.cloneNode(true) as HTMLElement;
      copy.setAttribute("aria-hidden", "true");
      m.appendChild(copy);
    });

    return () => cleanups.forEach((fn) => fn());
  }, []);

  return null;
}
