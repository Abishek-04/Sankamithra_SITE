/* ==========================================================================
   Home page controller
   ========================================================================== */
(function () {
  "use strict";

  const C = window.SankaCore;
  const P = window.SankaProducts;
  const CFG = window.SANKA;
  const { $, $$, esc, Icons } = C;

  /* ---------------------------------------------------------- preloader */

  function loader() {
    const el = $(".loader");
    if (!el) return;
    const fill = $(".loader__fill", el);
    let v = 0;

    const t = setInterval(() => {
      v = Math.min(92, v + Math.random() * 22);
      if (fill) fill.style.width = v + "%";
    }, 180);

    const done = () => {
      clearInterval(t);
      if (fill) fill.style.width = "100%";
      setTimeout(() => {
        el.classList.add("is-done");
        document.body.classList.remove("is-locked");
        setTimeout(() => el.remove(), 800);
      }, 260);
    };

    if (document.readyState === "complete") setTimeout(done, 350);
    else window.addEventListener("load", () => setTimeout(done, 350));
    setTimeout(done, 4500); // hard ceiling — never trap the page
  }

  /* ------------------------------------------------------------- hero sky */

  function sky() {
    const cv = $(".hero__sky");
    if (cv && window.FireworkSky) window.FireworkSky(cv);
  }

  /* ------------------------------------------------------------- process */

  function process() {
    const steps = $$(".step");
    if (!steps.length || C.REDUCED) return;
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => e.target.classList.toggle("is-live", e.isIntersecting));
    }, { rootMargin: "-42% 0px -42% 0px" });
    steps.forEach((s) => io.observe(s));
  }

  /* ----------------------------------------------------- catalogue teaser */

  const FEATURED = [
    "Sankamithra Specials", "Sankamithra Magics", "Repeating Shots", "Aerial Shots",
    "Flower Pots", "Ground Chakkars", "One Sound Crackers", "Atom Bombs",
  ];

  async function catalogue() {
    const grid = $("#homeGrid");
    const bar = $("#homePills");
    if (!grid) return;

    P.renderSkeletons(grid, 8);

    let all;
    try {
      all = await C.getProducts();
    } catch (err) {
      grid.innerHTML = `
        <div class="empty">
          ${Icons.box}
          <h3>Price list unavailable</h3>
          <p>We couldn't load the catalogue right now. Please refresh, or message us on WhatsApp for the 2026 price list.</p>
          <a class="btn btn--sm" href="${P.waLink()}" target="_blank" rel="noopener">Ask on WhatsApp</a>
        </div>`;
      return;
    }

    const groups = C.groupByCategory(all);
    const cats = FEATURED.filter((c) => groups.has(c));
    // top up with whatever else exists, largest categories first
    Array.from(groups.keys())
      .filter((c) => !cats.includes(c))
      .sort((a, b) => groups.get(b).length - groups.get(a).length)
      .forEach((c) => cats.push(c));

    const show = (cat) => {
      const list = groups.get(cat) || [];
      P.renderGrid(grid, list.slice(0, 8));
      $$(".pill", bar).forEach((b) =>
        b.classList.toggle("is-on", b.dataset.cat === cat));
    };

    if (bar) {
      bar.innerHTML = cats
        .map((c) => `<button class="pill" type="button" data-cat="${esc(c)}">${esc(c)}<span class="pill__c">${groups.get(c).length}</span></button>`)
        .join("");
      bar.addEventListener("click", (e) => {
        const b = e.target.closest(".pill");
        if (b) show(b.dataset.cat);
      });
    }

    show(cats[0]);

    const total = $("#skuCount");
    if (total) total.textContent = all.length;
  }

  /* --------------------------------------------------------------- reel */

  function reel() {
    const box = $(".reel");
    if (!box) return;
    const btn = $(".reel__play", box);
    const frame = $("iframe", box);
    if (!btn || !frame) return;

    btn.addEventListener("click", () => {
      const src = frame.getAttribute("data-src");
      if (src && !frame.src) frame.src = src + (src.includes("?") ? "&" : "?") + "autoplay=1";
      box.classList.add("is-playing");
    });
  }

  /* -------------------------------------------------------- testimonials */

  const REVIEWS = [
    { q: "We've moved to Sankamithra for our entire Diwali stock. Consistent burst quality, honest counts per box, and the consignment reached Chennai four days early.",
      n: "Ramesh Kumar", r: "Distributor · Chennai" },
    { q: "As a retailer I care about two things — margin and returns. Their packing is tight, breakage is close to zero, and the price list actually leaves room to trade.",
      n: "Priya Selvam", r: "Retail chain · Madurai" },
    { q: "The sparklers and flower pots are what my customers ask for by name now. Smoke is noticeably lower than what we stocked before.",
      n: "Arun Manickam", r: "Wholesaler · Coimbatore" },
    { q: "Bulk order of 400 boxes for a temple festival, delivered with paperwork in order and every carton labelled. That is rarer than it should be.",
      n: "Kavya Rajan", r: "Event supplier · Salem" },
  ];

  const initials = (name) =>
    name.split(/\s+/).slice(0, 2).map((w) => w[0]).join("").toUpperCase();

  function testimonials() {
    const stage = $("#tstmStage");
    if (!stage) return;

    const idxEl = $("#tstmIdx");
    const rail = $("#tstmRail");
    let i = 0, timer;

    stage.innerHTML = REVIEWS.map((r, k) => `
      <figure class="tstm__slide${k === 0 ? " is-on" : ""}">
        <div class="tstm__stars" aria-label="5 out of 5">${Icons.star.repeat(5)}</div>
        <blockquote class="tstm__quote">“${esc(r.q)}”</blockquote>
        <figcaption class="tstm__who">
          <span class="tstm__av" aria-hidden="true">${esc(initials(r.n))}</span>
          <span>
            <span class="tstm__name">${esc(r.n)}</span>
            <span class="tstm__role">${esc(r.r)}</span>
          </span>
        </figcaption>
      </figure>`).join("");

    const slides = $$(".tstm__slide", stage);

    const go = (n) => {
      i = (n + REVIEWS.length) % REVIEWS.length;
      slides.forEach((s, k) => s.classList.toggle("is-on", k === i));
      if (idxEl) idxEl.textContent = String(i + 1).padStart(2, "0") + " / " + String(REVIEWS.length).padStart(2, "0");
      if (rail) rail.style.width = ((i + 1) / REVIEWS.length) * 100 + "%";
    };

    const restart = () => {
      clearInterval(timer);
      if (!C.REDUCED) timer = setInterval(() => go(i + 1), 7000);
    };

    const prev = $("#tstmPrev"), next = $("#tstmNext");
    if (prev) prev.addEventListener("click", () => { go(i - 1); restart(); });
    if (next) next.addEventListener("click", () => { go(i + 1); restart(); });

    stage.addEventListener("pointerenter", () => clearInterval(timer));
    stage.addEventListener("pointerleave", restart);

    go(0);
    restart();
  }

  /* --------------------------------------------------------------- form */

  function form() {
    const f = $("#enquiry");
    if (!f) return;

    const setErr = (input, on, msg) => {
      const field = input.closest(".field");
      if (!field) return;
      field.classList.toggle("is-invalid", on);
      const e = $(".field__err", field);
      if (e && msg) e.textContent = msg;
      input.setAttribute("aria-invalid", String(on));
    };

    f.addEventListener("submit", async (ev) => {
      ev.preventDefault();

      const name = f.elements.name;
      const phone = f.elements.phone;
      const email = f.elements.email;
      const msg = f.elements.message;

      let ok = true;
      if (!name.value.trim()) { setErr(name, true, "Please tell us your name."); ok = false; }
      else setErr(name, false);

      const digits = phone.value.replace(/\D/g, "");
      if (digits.length < 10) { setErr(phone, true, "Enter a 10-digit mobile number."); ok = false; }
      else setErr(phone, false);

      if (email.value && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.value)) {
        setErr(email, true, "That email address doesn't look right."); ok = false;
      } else setErr(email, false);

      if (!ok) {
        const bad = $(".field.is-invalid input, .field.is-invalid textarea", f);
        if (bad) bad.focus();
        return;
      }

      const btn = $("button[type=submit]", f);
      const label = btn.innerHTML;
      btn.disabled = true;
      btn.innerHTML = "Sending…";

      const payload = {
        name: name.value.trim(),
        phone: digits,
        email: email.value.trim(),
        interest: f.elements.interest.value,
        message: msg.value.trim(),
      };

      try {
        if (CFG.FORM_ENDPOINT) {
          const res = await fetch(CFG.FORM_ENDPOINT, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });
          if (!res.ok) throw new Error(res.status);
          C.toast("Thank you — our team will call you within one working day.");
          f.reset();
        } else {
          // No backend wired yet: hand the enquiry to WhatsApp so nothing is lost.
          const text =
            `New enquiry from the website\n\nName: ${payload.name}\nPhone: +91 ${payload.phone}` +
            (payload.email ? `\nEmail: ${payload.email}` : "") +
            `\nInterest: ${payload.interest}` +
            (payload.message ? `\n\n${payload.message}` : "");
          window.open(`https://wa.me/${CFG.WHATSAPP}?text=${encodeURIComponent(text)}`, "_blank", "noopener");
          C.toast("Opening WhatsApp with your enquiry…");
          f.reset();
        }
      } catch (err) {
        C.toast("Couldn't send that — please call us on " + CFG.PHONE_PRIMARY);
      } finally {
        btn.disabled = false;
        btn.innerHTML = label;
      }
    });
  }

  /* --------------------------------------------------------------- boot */

  function boot() {
    loader();
    sky();
    process();
    catalogue();
    reel();
    testimonials();
    form();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
