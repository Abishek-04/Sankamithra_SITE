/* ==========================================================================
   Product detail page — one row of the price list, in full
   ========================================================================== */
(function () {
  "use strict";

  const C = window.SankaCore;
  const P = window.SankaProducts;
  const CFG = window.SANKA;
  const { $, $$, esc, money, moneyFine, perLabel, imgURL, Icons, clamp } = C;

  let product = null;
  let gallery = [];
  let idx = 0;

  /* ---------------------------------------------------------------- boot */

  async function boot() {
    const host = $("#pdp");
    if (!host) return;

    const params = new URLSearchParams(location.search);
    const key = (params.get("sno") || params.get("id") || params.get("slug") || "").trim();

    if (!key) return fail("No product selected", "Pick an item from the catalogue and we'll show you the full listing.");

    let all;
    try {
      all = await C.getProducts();
    } catch (err) {
      return fail("Couldn't load the price list", "Refresh the page, or message us on WhatsApp for the current rates.");
    }

    const k = key.toUpperCase();
    product = all.find((p) => p.sno.toUpperCase() === k) || all.find((p) => p.slug === key.toLowerCase());
    if (!product) return fail("We couldn't find that item", "It may have been renumbered in the 2026 list. Browse the full catalogue instead.");

    render(all);
  }

  function fail(title, text) {
    $("#pdp").innerHTML = `
      <div class="pdp__error">
        ${Icons.box}
        <h1 class="h2">${esc(title)}</h1>
        <p class="lead">${esc(text)}</p>
        <a class="btn" href="products.html">Open the catalogue</a>
      </div>`;
    document.title = title + " — Sankamithra Fireworks";
  }

  /* -------------------------------------------------------------- render */

  function render(all) {
    const p = product;
    gallery = p.images.slice();
    const unit = C.unitPrice(p);

    document.title = `${p.sno} ${p.name} — Sankamithra Fireworks`;
    const meta = $('meta[name="description"]');
    if (meta) {
      meta.content =
        `${p.name} (${p.sno}) — ${money(p.price)} per ${perLabel(p.per)}` +
        (p.contents ? `, ${p.contents} per box` : "") +
        `, ${p.case} per case. Ex-factory rate from Sankamithra Fireworks, Sivakasi.`;
    }

    const crumb = $("#crumbCat");
    if (crumb) {
      crumb.textContent = p.category;
      crumb.href = "products.html?cat=" + encodeURIComponent(p.category);
    }
    const crumbName = $("#crumbName");
    if (crumbName) crumbName.textContent = p.sno;

    $("#pdp").innerHTML = `
      <div class="pgal">
        <div class="pgal__main" id="galMain">
          ${gallery.length ? '<span class="pgal__hint">Hover to zoom · click to expand</span>' : ""}
        </div>
        ${gallery.length > 1 ? `<div class="pgal__thumbs" id="galThumbs">${
          gallery.map((im, i) => `
            <button class="pgal__thumb${i === 0 ? " is-on" : ""}" type="button" data-i="${i}" aria-label="View image ${i + 1}">
              <img src="${esc(imgURL(im, CFG.IMG_W_THUMB))}" alt="" loading="lazy">
            </button>`).join("")
        }</div>` : ""}
      </div>

      <div style="display:grid;gap:1.35rem">
        <div class="pdp__head">
          <p class="pdp__sku"><span class="pdp__snotag">${esc(p.sno)}</span> ${esc(p.category)}</p>
          <h1 class="pdp__title">${esc(p.name)}</h1>
          <p class="lead">${esc(p.unitNote)}.</p>
        </div>

        <div class="pdp__pricebox">
          <span class="pdp__now">${money(p.price)}</span>
          <span class="pdp__per">per ${esc(perLabel(p.per))}</span>
          ${unit ? `<span class="pdp__save">${moneyFine(unit.each)} per packet</span>` : ""}
        </div>

        <dl class="pdp__facts">
          <div class="pdp__fact"><dt>S.No</dt><dd>${esc(p.sno)}</dd></div>
          <div class="pdp__fact"><dt>Box contents</dt><dd>${esc(p.contents || "—")}</dd></div>
          <div class="pdp__fact"><dt>Per rate</dt><dd>${esc(p.per)}</dd></div>
          <div class="pdp__fact"><dt>Cs / Cont</dt><dd>${esc(p.case)}</dd></div>
          <div class="pdp__fact"><dt>Category</dt><dd>${esc(p.category)}</dd></div>
          <div class="pdp__fact"><dt>Made at</dt><dd>Sivakasi, TN</dd></div>
        </dl>

        <div class="pdp__actions">
          <a class="btn btn--lg btn--wa" href="${esc(P.waLink(p))}" target="_blank" rel="noopener">
            ${Icons.wa} Enquire on WhatsApp
          </a>
          <a class="btn btn--lg btn--ghost" href="${esc(CFG.SHOP_URL)}" target="_blank" rel="noopener">Buy in the shop</a>
        </div>

        <div class="pdp__terms">
          <h3>Rate terms</h3>
          <ul>${P.termsHTML()}</ul>
          <p class="form-note">${esc(CFG.PRICE_LIST_EFFECTIVE)}.</p>
        </div>

        <p class="pdp__note">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="12" cy="12" r="9"/><path d="M12 8h.01M11 12h1v4h1"/></svg>
          <span>Fireworks cannot be shipped by air or courier. Consignments move by approved road transport with the required paperwork — we'll confirm the route when you enquire.</span>
        </p>

        <div class="pdp__body">
          <h3>Handling &amp; safety</h3>
          <p>Use outdoors in an open space, keep a safe distance after lighting, never relight a dud, and keep a bucket of water or sand within reach. Children must be supervised by an adult at all times.</p>
        </div>
      </div>`;

    mountMain();
    wireGallery();
    related(all);

    C.initReveal();
    C.initSpotlight();
  }

  /* ------------------------------------------------------------- gallery */

  function mountMain() {
    const main = $("#galMain");
    if (!main) return;
    $$("img", main).forEach((n) => n.remove());
    main.classList.remove("has-img");
    C.mountProductImage(main, gallery[idx], product.name, CFG.IMG_W_FULL);
  }

  function wireGallery() {
    const main = $("#galMain");
    const thumbs = $("#galThumbs");
    if (!main) return;

    const select = (i) => {
      idx = (i + gallery.length) % gallery.length;
      $$(".pgal__thumb").forEach((t, k) => t.classList.toggle("is-on", k === idx));
      mountMain();
    };

    if (thumbs) {
      thumbs.addEventListener("click", (e) => {
        const b = e.target.closest(".pgal__thumb");
        if (b) select(Number(b.dataset.i));
      });
    }

    if (!gallery.length) return;

    /* hover zoom (fine pointers only) */
    if (C.FINE_POINTER && !C.REDUCED) {
      main.addEventListener("pointermove", (e) => {
        const img = $("img", main);
        if (!img || !main.classList.contains("is-zoom")) return;
        const r = main.getBoundingClientRect();
        img.style.transformOrigin =
          clamp(((e.clientX - r.left) / r.width) * 100, 0, 100) + "% " +
          clamp(((e.clientY - r.top) / r.height) * 100, 0, 100) + "%";
      });
      main.addEventListener("pointerenter", () => {
        const img = $("img", main);
        if (!img) return;
        main.classList.add("is-zoom");
        img.style.transform = "scale(2)";
      });
      main.addEventListener("pointerleave", () => {
        const img = $("img", main);
        main.classList.remove("is-zoom");
        if (img) { img.style.transform = ""; img.style.transformOrigin = ""; }
      });
    }

    main.addEventListener("click", () => openLightbox(imgURL(gallery[idx], CFG.IMG_W_FULL)));

    document.addEventListener("keydown", (e) => {
      if (gallery.length < 2) return;
      if (e.key === "ArrowRight") select(idx + 1);
      if (e.key === "ArrowLeft") select(idx - 1);
    });
  }

  function openLightbox(src) {
    let lb = $(".lb");
    if (!lb) {
      lb = document.createElement("div");
      lb.className = "lb";
      lb.innerHTML = `<button class="lb__close" type="button" aria-label="Close">${Icons.close}</button><img alt="">`;
      document.body.appendChild(lb);
      const close = () => {
        lb.classList.remove("is-open");
        document.body.classList.remove("is-locked");
      };
      lb.addEventListener("click", close);
      document.addEventListener("keydown", (e) => { if (e.key === "Escape") close(); });
    }
    $("img", lb).src = src;
    lb.classList.add("is-open");
    document.body.classList.add("is-locked");
  }

  /* ------------------------------------------------------------- related */

  function related(all) {
    const mount = $("#related");
    if (!mount) return;

    const sameCat = all.filter((p) => p.category === product.category && p.sno !== product.sno);
    let list = sameCat;
    if (list.length < 4) {
      const seen = new Set(list.map((p) => p.sno));
      list = list.concat(all.filter((p) => p.sno !== product.sno && !seen.has(p.sno)).slice(0, 4 - list.length));
    }
    // rotate deterministically so neighbouring items surface, not always the first four
    if (list.length > 4) {
      const start = (parseInt(product.sno.slice(1), 10) || 0) % list.length;
      list = list.slice(start).concat(list.slice(0, start));
    }
    list = list.slice(0, 4);

    if (!list.length) { $("#relatedSection").hidden = true; return; }
    P.renderGrid(mount, list);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
