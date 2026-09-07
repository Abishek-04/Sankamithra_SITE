import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque, Plus_Jakarta_Sans, IBM_Plex_Mono } from "next/font/google";

import "@/styles/base.css";
import "@/styles/components.css";

import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import Fabs from "@/components/Fabs";
import MotionRuntime from "@/components/MotionRuntime";
import { site } from "@/lib/site";

/* Self-hosted, subset, preloaded. Removes the two third-party connections and
   the render-blocking stylesheet the old site paid for on every page. */
const display = Bricolage_Grotesque({
  subsets: ["latin"],
  weight: ["600", "700", "800"],
  variable: "--f-display",
  display: "swap",
  preload: true,
});
const body = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "600", "700", "800"],
  variable: "--f-body",
  display: "swap",
  preload: true,
});
const mono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--f-mono",
  display: "swap",
  preload: false,
});

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: {
    default: "Sankamithra Fireworks — Firecracker Manufacturer, Wholesaler & Retailer, Sivakasi",
    template: "%s — Sankamithra Fireworks",
  },
  description:
    "Sankamithra Fireworks manufactures, wholesales and retails licensed firecrackers from Sivakasi, Tamil Nadu. 16-acre licensed unit, 91 items on the 2026 price list, bulk supply across India.",
  applicationName: site.name,
  authors: [{ name: site.name }],
  openGraph: {
    type: "website",
    siteName: site.name,
    locale: "en_IN",
    images: ["/images/SkyShots.png"],
  },
  twitter: { card: "summary_large_image" },
  icons: { icon: "/images/LogoFrame.png", apple: "/images/LogoFrame.png" },
  alternates: { canonical: "/" },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#07060a" },
    { media: "(prefers-color-scheme: light)", color: "#fff8f4" },
  ],
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

/* Runs before first paint so the page never flashes the wrong theme. */
const themeBootstrap = `(function(){try{var s=localStorage.getItem("sanka-theme");
var t=s==="light"||s==="dark"?s:(matchMedia("(prefers-color-scheme: light)").matches?"light":"dark");
var e=document.documentElement;e.setAttribute("data-theme",t);e.style.colorScheme=t;}catch(e){}})()`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${display.variable} ${body.variable} ${mono.variable}`}
      data-scroll-behavior="smooth"
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeBootstrap }} />
        <link rel="preconnect" href="https://res.cloudinary.com" />
        <link rel="dns-prefetch" href="https://res.cloudinary.com" />
      </head>
      {/* extensions inject attributes here before hydration */}
      <body suppressHydrationWarning>
        <a className="skip-link" href="#main">Skip to content</a>
        <Nav />
        {children}
        <Footer />
        <Fabs />
        <MotionRuntime />
      </body>
    </html>
  );
}
