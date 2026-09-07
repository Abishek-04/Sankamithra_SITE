import { site } from "./site";

/** Whole rupees, Indian digit grouping. */
export const money = (n: number) =>
  "₹" + Number(n || 0).toLocaleString("en-IN", { maximumFractionDigits: 0 });

/** Derived per-piece rates keep paise; a whole rupee drops the ".00". */
export const moneyFine = (n: number) => {
  const v = Number(n || 0);
  if (v >= 100 || Number.isInteger(v)) return money(Math.round(v));
  return "₹" + v.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

/** "1 Box" reads badly after the word "per" — drop the redundant leading 1. */
export const perLabel = (per: string) => {
  const t = String(per || "unit").trim();
  return t.startsWith("1 ") ? t.slice(2).toLowerCase() : t;
};

/**
 * Rows quoted per many packets (One Sound, Red Bijili) get a comparable
 * per-packet figure alongside the case rate.
 */
export function unitPrice(p: { per: string; price: number }) {
  const m = /^(\d+)\s/.exec(p.per || "");
  if (!m) return null;
  const qty = parseInt(m[1], 10);
  if (!qty || qty < 2) return null;
  return { qty, each: p.price / qty };
}

/**
 * "+919489239970" → "+91 94892 39970".
 * Display text is always derived from the single value in lib/site.ts —
 * hardcoding it in markup is how a link ends up dialling a number the page
 * doesn't show.
 */
export function formatPhone(e164: string) {
  const d = e164.replace(/\D/g, "");
  const local = d.startsWith("91") && d.length === 12 ? d.slice(2) : d;
  return local.length === 10 ? `+91 ${local.slice(0, 5)} ${local.slice(5)}` : e164;
}

export function waLink(p?: { sno: string; name: string; case: string }) {
  const txt = p
    ? `Hi Sankamithra Fireworks, I'd like a quote for ${p.sno} — ${p.name}` +
      (p.case ? ` (${p.case} per case)` : "") + ". Please share your slab rates."
    : "Hi Sankamithra Fireworks, I'd like the 2026 price list and your wholesale slabs.";
  return `https://wa.me/${site.whatsapp}?text=${encodeURIComponent(txt)}`;
}
