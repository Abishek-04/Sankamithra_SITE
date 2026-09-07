/* ==========================================================================
   Shared product rendering.

   A card mirrors one row of the printed price list, so a buyer can read it
   the same way they read the sheet:

     S.No · Item Name · Box Contents · Price · Per rate · Cs/Cont
   ========================================================================== */
(function () {
  "use strict";

  const C = window.SankaCore;
  const CFG = window.SANKA;
  const { $, $$, esc, money, moneyFine, perLabel, imgURL, Icons } = C;

  /** Build one product card element (detached). */
  function card(p, idx) {
    const el = document.createElement("article");
    el.className = "pcard";
    el.setAttribute("data-reveal", "");
    if (idx != null) el.style.setProperty("--reveal-delay", Math.min(idx, 11) * 0.055 + "s");

    const unit = C.unitPrice(p);

    el.innerHTML = `
      <div class="pcard__media">
        <div class="pcard__badges">
          <span class="pcard__sno">${esc(p.sno)}</span>
        </div>
      </div>

      <div class="pcard__body">
        <h3 class="pcard__name">${esc(p.name)}</h3>

        <div class="pcard__price">
          <span class="pcard__amt">${money(p.price)}</span>
          <span class="pcard__per">per ${esc(perLabel(p.per))}</span>
        </div>
        ${unit ? `<p class="pcard__each">${moneyFine(unit.each)} per packet</p>` : ""}

        <dl class="pcard__spec">
          ${p.contents ? `<div><dt>Box contents</dt><dd>${esc(p.contents)}</dd></div>` : ""}
          <div><dt>Cs / Cont</dt><dd>${esc(p.case)}</dd></div>
        </dl>
      </div>

      <span class="pcard__arrow" aria-hidden="true">${Icons.arrow}</span>
      <a class="pcard__go" href="product.html?sno=${encodeURIComponent(p.sno)}">
        <span class="sr-only">${esc(p.sno)} — ${esc(p.name)}</span>
      </a>`;

    C.mountProductImage($(".pcard__media", el), p.images[0], p.name, CFG.IMG_W_CARD);
    return el;
  }

  /** Render a list of products into a container. */
  function renderGrid(mount, list, opts) {
    opts = opts || {};
    mount.innerHTML = "";

    if (!list.length) {
      mount.innerHTML = `
        <div class="empty">
          ${Icons.box}
          <h3>${esc(opts.emptyTitle || "Nothing here yet")}</h3>
          <p>${esc(opts.emptyText || "Try a different category or clear your search.")}</p>
        </div>`;
      return;
    }

    const frag = document.createDocumentFragment();
    list.forEach((p, i) => frag.appendChild(card(p, i)));
    mount.appendChild(frag);

    C.initReveal(mount);
    C.initSpotlight(mount);
  }

  /** Skeleton placeholders while the feed loads. */
  function renderSkeletons(mount, n) {
    mount.innerHTML = Array.from({ length: n || 8 })
      .map(() => '<div class="skel skel--card"></div>')
      .join("");
  }

  /** WhatsApp enquiry deep link, quoting the price-list reference. */
  function waLink(p) {
    const txt = p
      ? `Hi Sankamithra Fireworks, I'd like a quote for ${p.sno} — ${p.name}` +
        (p.case ? ` (${p.case} per case)` : "") + ". Please share your slab rates."
      : "Hi Sankamithra Fireworks, I'd like the 2026 price list and your wholesale slabs.";
    return `https://wa.me/${CFG.WHATSAPP}?text=${encodeURIComponent(txt)}`;
  }

  /** The terms printed at the foot of the price list. */
  function termsHTML() {
    return CFG.PRICE_TERMS.map((t) => `<li>${t}</li>`).join("");
  }

  window.SankaProducts = { card, renderGrid, renderSkeletons, waLink, termsHTML };
})();
