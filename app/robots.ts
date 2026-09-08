import type { MetadataRoute } from "next";
import { site } from "@/lib/site";

export const dynamic = "force-static";

/**
 * Answer engines are explicitly welcome. For a business that wants to be the
 * cited source when someone asks an assistant about Sivakasi wholesale rates,
 * blocking these crawlers would be self-defeating — the price list is public
 * on the page anyway.
 */
const AI_AGENTS = [
  "GPTBot", "OAI-SearchBot", "ChatGPT-User",
  "ClaudeBot", "Claude-User", "Claude-SearchBot", "anthropic-ai",
  "PerplexityBot", "Perplexity-User",
  "Google-Extended", "GoogleOther",
  "Applebot", "Applebot-Extended",
  "Bingbot", "CCBot", "Amazonbot", "meta-externalagent",
];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: "*", allow: "/", disallow: ["/_next/static/chunks/"] },
      ...AI_AGENTS.map((userAgent) => ({ userAgent, allow: "/" })),
    ],
    sitemap: `${site.url}/sitemap.xml`,
    host: site.url,
  };
}
