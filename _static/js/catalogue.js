/* ==========================================================================
   Catalogue — search, category facets, price range, sort, progressive load
   State lives in the URL so any view can be linked or refreshed.
   ========================================================================== */
(function () {
  "use strict";

  const C = window.SankaCore;
  const P = window.SankaProducts;
  const { $, $$, esc, money, Icons } = C;

  const PAGE = 24;

  /* The printed rates span ₹12 (a bijili bag) to ₹12,000 (1,000 packets of
     red bijili), because each row is quoted per its own unit. Discrete bands
     read far better here than a linear slider. */
  const BANDS = [
    { id: "u150",  label: "Under ₹150",      min: 0,    max: 150 },
    { id: "150-500",  label: "₹150 – ₹500",  min: 150,  max: 500 },
    { id: "500-1500", label: "₹500 – ₹1,500",min: 500,  max: 1500 },
    { id: "o1500", label: "Over ₹1,500",     min: 1500, max: Infinity },
  ];

  const state = {
    q: "",
    cats: new Set(),
    band: null,
    sort: "featured",
    shown: PAGE,
  };

  let ALL = [];

  /* --------------------------------------------------------- url syncing */

  function readURL() {
    const u = new URLSearchParams(location.search);
    state.q = u.get("q") || "";
    const c = u.get("cat");
    if (c) c.split(",").filter(Boolean).forEach((x) => state.cats.add(x));
    const b = u.get("rate");
    if (b && BANDS.some((x) => x.id === b)) state.band = b;
    state.sort = u.get("sort") || "featured";
  }

  function writeURL() {
    const u = new URLSearchParams();
    if (state.q) u.set("q", state.q);
    if (state.cats.size) u.set("cat", Array.from(state.cats).join(","));
    if (state.band) u.set("rate", state.band);
    if (state.sort !== "featured") u.set("sort", state.sort);
    const qs = u.toString();
    history.replaceState(null, "", qs ? "?" + qs : location.pathname);
  }

  /* ------------------------------------------------------------ filtering */

  function filtered() {
    const q = state.q.trim().toLowerCase();
    let out = ALL.filter((p) => {
      if (state.cats.size && !state.cats.has(p.category)) return false;
      if (state.band) {
        const b = BANDS.find((x) => x.id === state.band);
        if (b && !(p.price >= b.min && p.price < b.max)) return false;
      }
      if (q) {
        const hay = (p.sno + " " + p.name + " " + p.category + " " + p.contents + " " + p.per).toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });

    const by = {
      "price-asc": (a, b) => a.price - b.price,
      "price-desc": (a, b) => b.price - a.price,
      "name": (a, b) => a.name.localeCompare(b.name, "en", { numeric: true }),
      "sno": (a, b) => a.sno.localeCompare(b.sno, "en", { numeric: true }),
      // the printed sheet's own order
      "featured": (a, b) => a.categoryOrder - b.categoryOrder ||
                            a.sno.localeCompare(b.sno, "en", { numeric: true }),
    };
    return out.sort(by[state.sort] || by.featured);
  }

  /* -------------------------------------------------------------- render */

  function paint() {
    const list = filtered();
    const slice = list.slice(0, state.shown);

    P.renderGrid($("#grid"), slice, {
      emptyTitle: "No products match that",
      emptyText: "Try a broader price range, clear a category, or search for something like “chakkar”, “bijili”, “fancy” or an S.No such as S204.",
    });

    $("#count").innerHTML = list.length
      ? `<b>${list.length}</b> product${list.length === 1 ? "" : "s"}` +
        (list.length > slice.length ? ` &middot; showing ${slice.length}` : "")
      : "No matches";

    const more = $("#loadMore");
    more.hidden = list.length <= state.shown;
    $("#moreCount").textContent = Math.min(PAGE, list.length - state.shown);

    paintTokens();
    paintFacets();

    const active = state.cats.size + (state.q ? 1 : 0) + (state.band ? 1 : 0);
    const badge = $("#facetBadge");
    if (badge) {
      badge.textContent = active;
      badge.style.display = active ? "grid" : "none";
    }

    writeURL();
  }

  function paintTokens() {
    const box = $("#tokens");
    const bits = [];
    if (state.q) bits.push({ k: "q", label: `“${state.q}”` });
    state.cats.forEach((c) => bits.push({ k: "cat", v: c, label: c }));
    if (state.band) {
      const b = BANDS.find((x) => x.id === state.band);
      if (b) bits.push({ k: "rate", label: b.label });
    }

    box.innerHTML = bits
      .map((b) => `<span class="token">${esc(b.label)}<button type="button" data-k="${b.k}" data-v="${esc(b.v || "")}" aria-label="Remove filter">${Icons.close}</button></span>`)
      .join("");

    if (bits.length > 1) {
      box.insertAdjacentHTML("beforeend",
        '<button class="token" type="button" data-k="all" style="color:var(--gold)">Clear all</button>');
    }
  }

  function paintFacets() {
    $$("#facetCats .facet__opt").forEach((b) =>
      b.classList.toggle("is-on", state.cats.has(b.dataset.cat)));
    $$("#facetRates .facet__opt").forEach((b) =>
      b.classList.toggle("is-on", state.band === b.dataset.band));
  }

  /* ---------------------------------------------------------------- wire */

  function wire() {
    /* search */
    const search = $("#search");
    const wrap = search.closest(".search");
    search.value = state.q;
    wrap.classList.toggle("has-val", !!state.q);

    const onSearch = C.debounce(() => {
      state.q = search.value;
      state.shown = PAGE;
      wrap.classList.toggle("has-val", !!state.q);
      paint();
    }, 220);
    search.addEventListener("input", onSearch);

    $(".search__clear").addEventListener("click", () => {
      search.value = ""; state.q = ""; state.shown = PAGE;
      wrap.classList.remove("has-val");
      search.focus();
      paint();
    });

    /* sort */
    const sort = $("#sort");
    sort.value = state.sort;
    sort.addEventListener("change", () => {
      state.sort = sort.value;
      state.shown = PAGE;
      paint();
    });

    /* categories */
    $("#facetCats").addEventListener("click", (e) => {
      const b = e.target.closest(".facet__opt");
      if (!b) return;
      const cat = b.dataset.cat;
      if (cat === "*") state.cats.clear();
      else state.cats.has(cat) ? state.cats.delete(cat) : state.cats.add(cat);
      state.shown = PAGE;
      paint();
    });

    /* rate bands */
    $("#facetRates").addEventListener("click", (e) => {
      const b = e.target.closest(".facet__opt");
      if (!b) return;
      const id = b.dataset.band;
      state.band = id === "*" || state.band === id ? null : id;
      state.shown = PAGE;
      paint();
    });

    /* tokens */
    $("#tokens").addEventListener("click", (e) => {
      const b = e.target.closest("button");
      if (!b) return;
      const k = b.dataset.k;
      if (k === "all") { state.q = ""; state.cats.clear(); state.band = null; }
      if (k === "q") state.q = "";
      if (k === "cat") state.cats.delete(b.dataset.v);
      if (k === "rate") state.band = null;

      search.value = state.q;
      wrap.classList.toggle("has-val", !!state.q);
      state.shown = PAGE;
      paint();
    });

    /* load more */
    $("#loadMore").addEventListener("click", () => {
      state.shown += PAGE;
      paint();
      // keep the newly added row in view without jumping to the top
      requestAnimationFrame(() => $("#loadMore").scrollIntoView({ block: "center", behavior: C.REDUCED ? "auto" : "smooth" }));
    });

    /* mobile facet sheet */
    const facets = $(".facets");
    const toggle = $("#facetToggle");
    const setSheet = (open) => {
      facets.classList.toggle("is-open", open);
      document.body.classList.toggle("is-locked", open && window.innerWidth <= 980);
    };
    toggle.addEventListener("click", () => setSheet(!facets.classList.contains("is-open")));
    $("#facetDone").addEventListener("click", () => setSheet(false));
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") setSheet(false);
    });
  }

  /* ---------------------------------------------------------------- boot */

  async function boot() {
    const grid = $("#grid");
    if (!grid) return;
    P.renderSkeletons(grid, 12);
    readURL();

    try {
      ALL = await C.getProducts();
    } catch (err) {
      grid.innerHTML = `<div class="empty">${Icons.box}<h3>Price list unavailable</h3>
        <p>We couldn't reach the catalogue. Refresh the page, or message us on WhatsApp for the current rates.</p>
        <a class="btn btn--sm" href="${P.waLink()}" target="_blank" rel="noopener">Ask on WhatsApp</a></div>`;
      return;
    }

    // groupByCategory already walks the printed order
    const groups = C.groupByCategory(ALL);
    const cats = Array.from(groups.keys());

    $("#facetCats").innerHTML =
      `<button class="facet__opt" type="button" data-cat="*">All products <span>${ALL.length}</span></button>` +
      cats.map((c) => `<button class="facet__opt" type="button" data-cat="${esc(c)}">${esc(c)} <span>${groups.get(c).length}</span></button>`).join("");

    const bandCount = (b) => ALL.filter((p) => p.price >= b.min && p.price < b.max).length;
    $("#facetRates").innerHTML =
      `<button class="facet__opt" type="button" data-band="*">Any rate <span>${ALL.length}</span></button>` +
      BANDS.map((b) => `<button class="facet__opt" type="button" data-band="${b.id}">${b.label} <span>${bandCount(b)}</span></button>`).join("");

    const terms = $("#termsList");
    if (terms) terms.innerHTML = P.termsHTML();

    wire();
    paint();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
