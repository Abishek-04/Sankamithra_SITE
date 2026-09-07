import { LocalImage } from "./CloudImage";
import Link from "next/link";
import Brand from "./Brand";
import { site } from "@/lib/site";
import { formatPhone } from "@/lib/format";

/* Server component — pure markup, zero client JS. */
export default function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="footer tone-night">
      <div className="shell">
        <div className="footer__grid">
          <div className="footer__col footer__brandcol">
            <Brand />
            <p className="footer__bio">
              Licensed firecracker manufacturer, wholesaler and retailer working out of
              Sivakasi, Tamil Nadu since 2020.
            </p>
            <div className="socials">
              <a href="https://www.facebook.com/" target="_blank" rel="noopener" aria-label="Facebook"><svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor"><path d="M14 9h3V6h-3c-2.2 0-4 1.8-4 4v2H8v3h2v7h3v-7h2.6l.4-3H13v-2c0-.6.4-1 1-1z" /></svg></a>
              <a href="https://www.instagram.com/" target="_blank" rel="noopener" aria-label="Instagram"><svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="3" width="18" height="18" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17.2" cy="6.8" r="1.1" fill="currentColor" stroke="none" /></svg></a>
              <a href={`https://wa.me/${site.whatsapp}`} target="_blank" rel="noopener" aria-label="WhatsApp"><svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor"><path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2 22l5.25-1.38a9.9 9.9 0 004.79 1.22c5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.82 9.82 0 0012.04 2zm4.52 11.97c-.25-.12-1.47-.72-1.69-.81-.23-.08-.39-.12-.56.13-.16.24-.64.8-.78.97-.15.16-.29.18-.53.06-.25-.13-1.05-.39-1.99-1.23-.74-.66-1.23-1.47-1.38-1.72-.14-.25-.01-.38.11-.5.11-.11.25-.29.37-.44.13-.15.17-.25.25-.41.09-.17.04-.31-.02-.44-.06-.12-.56-1.34-.76-1.84-.2-.48-.4-.42-.56-.43h-.47c-.17 0-.43.06-.66.31-.22.25-.86.85-.86 2.07 0 1.22.89 2.4 1.01 2.56.12.17 1.75 2.67 4.23 3.74.59.26 1.05.41 1.41.52.59.19 1.13.16 1.56.1.48-.07 1.47-.6 1.68-1.18.2-.58.2-1.08.15-1.18-.06-.11-.23-.17-.48-.29z" /></svg></a>
              <a href={`mailto:${site.email}`} aria-label="Email"><svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><rect x="2" y="4" width="20" height="16" rx="2" /><path d="M2.5 6.5l9.5 6.5 9.5-6.5" /></svg></a>
            </div>
          </div>

          <div className="footer__col">
            <h4>Explore</h4>
            <div className="footer__list">
              <Link href="/#story">Our story</Link>
              <Link href="/#business">What we do</Link>
              <Link href="/#manufacturing">Manufacturing</Link>
              <Link href="/products">Catalogue</Link>
              <a href={site.shopUrl} target="_blank" rel="noopener">Online shop</a>
            </div>
          </div>

          <div className="footer__col">
            <h4>Buy from us</h4>
            <div className="footer__list">
              <Link href="/#contact">Wholesale enquiry</Link>
              <Link href="/#contact">Retail &amp; gift boxes</Link>
              <Link href="/#contact">Private label</Link>
              <Link href="/products">2026 price list</Link>
            </div>
          </div>

          <div className="footer__col">
            <h4>Reach us</h4>
            <div className="footer__list">
              <a href={`tel:${site.phonePrimary}`}>{formatPhone(site.phonePrimary)}</a>
              <a href={`tel:${site.phoneFactory}`}>{formatPhone(site.phoneFactory)}</a>
              <a href={`mailto:${site.email}`}>{site.email}</a>
              <p>{site.factory}</p>
            </div>
          </div>
        </div>

        {/* textLength forces all eleven letters to fit the width exactly,
            whatever font ends up rendering */}
        <svg className="footer__mark" viewBox="0 0 1000 108" role="img" aria-label="Sankamithra" focusable="false">
          <defs>
            <linearGradient id="markFade" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.12" />
              <stop offset="92%" stopColor="#ffffff" stopOpacity="0.015" />
            </linearGradient>
          </defs>
          <text x="500" y="86" textAnchor="middle" textLength="1000" lengthAdjust="spacingAndGlyphs">SANKAMITHRA</text>
        </svg>

        <div className="footer__bar">
          <span>© {year} Sankamithra Fireworks. All rights reserved.</span>
          <span>Fireworks are sold and used subject to the Explosives Act. Please celebrate responsibly.</span>
          <a className="footer__credit" href="https://incrix.com" target="_blank" rel="noopener">
            Designed by <LocalImage src="/images/Incrix-Logo 1.png" alt="Incrix" width={62} height={18} loading="lazy" />
          </a>
        </div>
      </div>
    </footer>
  );
}
