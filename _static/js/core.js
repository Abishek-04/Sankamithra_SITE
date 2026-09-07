/* ==========================================================================
   Sankamithra — core runtime
   Data layer · scroll reveal · nav · motion utilities · shared UI
   ========================================================================== */
(function () {
  "use strict";

  const CFG = window.SANKA;
  const $ = (sel, ctx) => (ctx || document).querySelector(sel);
  const $$ = (sel, ctx) => Array.from((ctx || document).querySelectorAll(sel));
  const REDUCED = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const FINE_POINTER = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

  /* ---------------------------------------------------------------- utils */

  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const lerp = (a, b, t) => a + (b - a) * t;

  const esc = (s) =>
    String(s == null ? "" : s).replace(/[&<>"']/g, (c) => (
      { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]
    ));

  const money = (n) =>
    "₹" + Number(n || 0).toLocaleString("en-IN", { maximumFractionDigits: 0 });

  /** Derived per-piece rates keep paise; a whole rupee drops the ".00". */
  const moneyFine = (n) => {
    const v = Number(n || 0);
    if (v >= 100 || Number.isInteger(v)) return money(Math.round(v));
    return "₹" + v.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  /** "1 Box" reads badly after the word "per" — drop the redundant leading 1. */
  const perLabel = (per) => {
    const t = String(per || "unit").trim();
    return t.startsWith("1 ") ? t.slice(2).toLowerCase() : t;
  };

  /**
   * Build a Cloudinary delivery URL for a public id.
   * Absolute URLs and data URIs are passed through untouched, so a feed can
   * mix hosted assets in during a migration.
   */
  const imgURL = (id, width) => {
    if (!id) return "";
    if (/^(https?:|data:|\/)/i.test(id)) return id;
    const t = CFG.CLOUD_TRANSFORM + (width ? ",w_" + width : "");
    return `https://res.cloudinary.com/${CFG.CLOUD_NAME}/image/upload/${t}/${id}`;
  };

  /** srcset across 1x/2x so retina cards stay sharp without over-fetching. */
  const imgSrcset = (id, width) =>
    !id || /^(https?:|data:|\/)/i.test(id)
      ? ""
      : `${imgURL(id, width)} 1x, ${imgURL(id, width * 2)} 2x`;

  function debounce(fn, ms) {
    let t;
    return function () {
      clearTimeout(t);
      const a = arguments, c = this;
      t = setTimeout(() => fn.apply(c, a), ms);
    };
  }

  /* ------------------------------------------------------------ data layer */

  let _cache = null;
  let _inflight = null;

  async function getProducts() {
    if (_cache) return _cache;
    if (_inflight) return _inflight;

    _inflight = (async () => {
      const res = await fetch(CFG.PRODUCTS_URL, { cache: "no-cache" });
      if (!res.ok) throw new Error("Product feed " + res.status);
      const raw = await res.json();
      // Tolerate both the local shape and a future API shape.
      const list = Array.isArray(raw) ? raw : raw.products || raw.data || [];
      _cache = list.map(normalise).filter((p) => p.name && p.sno);
      return _cache;
    })();

    try {
      return await _inflight;
    } finally {
      _inflight = null;
    }
  }

  /**
   * Normalise one price-list row. Field names follow the printed columns:
   * S.No, Item Name, Box Contents, Price, Per rate, Cs/Cont.
   * Also tolerates a Mongo document that still uses the older key names.
   */
  function normalise(p) {
    const sno = String(p.sno || p.sku || p.code || "").trim();
    return {
      sno,
      id: sno || String(p.id != null ? p.id : p._id || ""),
      slug: p.slug || sno.toLowerCase(),
      name: (p.name || p.itemName || "").trim(),
      category: (p.category || "Others").trim(),
      categoryOrder: Number(p.categoryOrder) || 99,
      contents: (p.contents || p.boxContents || "").trim(),
      price: Number(p.price) || 0,
      per: (p.per || p.perRate || "").trim(),
      case: (p.case || p.csCont || "").trim(),
      unitNote: (p.unitNote || "").trim(),
      images: (p.images || p.image || []).filter(Boolean),
    };
  }

  /** Unit price when the row is quoted per 1000/750/450 packets etc. */
  function unitPrice(p) {
    const m = /^(\d+)\s/.exec(p.per || "");
    if (!m) return null;
    const qty = parseInt(m[1], 10);
    if (!qty || qty < 2) return null;
    return { qty, each: p.price / qty, unit: p.per.replace(/^\d+\s*/, "") };
  }

  function groupByCategory(list) {
    const map = new Map();
    // walk in printed-catalogue order so the Map's iteration order matches
    list.slice()
      .sort((a, b) => a.categoryOrder - b.categoryOrder)
      .forEach((p) => {
        if (!map.has(p.category)) map.set(p.category, []);
        map.get(p.category).push(p);
      });
    return map;
  }

  /* --------------------------------------------------------- product image
     Pack photography lives on Cloudinary. Where a product has no photo yet,
     the tile paints a branded placeholder rather than a broken image.
     ------------------------------------------------------------------- */

  function mountProductImage(mount, publicId, alt, width) {
    if (!publicId) {
      mount.classList.add("is-noimg");
      return;
    }
    const w = width || CFG.IMG_W_CARD;
    const im = new Image();
    im.alt = alt || "";
    im.loading = "lazy";
    im.decoding = "async";
    im.addEventListener("load", () => mount.classList.add("has-img"), { once: true });
    im.addEventListener("error", () => {
      mount.classList.add("is-noimg");
      im.remove();
    }, { once: true });
    const ss = imgSrcset(publicId, w);
    if (ss) im.srcset = ss;
    im.src = imgURL(publicId, w);
    mount.prepend(im);
  }

  /* ------------------------------------------------------- scroll reveal
     A single rAF-throttled pass over a pending set, rather than an
     IntersectionObserver. Deterministic: it also runs on load, on resize and
     after programmatic scrolls (deep links, back/forward), so a node can
     never be left permanently invisible because a callback didn't schedule.
     ------------------------------------------------------------------- */

  const pending = new Set();
  let revealQueued = false;
  let revealBound = false;

  function sweepReveal() {
    revealQueued = false;
    if (!pending.size) return;

    const vh = window.innerHeight;
    pending.forEach((n) => {
      const r = n.getBoundingClientRect();
      // reveal once the top edge crosses 92% of the viewport
      if (r.top < vh * 0.92 && r.bottom > -40) {
        n.classList.add("is-revealed");
        pending.delete(n);
      }
    });
  }

  function queueReveal() {
    if (revealQueued) return;
    revealQueued = true;
    requestAnimationFrame(sweepReveal);
  }

  function initReveal(root) {
    const nodes = $$("[data-reveal]", root || document).filter((n) => !n.__rv);
    if (!nodes.length) return;

    if (REDUCED) {
      nodes.forEach((n) => { n.__rv = 1; n.classList.add("is-revealed"); });
      return;
    }

    nodes.forEach((n) => {
      n.__rv = 1;
      const d = n.getAttribute("data-delay");
      if (d) n.style.setProperty("--reveal-delay", parseFloat(d) / 1000 + "s");
      pending.add(n);
    });

    if (!revealBound) {
      revealBound = true;
      window.addEventListener("scroll", queueReveal, { passive: true });
      window.addEventListener("resize", queueReveal, { passive: true });
      window.addEventListener("load", queueReveal);
      window.addEventListener("hashchange", () => setTimeout(queueReveal, 60));
    }
    queueReveal();
  }

  /** Stagger the direct children of any [data-stagger] container. */
  function initStagger(root) {
    $$("[data-stagger]", root || document).forEach((wrap) => {
      if (wrap.__st) return;
      wrap.__st = 1;
      const step = parseFloat(wrap.getAttribute("data-stagger")) || 90;
      Array.from(wrap.children).forEach((child, i) => {
        if (!child.hasAttribute("data-reveal")) child.setAttribute("data-reveal", "");
        child.style.setProperty("--reveal-delay", (i * step) / 1000 + "s");
      });
    });
  }

  /** Wrap words of [data-split] headings in spans for a line-mask reveal. */
  function initSplit() {
    if (REDUCED) return;
    $$("[data-split]").forEach((el) => {
      if (el.__sp) return;
      el.__sp = 1;

      const walk = (node, out) => {
        node.childNodes.forEach((child) => {
          if (child.nodeType === 3) {
            child.textContent.split(/(\s+)/).forEach((tok) => {
              if (!tok) return;
              if (/^\s+$/.test(tok)) { out.push(document.createTextNode(" ")); return; }
              const w = document.createElement("span");
              w.className = "split-word";
              w.textContent = tok;
              out.push(w);
            });
          } else if (child.nodeType === 1) {
            const clone = child.cloneNode(false);
            const inner = [];
            walk(child, inner);
            inner.forEach((n) => clone.appendChild(n));
            out.push(clone);
          }
        });
      };

      const parts = [];
      walk(el, parts);

      const line = document.createElement("span");
      line.className = "split-line";
      parts.forEach((n) => line.appendChild(n));

      el.textContent = "";
      el.appendChild(line);

      $$(".split-word", el).forEach((w, i) => {
        w.style.setProperty("--w-delay", (i * 0.055) + "s");
      });

      if (!el.hasAttribute("data-reveal")) el.setAttribute("data-reveal", "clip");
    });
  }

  /* ------------------------------------------------------------- counters */

  function initCounters() {
    const els = $$("[data-count]");
    if (!els.length) return;

    const run = (el) => {
      const target = parseFloat(el.getAttribute("data-count"));
      const dec = parseInt(el.getAttribute("data-dec") || "0", 10);
      if (REDUCED) { el.textContent = target.toFixed(dec); return; }

      const dur = 1500;
      const t0 = performance.now();
      const tick = (t) => {
        const p = clamp((t - t0) / dur, 0, 1);
        const eased = 1 - Math.pow(1 - p, 3);
        el.textContent = (target * eased).toFixed(dec);
        if (p < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    };

    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        run(e.target);
        io.unobserve(e.target);
      });
    }, { threshold: 0.4 });

    els.forEach((el) => io.observe(el));
  }

  /* ------------------------------------------------------------ parallax */

  function initParallax() {
    if (REDUCED) return;
    const items = $$("[data-parallax]");
    if (!items.length) return;

    let ticking = false;
    const update = () => {
      const vh = window.innerHeight;
      items.forEach((el) => {
        const r = el.getBoundingClientRect();
        if (r.bottom < -200 || r.top > vh + 200) return;
        const speed = parseFloat(el.getAttribute("data-parallax")) || 0.12;
        const centre = r.top + r.height / 2 - vh / 2;
        // never travel further than the scale overflow, or the frame shows through
        const limit = Math.min(64, r.height * 0.06);
        el.style.setProperty("--par", clamp(-centre * speed, -limit, limit).toFixed(1) + "px");
      });
      ticking = false;
    };

    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(update);
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    update();
  }

  /* ------------------------------------------------- card cursor spotlight */

  function initSpotlight(root) {
    if (!FINE_POINTER) return;
    $$(".card, .pcard, .assure__c, .info-card", root || document).forEach((el) => {
      if (el.__sl) return;
      el.__sl = 1;
      el.addEventListener("pointermove", (e) => {
        const r = el.getBoundingClientRect();
        el.style.setProperty("--mx", ((e.clientX - r.left) / r.width) * 100 + "%");
        el.style.setProperty("--my", ((e.clientY - r.top) / r.height) * 100 + "%");
      });
    });
  }

  /* -------------------------------------------------------- magnetic btns */

  function initMagnetic() {
    if (!FINE_POINTER || REDUCED) return;
    $$("[data-magnetic]").forEach((el) => {
      const strength = parseFloat(el.getAttribute("data-magnetic")) || 0.28;
      let raf, tx = 0, ty = 0, cx = 0, cy = 0;

      const loop = () => {
        cx = lerp(cx, tx, 0.18);
        cy = lerp(cy, ty, 0.18);
        el.style.transform = `translate3d(${cx.toFixed(2)}px, ${cy.toFixed(2)}px, 0)`;
        if (Math.abs(cx - tx) > 0.1 || Math.abs(cy - ty) > 0.1) raf = requestAnimationFrame(loop);
        else raf = null;
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

  /* --------------------------------------------------------- cursor glow */

  function initCursor() {
    if (!FINE_POINTER || REDUCED) return;
    const dot = document.createElement("div");
    dot.className = "cursor";
    dot.setAttribute("aria-hidden", "true");
    document.body.appendChild(dot);

    let x = -100, y = -100, cx = -100, cy = -100;
    document.addEventListener("pointermove", (e) => { x = e.clientX; y = e.clientY; }, { passive: true });

    (function loop() {
      cx = lerp(cx, x, 0.2);
      cy = lerp(cy, y, 0.2);
      dot.style.transform = `translate3d(${cx - 13}px, ${cy - 13}px, 0)`;
      requestAnimationFrame(loop);
    })();

    const HOT = "a, button, .pcard, [data-cursor]";
    document.addEventListener("pointerover", (e) => {
      if (e.target.closest && e.target.closest(HOT)) dot.classList.add("is-hot");
    });
    document.addEventListener("pointerout", (e) => {
      if (e.target.closest && e.target.closest(HOT)) dot.classList.remove("is-hot");
    });
  }

  /* ---------------------------------------------------------------- theme
     Two explicit states. The choice persists; with nothing stored we follow
     the OS and keep following it if the OS setting changes mid-session.
     The <head> bootstrap has already stamped data-theme before first paint,
     so this only wires the controls.
     ------------------------------------------------------------------- */

  const THEME_KEY = "sanka-theme";

  function storedTheme() {
    try {
      const v = localStorage.getItem(THEME_KEY);
      return v === "light" || v === "dark" ? v : null;
    } catch (e) {
      return null;
    }
  }

  function currentTheme() {
    return document.documentElement.getAttribute("data-theme") === "light" ? "light" : "dark";
  }

  function applyTheme(t, persist) {
    const root = document.documentElement;

    // freeze transitions for a frame so the page flips as one piece
    root.classList.add("theme-swap");
    root.setAttribute("data-theme", t);
    root.style.colorScheme = t;
    requestAnimationFrame(() =>
      requestAnimationFrame(() => root.classList.remove("theme-swap")));

    if (persist) {
      try { localStorage.setItem(THEME_KEY, t); } catch (e) {}
    }

    const meta = $('meta[name="theme-color"]');
    if (meta) meta.setAttribute("content", t === "light" ? "#fff8f4" : "#07060a");

    $$(".theme-toggle").forEach((b) => {
      const light = t === "light";
      b.setAttribute("aria-checked", String(light));
      b.setAttribute("aria-label", light ? "Switch to dark theme" : "Switch to light theme");
    });

    document.dispatchEvent(new CustomEvent("themechange", { detail: { theme: t } }));
  }

  function initTheme() {
    applyTheme(currentTheme(), false);

    $$(".theme-toggle").forEach((btn) =>
      btn.addEventListener("click", () =>
        applyTheme(currentTheme() === "light" ? "dark" : "light", true)));

    // keep following the OS until the visitor makes a choice
    const mq = window.matchMedia("(prefers-color-scheme: light)");
    const onOS = (e) => { if (!storedTheme()) applyTheme(e.matches ? "light" : "dark", false); };
    if (mq.addEventListener) mq.addEventListener("change", onOS);
    else if (mq.addListener) mq.addListener(onOS);
  }

  /* ------------------------------------------------------------------ nav */

  function initNav() {
    const nav = $(".nav");
    if (!nav) return;

    const burger = $(".nav__burger");
    const drawer = $(".drawer");
    const progress = $(".nav__progress");
    let lastY = window.scrollY;

    /* Every page opens with a pinned-dark band behind the nav. The nav keeps
       the night palette until it has scrolled clear of that band; only then
       does it become a glass bar in the ambient theme. */
    const darkBand = $(".hero, .page-head");
    const stickAt = () =>
      darkBand ? Math.max(24, darkBand.offsetHeight - nav.offsetHeight - 8) : 24;

    const onScroll = () => {
      const y = window.scrollY;
      nav.classList.toggle("is-stuck", y > stickAt());

      // hide on scroll-down, reveal on scroll-up (never while the drawer is open)
      if (!drawer || !drawer.classList.contains("is-open")) {
        const delta = y - lastY;
        // a large delta is a jump (anchor link, restored position) — never hide for those
        nav.classList.toggle("is-hidden", y > 480 && delta > 6 && delta < 140);
      }
      lastY = y;

      if (progress) {
        const max = document.documentElement.scrollHeight - window.innerHeight;
        progress.style.setProperty("--p", max > 0 ? clamp(y / max, 0, 1) : 0);
      }

      const top = $(".fab--top");
      if (top) top.classList.toggle("is-on", y > 700);
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();

    /* drawer */
    if (burger && drawer) {
      const links = $$(".drawer__link", drawer);
      links.forEach((l, i) => l.style.transitionDelay = 0.16 + i * 0.06 + "s");

      const setOpen = (open) => {
        drawer.classList.toggle("is-open", open);
        burger.setAttribute("aria-expanded", String(open));
        document.body.classList.toggle("is-locked", open);
        if (open) nav.classList.remove("is-hidden");
      };

      burger.addEventListener("click", () => setOpen(!drawer.classList.contains("is-open")));
      $$("a", drawer).forEach((a) => a.addEventListener("click", () => setOpen(false)));
      document.addEventListener("keydown", (e) => {
        if (e.key === "Escape" && drawer.classList.contains("is-open")) setOpen(false);
      });
    }

    /* scroll-spy */
    const spy = $$(".nav__link[data-spy]");
    if (spy.length) {
      const targets = spy
        .map((l) => ({ link: l, el: document.getElementById(l.getAttribute("data-spy")) }))
        .filter((t) => t.el);

      if (targets.length) {
        const io = new IntersectionObserver((entries) => {
          entries.forEach((e) => {
            if (!e.isIntersecting) return;
            spy.forEach((l) => l.classList.remove("is-active"));
            const hit = targets.find((t) => t.el === e.target);
            if (hit) hit.link.classList.add("is-active");
          });
        }, { rootMargin: "-45% 0px -50% 0px" });
        targets.forEach((t) => io.observe(t.el));
      }
    }
  }

  /* ------------------------------------------------------------ marquee */

  /** Duplicate the track so the -100% keyframe loops seamlessly. */
  function initMarquee() {
    $$(".marquee").forEach((m) => {
      const track = $(".marquee__track", m);
      if (!track || m.__mq) return;
      m.__mq = 1;
      const copy = track.cloneNode(true);
      copy.setAttribute("aria-hidden", "true");
      m.appendChild(copy);
    });
  }

  /* -------------------------------------------------------------- toast */

  let toastEl, toastT;
  function toast(msg, icon) {
    if (!toastEl) {
      toastEl = document.createElement("div");
      toastEl.className = "toast";
      toastEl.setAttribute("role", "status");
      document.body.appendChild(toastEl);
    }
    toastEl.innerHTML =
      '<span class="toast__ico">' + (icon || Icons.check) + "</span><span>" + esc(msg) + "</span>";
    requestAnimationFrame(() => toastEl.classList.add("is-on"));
    clearTimeout(toastT);
    toastT = setTimeout(() => toastEl.classList.remove("is-on"), 4200);
  }

  /* --------------------------------------------------------------- icons */

  const Icons = {
    arrow: '<svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12L12 4M12 4H5.5M12 4v6.5"/></svg>',
    check: '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 8.5l3.2 3.2L13 5"/></svg>',
    spark: '<svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor"><path d="M8 0l1.6 5.1L15 8l-5.4 2.9L8 16l-1.6-5.1L1 8l5.4-2.9z"/></svg>',
    star: '<svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor"><path d="M8 1l2.1 4.3 4.7.7-3.4 3.3.8 4.7L8 11.8 3.8 14l.8-4.7L1.2 6l4.7-.7z"/></svg>',
    wa: '<svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2 22l5.25-1.38a9.9 9.9 0 004.79 1.22h.01c5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.82 9.82 0 0012.04 2zm0 18.13h-.01a8.2 8.2 0 01-4.19-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.22 8.22 0 01-1.26-4.36c0-4.54 3.7-8.23 8.25-8.23a8.18 8.18 0 015.82 2.42 8.18 8.18 0 012.41 5.82c0 4.54-3.7 8.21-8.23 8.21zm4.52-6.16c-.25-.12-1.47-.72-1.69-.81-.23-.08-.39-.12-.56.13-.16.24-.64.8-.78.97-.15.16-.29.18-.53.06-.25-.13-1.05-.39-1.99-1.23-.74-.66-1.23-1.47-1.38-1.72-.14-.25-.01-.38.11-.5.11-.11.25-.29.37-.44.13-.15.17-.25.25-.41.09-.17.04-.31-.02-.44-.06-.12-.56-1.34-.76-1.84-.2-.48-.4-.42-.56-.43h-.47c-.17 0-.43.06-.66.31-.22.25-.86.85-.86 2.07 0 1.22.89 2.4 1.01 2.56.12.17 1.75 2.67 4.23 3.74.59.26 1.05.41 1.41.52.59.19 1.13.16 1.56.1.48-.07 1.47-.6 1.68-1.18.2-.58.2-1.08.15-1.18-.06-.11-.23-.17-.48-.29z"/></svg>',
    phone: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.9v3a2 2 0 01-2.2 2 19.8 19.8 0 01-8.6-3.1 19.5 19.5 0 01-6-6A19.8 19.8 0 012.1 4.2 2 2 0 014.1 2h3a2 2 0 012 1.7c.1 1 .4 1.9.7 2.8a2 2 0 01-.5 2.1L8.1 9.9a16 16 0 006 6l1.3-1.3a2 2 0 012.1-.4c.9.3 1.8.6 2.8.7a2 2 0 011.7 2z"/></svg>',
    pin: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 1116 0z"/><circle cx="12" cy="10" r="3"/></svg>',
    mail: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="M2.5 6.5l9.5 6.5 9.5-6.5"/></svg>',
    up: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 19V5M5 12l7-7 7 7"/></svg>',
    close: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M18 6L6 18M6 6l12 12"/></svg>',
    left: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 18l-6-6 6-6"/></svg>',
    right: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18l6-6-6-6"/></svg>',
    search: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/></svg>',
    box: '<svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 8l-9-5-9 5v8l9 5 9-5V8z"/><path d="M3 8l9 5 9-5M12 13v8"/></svg>',
    shield: '<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2l8 3.5v6c0 5-3.4 9.4-8 10.5-4.6-1.1-8-5.5-8-10.5v-6L12 2z"/><path d="M9 12l2 2 4-4"/></svg>',
    truck: '<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h11v10H3zM14 9h4l3 3v4h-7z"/><circle cx="7" cy="18" r="2"/><circle cx="17.5" cy="18" r="2"/></svg>',
    leaf: '<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M4 20c0-9 6-15 16-15 0 10-6 15-13 15H4z"/><path d="M9 15c1.5-3 4-5 7-6"/></svg>',
    tag: '<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M11.5 2.5H21v9.5L11 22 2 13z"/><circle cx="16.6" cy="7.4" r="1.6"/></svg>',
    factory: '<svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M3 21V10l5 3.5V10l5 3.5V10l5 3.5V21z"/><path d="M3 21h18M6.5 3h3l.6 7h-4.2z"/></svg>',
    store: '<svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M3.5 9.5V21h17V9.5"/><path d="M2 9.5L4 3h16l2 6.5a3 3 0 01-5 2.2 3 3 0 01-5 0 3 3 0 01-5 0 3 3 0 01-5-2.2z"/><path d="M9.5 21v-6h5v6"/></svg>',
  };

  /* -------------------------------------------------------------- exports */

  window.SankaCore = {
    $, $$, esc, money, moneyFine, imgURL, imgSrcset, clamp, lerp, debounce,
    perLabel, getProducts, groupByCategory, normalise, unitPrice,
    mountProductImage,
    initReveal, initStagger, initSplit, initCounters, initParallax,
    initSpotlight, initMagnetic, initCursor, initNav, initMarquee, initTheme, currentTheme,
    toast, Icons, REDUCED, FINE_POINTER,
  };

  /* -------------------------------------------------------------- bootstrap */

  function boot() {
    initTheme();
    initSplit();
    initStagger();
    initReveal();
    initCounters();
    initParallax();
    initSpotlight();
    initMagnetic();
    initCursor();
    initNav();
    initMarquee();

    // copyright year
    $$("[data-year]").forEach((el) => (el.textContent = new Date().getFullYear()));

    // back to top
    const top = $(".fab--top");
    if (top) top.addEventListener("click", () =>
      window.scrollTo({ top: 0, behavior: REDUCED ? "auto" : "smooth" }));
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
