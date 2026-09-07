"use client";

import { useEffect, useRef } from "react";

/**
 * Hero sky — shells, bursts and a starfield. Loaded lazily and only ever
 * running while on screen and visible; stands down entirely for reduced
 * motion after painting one still frame.
 */
export default function FireworksCanvas() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;
    const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;

    const PALETTE = [
      [255, 84, 84], [255, 148, 46], [255, 205, 92],
      [255, 240, 205], [255, 108, 176], [126, 214, 255], [168, 255, 176],
    ];

    type Shell = { x: number; y: number; vx: number; vy: number; targetY: number; colour: number[]; trail: { x: number; y: number }[] };
    type Spark = { x: number; y: number; vx: number; vy: number; life: number; decay: number; colour: number[]; size: number; flash?: number };

    let W = 0, H = 0;
    let shells: Shell[] = [], sparks: Spark[] = [];
    let stars: { x: number; y: number; r: number; a: number; tw: number; ph: number }[] = [];
    let raf: number | null = null, last = 0, spawnAt = 0, running = false;

    function resize() {
      const dpr = Math.min(devicePixelRatio || 1, 2);
      const r = canvas!.getBoundingClientRect();
      W = Math.max(1, r.width);
      H = Math.max(1, r.height);
      canvas!.width = Math.round(W * dpr);
      canvas!.height = Math.round(H * dpr);
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
      const n = Math.round((W * H) / 14000);
      stars = Array.from({ length: n }, () => ({
        x: Math.random() * W, y: Math.random() * H * 0.82,
        r: Math.random() * 1.15 + 0.25, a: Math.random() * 0.5 + 0.16,
        tw: Math.random() * 0.02 + 0.004, ph: Math.random() * Math.PI * 2,
      }));
    }

    const budget = () => Math.round(Math.min(110, Math.max(46, (W * H) / 9000)));

    function launch(x?: number) {
      const targetY = H * (0.14 + Math.random() * 0.32);
      shells.push({
        x: x ?? W * (0.12 + Math.random() * 0.76), y: H + 8,
        vx: (Math.random() - 0.5) * 0.5,
        vy: -(Math.sqrt(2 * 0.11 * (H - targetY)) + Math.random() * 0.5),
        targetY, colour: PALETTE[(Math.random() * PALETTE.length) | 0], trail: [],
      });
    }

    function burst(x: number, y: number, colour: number[]) {
      const n = budget();
      const power = 2.1 + Math.random() * 1.9;
      const ring = Math.random() > 0.55;
      for (let i = 0; i < n; i++) {
        const a = ring ? (i / n) * Math.PI * 2 + Math.random() * 0.06 : Math.random() * Math.PI * 2;
        const sp = ring ? power * (0.88 + Math.random() * 0.24) : power * Math.random();
        sparks.push({
          x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, life: 1,
          decay: 0.006 + Math.random() * 0.012, colour, size: Math.random() * 1.7 + 0.7,
        });
      }
      sparks.push({ x, y, vx: 0, vy: 0, flash: 1, life: 1, decay: 0.06, colour, size: 0 });
    }

    function step(dt: number) {
      ctx!.globalCompositeOperation = "source-over";
      ctx!.clearRect(0, 0, W, H);

      for (const s of stars) {
        s.ph += s.tw * dt;
        ctx!.globalAlpha = Math.max(0, s.a + Math.sin(s.ph) * 0.22);
        ctx!.fillStyle = "#fff6e6";
        ctx!.beginPath();
        ctx!.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx!.fill();
      }
      ctx!.globalAlpha = 1;
      ctx!.globalCompositeOperation = "lighter";

      for (let i = shells.length - 1; i >= 0; i--) {
        const s = shells[i];
        s.vy += 0.11 * dt * 0.06;
        s.x += s.vx * dt;
        s.y += s.vy * dt;
        s.trail.push({ x: s.x, y: s.y });
        if (s.trail.length > 9) s.trail.shift();
        for (let t = 0; t < s.trail.length; t++) {
          const p = s.trail[t];
          ctx!.globalAlpha = (t / s.trail.length) * 0.6;
          ctx!.fillStyle = `rgb(${s.colour[0]},${s.colour[1]},${s.colour[2]})`;
          ctx!.beginPath();
          ctx!.arc(p.x, p.y, 1.5 * (t / s.trail.length) + 0.4, 0, Math.PI * 2);
          ctx!.fill();
        }
        if (s.vy >= -0.35 || s.y <= s.targetY) { burst(s.x, s.y, s.colour); shells.splice(i, 1); }
      }

      for (let i = sparks.length - 1; i >= 0; i--) {
        const p = sparks[i];
        p.life -= p.decay * dt;
        if (p.life <= 0) { sparks.splice(i, 1); continue; }
        if (p.flash) {
          const r = 90 * (1 - p.life);
          const g = ctx!.createRadialGradient(p.x, p.y, 0, p.x, p.y, Math.max(1, r));
          g.addColorStop(0, `rgba(${p.colour[0]},${p.colour[1]},${p.colour[2]},${p.life * 0.5})`);
          g.addColorStop(1, "rgba(0,0,0,0)");
          ctx!.globalAlpha = 1;
          ctx!.fillStyle = g;
          ctx!.beginPath();
          ctx!.arc(p.x, p.y, Math.max(1, r), 0, Math.PI * 2);
          ctx!.fill();
          continue;
        }
        p.vy += 0.019 * dt;
        p.vx *= 0.985; p.vy *= 0.985;
        p.x += p.vx * dt; p.y += p.vy * dt;
        ctx!.globalAlpha = Math.max(0, p.life);
        ctx!.fillStyle = `rgb(${p.colour[0]},${p.colour[1]},${p.colour[2]})`;
        ctx!.beginPath();
        ctx!.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
        ctx!.fill();
      }
      ctx!.globalAlpha = 1;
      ctx!.globalCompositeOperation = "source-over";
    }

    const frame = (t: number) => {
      if (!running) return;
      const dt = Math.min(3, (t - last) / 16.67) || 1;
      last = t;
      if (t > spawnAt && shells.length < 4) {
        launch();
        spawnAt = t + 700 + Math.random() * 1500;
      }
      step(dt);
      raf = requestAnimationFrame(frame);
    };
    const start = () => {
      if (running || reduced) return;
      running = true;
      last = performance.now();
      spawnAt = last + 300;
      raf = requestAnimationFrame(frame);
    };
    const stop = () => {
      running = false;
      if (raf) cancelAnimationFrame(raf);
      raf = null;
    };

    resize();
    let rt: ReturnType<typeof setTimeout>;
    const onResize = () => { clearTimeout(rt); rt = setTimeout(resize, 200); };
    addEventListener("resize", onResize);

    let io: IntersectionObserver | null = null;
    const onVis = () => (document.hidden ? stop() : start());
    const onDown = (e: PointerEvent) => {
      if ((e.target as Element)?.closest?.("a, button, input")) return;
      launch(e.clientX - canvas.getBoundingClientRect().left);
    };

    if (reduced) {
      step(1);
      launch(W * 0.3);
      launch(W * 0.72);
      for (let i = 0; i < 260; i++) step(1);
    } else {
      io = new IntersectionObserver((e) => (e[0].isIntersecting ? start() : stop()), { threshold: 0.02 });
      io.observe(canvas);
      document.addEventListener("visibilitychange", onVis);
      canvas.parentElement?.addEventListener("pointerdown", onDown);
    }

    return () => {
      stop();
      clearTimeout(rt);
      removeEventListener("resize", onResize);
      io?.disconnect();
      document.removeEventListener("visibilitychange", onVis);
      canvas.parentElement?.removeEventListener("pointerdown", onDown);
    };
  }, []);

  return <canvas className="hero__sky" ref={ref} aria-hidden="true" />;
}
