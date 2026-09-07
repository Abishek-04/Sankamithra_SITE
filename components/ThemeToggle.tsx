"use client";

import { useCallback, useEffect, useState } from "react";

type Theme = "light" | "dark";

const read = (): Theme =>
  document.documentElement.getAttribute("data-theme") === "light" ? "light" : "dark";

export default function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>("dark");

  const apply = useCallback((t: Theme, persist: boolean) => {
    const root = document.documentElement;
    // freeze transitions for a frame so the page flips as one piece
    root.classList.add("theme-swap");
    root.setAttribute("data-theme", t);
    root.style.colorScheme = t;
    requestAnimationFrame(() => requestAnimationFrame(() => root.classList.remove("theme-swap")));
    if (persist) { try { localStorage.setItem("sanka-theme", t); } catch {} }
    setTheme(t);
  }, []);

  useEffect(() => {
    setTheme(read());
    // keep following the OS until the visitor makes a choice
    const mq = matchMedia("(prefers-color-scheme: light)");
    const onOS = (e: MediaQueryListEvent) => {
      let stored: string | null = null;
      try { stored = localStorage.getItem("sanka-theme"); } catch {}
      if (stored !== "light" && stored !== "dark") apply(e.matches ? "light" : "dark", false);
    };
    mq.addEventListener("change", onOS);
    return () => mq.removeEventListener("change", onOS);
  }, [apply]);

  const light = theme === "light";
  return (
    <button
      className="theme-toggle"
      type="button"
      role="switch"
      aria-checked={light}
      aria-label={light ? "Switch to dark theme" : "Switch to light theme"}
      title="Switch theme"
      onClick={() => apply(light ? "dark" : "light", true)}
    >
      <svg className="ico-moon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M20 14.5A8.5 8.5 0 019.5 4a8.5 8.5 0 1010.5 10.5z" />
      </svg>
      <svg className="ico-sun" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" aria-hidden="true">
        <circle cx="12" cy="12" r="4.2" />
        <path d="M12 2v2.4M12 19.6V22M4.2 4.2l1.7 1.7M18.1 18.1l1.7 1.7M2 12h2.4M19.6 12H22M4.2 19.8l1.7-1.7M18.1 5.9l1.7-1.7" />
      </svg>
    </button>
  );
}
