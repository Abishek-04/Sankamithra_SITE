"use client";

import { useState } from "react";
import { site } from "@/lib/site";
import { Arrow, Check } from "./Icons";

type Errors = Partial<Record<"name" | "phone" | "email", string>>;

export default function EnquiryForm() {
  const [errors, setErrors] = useState<Errors>({});
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = e.currentTarget;
    const data = new FormData(f);
    const name = String(data.get("name") ?? "").trim();
    const phone = String(data.get("phone") ?? "").replace(/\D/g, "");
    const email = String(data.get("email") ?? "").trim();
    const interest = String(data.get("interest") ?? "");
    const message = String(data.get("message") ?? "").trim();

    const next: Errors = {};
    if (!name) next.name = "Please tell us your name.";
    if (phone.length < 10) next.phone = "Enter a 10-digit mobile number.";
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) next.email = "That email address doesn't look right.";
    setErrors(next);
    if (Object.keys(next).length) {
      f.querySelector<HTMLElement>(".field.is-invalid input, .field.is-invalid textarea")?.focus();
      return;
    }

    setBusy(true);
    try {
      if (site.formEndpoint) {
        const res = await fetch(site.formEndpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, phone, email, interest, message }),
        });
        if (!res.ok) throw new Error(String(res.status));
        setToast("Thank you — our team will call you within one working day.");
        f.reset();
      } else {
        // No backend wired yet: hand the enquiry to WhatsApp so nothing is lost.
        const text =
          `New enquiry from the website\n\nName: ${name}\nPhone: +91 ${phone}` +
          (email ? `\nEmail: ${email}` : "") +
          `\nInterest: ${interest}` +
          (message ? `\n\n${message}` : "");
        window.open(`https://wa.me/${site.whatsapp}?text=${encodeURIComponent(text)}`, "_blank", "noopener");
        setToast("Opening WhatsApp with your enquiry…");
        f.reset();
      }
    } catch {
      setToast(`Couldn't send that — please call us on ${site.phonePrimary}`);
    } finally {
      setBusy(false);
      setTimeout(() => setToast(null), 4200);
    }
  }

  const field = (k: keyof Errors) => `field${errors[k] ? " is-invalid" : ""}`;

  return (
    <>
      <form className="contact__form" onSubmit={onSubmit} noValidate data-reveal="left">
        <div className="contact__row">
          <label className={field("name")}>
            <span className="field__label">Your name *</span>
            <input className="input" type="text" name="name" autoComplete="name" placeholder="Ramesh Kumar" aria-invalid={!!errors.name} />
            <span className="field__err">{errors.name}</span>
          </label>
          <label className={field("phone")}>
            <span className="field__label">Mobile *</span>
            <input className="input" type="tel" name="phone" inputMode="numeric" autoComplete="tel" placeholder="94892 39970" maxLength={14} aria-invalid={!!errors.phone} />
            <span className="field__err">{errors.phone}</span>
          </label>
        </div>

        <label className={field("email")}>
          <span className="field__label">Email</span>
          <input className="input" type="email" name="email" autoComplete="email" placeholder="you@company.com" aria-invalid={!!errors.email} />
          <span className="field__err">{errors.email}</span>
        </label>

        <label className="field">
          <span className="field__label">I&apos;m here as a</span>
          <select className="select" name="interest" defaultValue="Wholesale buyer / distributor">
            <option>Wholesale buyer / distributor</option>
            <option>Retail shop owner</option>
            <option>Event or temple committee</option>
            <option>Private-label enquiry</option>
            <option>Family buying for a festival</option>
          </select>
        </label>

        <label className="field">
          <span className="field__label">What do you need?</span>
          <textarea className="textarea" name="message" placeholder="S.No list, quantities, delivery town and the date you need it by." />
        </label>

        <button className="btn btn--block btn--lg" type="submit" disabled={busy}>
          {busy ? "Sending…" : <>Send enquiry <span className="btn__ico" aria-hidden="true"><Arrow /></span></>}
        </button>
        <p className="form-note">We reply within one working day. Your details never leave Sankamithra.</p>
      </form>

      <div className={`toast${toast ? " is-on" : ""}`} role="status">
        <span className="toast__ico"><Check /></span>
        <span>{toast}</span>
      </div>
    </>
  );
}
