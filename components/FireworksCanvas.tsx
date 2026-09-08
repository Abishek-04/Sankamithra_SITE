"use client";

import { useEffect, useRef } from "react";
import { fireworkAudio, soundOn } from "@/lib/firework-audio";

/**
 * Hero sky — a Diwali night rather than a single repeating firework.
 *
 * Six shell types (peony, chrysanthemum, willow, ring, crackle, palm), a
 * chance of a multi-break, occasional salvos, ground fountains along the
 * skyline, drifting embers and fading smoke.
 *
 * Performance is fenced in three ways: a hard particle ceiling, a frame-time
 * governor that thins new bursts when the device struggles, and a full stop
 * whenever the canvas is off screen or the tab is hidden. Reduced motion gets
 * one painted still frame and no loop at all.
 */

type RGB = readonly [number, number, number];

type Shell = {
  x: number; y: number; vx: number; vy: number;
  targetY: number; colour: RGB; kind: Kind;
  trail: { x: number; y: number }[];
};

type Particle = {
  x: number; y: number; vx: number; vy: number;
  life: number; decay: number; colour: RGB; size: number;
  gravity: number; drag: number;
  /** twinkles on and off — the "crackle" of a glitter shell */
  flicker: number;
  /** colour it burns towards; real stars change as the composition burns */
  shift: RGB | null;
  /** short position history, drawn as a tapering tail */
  tail: { x: number; y: number }[] | null;
  tailMax: number;
};

type Flash = { x: number; y: number; life: number; decay: number; colour: RGB; r: number };
type Smoke = { x: number; y: number; vx: number; vy: number; life: number; r: number };

type Kind = "peony" | "chrys" | "willow" | "ring" | "crackle" | "palm";

export default function FireworksCanvas() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    /** null until the visitor turns sound on, so nothing is ever scheduled. */
    const audioRef = { get current() { return soundOn() ? fireworkAudio() : null; } };
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;

    /* Festival palette — saturated primaries plus the gold and magenta that
       carry a Sivakasi shell. */
    const PALETTE: RGB[] = [
      [255, 84, 84], [255, 148, 46], [255, 205, 92], [255, 240, 205],
      [255, 108, 176], [126, 214, 255], [168, 255, 176], [190, 148, 255],
      [255, 233, 120], [96, 255, 232],
    ];
    const GOLD: RGB = [255, 198, 92];

    const KINDS: Kind[] = ["peony", "chrys", "willow", "ring", "crackle", "palm"];
    const pick = <T,>(a: readonly T[]): T => a[(Math.random() * a.length) | 0];
    const rand = (a: number, b: number) => a + Math.random() * (b - a);

    let W = 0, H = 0, dpr = 1;
    let shells: Shell[] = [];
    let parts: Particle[] = [];
    let flashes: Flash[] = [];
    let smoke: Smoke[] = [];
    let embers: Particle[] = [];
    let stars: { x: number; y: number; r: number; a: number; tw: number; ph: number }[] = [];

    let raf: number | null = null;
    let last = 0, spawnAt = 0, fountainAt = 0, running = false;

    /* ---- frame governor: thin the show rather than drop frames ---------- */
    let quality = 1;              // 0.35 … 1
    let slowFrames = 0, fastFrames = 0;
    const CEILING = () => Math.round(Math.min(2600, (W * H) / 560) * quality);

    function resize() {
      dpr = Math.min(devicePixelRatio || 1, 2);
      const r = canvas!.getBoundingClientRect();
      W = Math.max(1, r.width);
      H = Math.max(1, r.height);
      canvas!.width = Math.round(W * dpr);
      canvas!.height = Math.round(H * dpr);
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);

      stars = Array.from({ length: Math.round((W * H) / 12000) }, () => ({
        x: Math.random() * W,
        y: Math.random() * H * 0.85,
        r: Math.random() * 1.15 + 0.25,
        a: Math.random() * 0.5 + 0.16,
        tw: Math.random() * 0.02 + 0.004,
        ph: Math.random() * Math.PI * 2,
      }));
    }

    const room = () => Math.max(0, CEILING() - parts.length);

    function spark(
      x: number, y: number, angle: number, speed: number, colour: RGB,
      o: Partial<Particle> = {},
    ): Particle {
      return {
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 1,
        decay: 0.008,
        colour,
        size: 1.5,
        gravity: 0.018,
        drag: 0.985,
        flicker: 0,
        shift: null,
        tail: null,
        tailMax: 0,
        ...o,
      };
    }

    /* ------------------------------------------------------------ bursts */

    function burst(x: number, y: number, colour: RGB, kind: Kind, scale = 1) {
      const base = Math.round(Math.min(230, Math.max(74, (W * H) / 4600)) * quality * scale);
      const n = Math.min(base, room());
      if (n <= 0) return;

      flashes.push({ x, y, life: 1, decay: 0.05, colour, r: 96 * scale });

      // a shell leaves a little smoke where it opened
      if (quality > 0.6 && smoke.length < 26) {
        for (let i = 0; i < 3; i++) {
          smoke.push({
            x, y, vx: rand(-0.18, 0.18), vy: rand(-0.24, -0.05),
            life: 1, r: rand(16, 30) * scale,
          });
        }
      }

      const power = rand(3.1, 5.4) * (Math.min(W, H) / 820) * scale;
      // most shells burn towards a second colour partway through
      const shift: RGB | null = Math.random() < 0.55 ? pick(PALETTE) : null;

      // one shell in seven carries a strobing white layer over its colour
      if (Math.random() < 0.14 && kind !== "crackle") {
        const m = Math.min(Math.round(n * 0.3), room());
        for (let i = 0; i < m; i++) {
          parts.push(spark(x, y, Math.random() * Math.PI * 2, power * rand(0.3, 0.9), [255, 250, 238], {
            decay: rand(0.004, 0.008), size: rand(1, 1.9),
            gravity: 0.014, flicker: rand(0.8, 1.6),
          }));
        }
      }

      switch (kind) {
        /* dense sphere, clean fade */
        case "peony":
          for (let i = 0; i < n; i++) {
            parts.push(spark(x, y, Math.random() * Math.PI * 2, power * Math.random(), colour, {
              decay: rand(0.006, 0.014), size: rand(1.1, 2.8), shift,
            }));
          }
          break;

        /* sphere that draws tails behind it */
        case "chrys":
          for (let i = 0; i < n; i++) {
            parts.push(spark(x, y, Math.random() * Math.PI * 2, power * (0.5 + Math.random() * 0.5), colour, {
              decay: rand(0.005, 0.011), size: rand(1.3, 2.6), shift,
              tail: [], tailMax: 8,
            }));
          }
          break;

        /* slow golden droop — the one that reads as "festival" */
        case "willow":
          for (let i = 0; i < n; i++) {
            const a = (i / n) * Math.PI * 2 + rand(-0.1, 0.1);
            parts.push(spark(x, y, a, power * rand(0.45, 0.8), GOLD, {
              decay: rand(0.0024, 0.0044), size: rand(1.4, 2.8),
              gravity: 0.03, drag: 0.976,
              flicker: Math.random() < 0.3 ? rand(0.1, 0.3) : 0,
              tail: [], tailMax: 13,
            }));
          }
          break;

        /* flat expanding ring — sometimes two, crossed */
        case "ring": {
          const rings = Math.random() < 0.45 ? 2 : 1;
          const per = Math.floor(n / rings);
          for (let k = 0; k < rings; k++) {
            const tilt = rand(0, Math.PI);
            const squash = rand(0.18, 0.42);
            const ringColour = k === 0 ? colour : pick(PALETTE);
            for (let i = 0; i < per; i++) {
              const a = (i / per) * Math.PI * 2;
              const ux = Math.cos(a);
              const uy = Math.sin(a) * squash;
              const rx = ux * Math.cos(tilt) - uy * Math.sin(tilt);
              const ry = ux * Math.sin(tilt) + uy * Math.cos(tilt);
              const sp = power * rand(0.92, 1.06) * (k ? 0.72 : 1);
              parts.push({
                ...spark(x, y, 0, 0, ringColour, {
                  decay: rand(0.007, 0.012), size: rand(1.3, 2.4),
                }),
                vx: rx * sp,
                vy: ry * sp,
              });
            }
          }
          break;
        }

        /* small core, then a cloud of twinkling glitter */
        case "crackle":
          for (let i = 0; i < n * 0.35; i++) {
            parts.push(spark(x, y, Math.random() * Math.PI * 2, power * 0.5 * Math.random(), colour, {
              decay: rand(0.015, 0.03), size: rand(1, 1.8),
            }));
          }
          for (let i = 0; i < n * 0.65; i++) {
            parts.push(spark(x, y, Math.random() * Math.PI * 2, power * rand(0.2, 1.05), [255, 244, 214], {
              decay: rand(0.004, 0.009), size: rand(0.8, 1.5),
              gravity: 0.012, flicker: rand(0.25, 0.7),
            }));
          }
          break;

        /* few thick arms arcing over, like a palm tree */
        case "palm": {
          const arms = 9 + ((Math.random() * 4) | 0);
          const per = Math.max(3, Math.floor(n / arms));
          for (let a = 0; a < arms; a++) {
            const ang = -Math.PI / 2 + ((a / arms) - 0.5) * Math.PI * 1.5;
            for (let i = 0; i < per; i++) {
              parts.push(spark(x, y, ang + rand(-0.07, 0.07), power * rand(0.7, 1.25), colour, {
                decay: rand(0.004, 0.008), size: rand(1.4, 2.8),
                gravity: 0.034, drag: 0.98,
                tail: [], tailMax: 9,
              }));
            }
          }
          break;
        }
      }
    }

    /* ------------------------------------------------------------ shells */

    /** Horizontal band that avoids the headline column on wide viewports. */
    function lane() {
      if (W < 900) return W * rand(0.06, 0.94);
      return Math.random() < 0.76
        ? W * rand(0.56, 0.96)   // open sky to the right of the copy
        : W * rand(0.02, 0.16);  // a few far left, past the text
    }

    function launch(x?: number, kind?: Kind) {
      const targetY = H * rand(0.08, 0.34);
      const sx = x ?? lane();
      if (Math.random() < 0.55) audioRef.current?.launch(sx / W);
      shells.push({
        x: sx,
        y: H + 8,
        vx: rand(-0.35, 0.35),
        vy: -(Math.sqrt(2 * 0.11 * (H - targetY)) + rand(0, 0.55)),
        targetY,
        colour: pick(PALETTE),
        kind: kind ?? pick(KINDS),
        trail: [],
      });
    }

    /** A ground-level fountain — the flower pot on the doorstep. */
    function fountain() {
      const x = W < 900 ? W * rand(0.1, 0.9) : W * rand(0.58, 0.95);
      const y = H * 0.92;
      const colour = pick([GOLD, [255, 228, 150], [255, 170, 90]] as RGB[]);
      audioRef.current?.fountain(x / W);
      const n = Math.min(46, room());
      for (let i = 0; i < n; i++) {
        parts.push(spark(x, y, -Math.PI / 2 + rand(-0.34, 0.34), rand(2.4, 5.2), colour, {
          decay: rand(0.009, 0.02), size: rand(1, 2.1),
          gravity: 0.075, drag: 0.99,
          tail: [], tailMax: 5,
          flicker: rand(0, 0.4),
        }));
      }
    }

    /** Slow embers drifting up, so the sky is never completely still. */
    function ember() {
      if (embers.length > 24) return;
      embers.push(spark(W * Math.random(), H + 4, -Math.PI / 2 + rand(-0.5, 0.5), rand(0.15, 0.4), GOLD, {
        decay: rand(0.0016, 0.0035), size: rand(0.7, 1.6),
        gravity: -0.004, drag: 0.999, flicker: rand(0.15, 0.5),
      }));
    }

    /* -------------------------------------------------------------- draw */

    function step(dt: number) {
      /* Fading rather than clearing leaves a short wake behind every spark —
         the single biggest difference between "dots moving" and "fireworks".
         destination-out erases by alpha, keeping the canvas transparent over
         the hero gradient. */
      ctx!.globalCompositeOperation = "destination-out";
      ctx!.fillStyle = `rgba(0,0,0,${Math.min(0.5, 0.16 * dt)})`;
      ctx!.fillRect(0, 0, W, H);
      ctx!.globalCompositeOperation = "source-over";

      /* starfield — repainted each frame over the fade */
      ctx!.fillStyle = "#fff6e6";
      for (const s of stars) {
        s.ph += s.tw * dt;
        ctx!.globalAlpha = Math.max(0, s.a + Math.sin(s.ph) * 0.22);
        ctx!.beginPath();
        ctx!.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx!.fill();
      }
      ctx!.globalAlpha = 1;

      ctx!.globalCompositeOperation = "lighter";

      /* lingering warmth where a shell opened — a soft radial, never a disc */
      for (let i = smoke.length - 1; i >= 0; i--) {
        const p = smoke[i];
        p.life -= 0.0075 * dt;
        if (p.life <= 0) { smoke.splice(i, 1); continue; }
        p.x += p.vx * dt; p.y += p.vy * dt; p.r += 0.5 * dt;
        const a = p.life * p.life * 0.09;
        const g = ctx!.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r);
        g.addColorStop(0, `rgba(255, 176, 96, ${a})`);
        g.addColorStop(1, "rgba(255, 140, 60, 0)");
        ctx!.fillStyle = g;
        ctx!.beginPath();
        ctx!.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx!.fill();
      }

      /* burst flashes */
      for (let i = flashes.length - 1; i >= 0; i--) {
        const f = flashes[i];
        f.life -= f.decay * dt;
        if (f.life <= 0) { flashes.splice(i, 1); continue; }
        const r = f.r * (1.35 - f.life);
        const g = ctx!.createRadialGradient(f.x, f.y, 0, f.x, f.y, Math.max(1, r));
        g.addColorStop(0, `rgba(${f.colour[0]},${f.colour[1]},${f.colour[2]},${f.life * 0.5})`);
        g.addColorStop(1, "rgba(0,0,0,0)");
        ctx!.fillStyle = g;
        ctx!.beginPath();
        ctx!.arc(f.x, f.y, Math.max(1, r), 0, Math.PI * 2);
        ctx!.fill();
      }

      /* rising shells */
      for (let i = shells.length - 1; i >= 0; i--) {
        const s = shells[i];
        s.vy += 0.11 * dt * 0.06;
        s.x += s.vx * dt;
        s.y += s.vy * dt;

        s.trail.push({ x: s.x, y: s.y });
        if (s.trail.length > 10) s.trail.shift();

        for (let t = 0; t < s.trail.length; t++) {
          const p = s.trail[t];
          const f = t / s.trail.length;
          ctx!.globalAlpha = f * 0.65;
          ctx!.fillStyle = `rgb(${s.colour[0]},${s.colour[1]},${s.colour[2]})`;
          ctx!.beginPath();
          ctx!.arc(p.x, p.y, 1.6 * f + 0.4, 0, Math.PI * 2);
          ctx!.fill();
        }

        if (s.vy >= -0.35 || s.y <= s.targetY) {
          burst(s.x, s.y, s.colour, s.kind);
          audioRef.current?.boom(s.x / W, s.y / H, s.kind);
          // one in six opens again, smaller, a beat later
          if (Math.random() < 0.17) {
            const { x, y, kind } = s;
            const c = pick(PALETTE);
            setTimeout(() => {
              if (!running) return;
              const k2 = kind === "willow" ? "crackle" : "peony";
              burst(x, y + 12, c, k2, 0.55);
              audioRef.current?.boom(x / W, y / H, k2, 0.5);
            }, 420);
          }
          shells.splice(i, 1);
        }
      }
      ctx!.globalAlpha = 1;

      /* burst particles + embers share the same integrator */
      for (const list of [parts, embers]) {
        for (let i = list.length - 1; i >= 0; i--) {
          const p = list[i];
          p.life -= p.decay * dt;
          if (p.life <= 0 || p.y > H + 30) { list.splice(i, 1); continue; }

          p.vy += p.gravity * dt;
          p.vx *= p.drag;
          p.vy *= p.drag;
          p.x += p.vx * dt;
          p.y += p.vy * dt;

          if (p.tail) {
            p.tail.push({ x: p.x, y: p.y });
            if (p.tail.length > p.tailMax) p.tail.shift();
          }

          let a = p.life;
          if (p.flicker) a *= 0.45 + 0.55 * Math.abs(Math.sin(p.life * 90 * p.flicker));

          let col = p.colour;
          if (p.shift) {
            const k = 1 - p.life;
            col = [
              p.colour[0] + (p.shift[0] - p.colour[0]) * k,
              p.colour[1] + (p.shift[1] - p.colour[1]) * k,
              p.colour[2] + (p.shift[2] - p.colour[2]) * k,
            ] as unknown as RGB;
          }
          ctx!.fillStyle = `rgb(${col[0] | 0},${col[1] | 0},${col[2] | 0})`;

          if (p.tail && p.tail.length > 1) {
            for (let t = 0; t < p.tail.length; t++) {
              const q = p.tail[t];
              const f = t / p.tail.length;
              ctx!.globalAlpha = Math.max(0, a * f * 0.5);
              ctx!.beginPath();
              ctx!.arc(q.x, q.y, p.size * f * 0.75, 0, Math.PI * 2);
              ctx!.fill();
            }
          }

          const r = p.size * Math.max(0.25, p.life);
          ctx!.globalAlpha = Math.max(0, a);
          ctx!.beginPath();
          ctx!.arc(p.x, p.y, r, 0, Math.PI * 2);
          ctx!.fill();

          // a hot white core on the brightest sparks
          if (a > 0.55 && r > 1.1) {
            ctx!.globalAlpha = (a - 0.55) * 1.4;
            ctx!.fillStyle = "#fff8ec";
            ctx!.beginPath();
            ctx!.arc(p.x, p.y, r * 0.45, 0, Math.PI * 2);
            ctx!.fill();
          }
        }
      }

      ctx!.globalAlpha = 1;
      ctx!.globalCompositeOperation = "source-over";
    }

    /* -------------------------------------------------------------- loop */

    function frame(t: number) {
      if (!running) return;
      const raw = t - last;
      const dt = Math.min(3, raw / 16.67) || 1;
      last = t;

      // govern: sustained slow frames thin the show, sustained fast ones restore it
      if (raw > 26) { slowFrames++; fastFrames = 0; } else { fastFrames++; slowFrames = 0; }
      if (slowFrames > 24 && quality > 0.35) { quality = Math.max(0.35, quality - 0.12); slowFrames = 0; }
      else if (fastFrames > 180 && quality < 1) { quality = Math.min(1, quality + 0.08); fastFrames = 0; }

      if (t > spawnAt && shells.length < 5) {
        launch();
        // an occasional salvo, the way a real volley goes up
        if (Math.random() < 0.3) {
          launch();
          if (Math.random() < 0.4) setTimeout(() => running && launch(), 190);
        }
        spawnAt = t + rand(520, 1500);
      }

      if (t > fountainAt) {
        fountain();
        fountainAt = t + rand(3200, 7000);
      }

      if (Math.random() < 0.05 * dt) ember();

      step(dt);
      raf = requestAnimationFrame(frame);
    }

    const start = () => {
      if (running || reduced) return;
      running = true;
      audioRef.current?.resume();
      last = performance.now();
      spawnAt = last + 240;
      fountainAt = last + 1400;
      raf = requestAnimationFrame(frame);
    };
    const stop = () => {
      running = false;
      if (raf) cancelAnimationFrame(raf);
      raf = null;
      audioRef.current?.suspend();
    };

    resize();

    let rt: ReturnType<typeof setTimeout>;
    const onResize = () => { clearTimeout(rt); rt = setTimeout(resize, 200); };
    addEventListener("resize", onResize);

    let io: IntersectionObserver | null = null;
    const onVis = () => (document.hidden ? stop() : start());
    const onDown = (e: PointerEvent) => {
      if ((e.target as Element)?.closest?.("a, button, input, select, textarea")) return;
      const r = canvas.getBoundingClientRect();
      launch(e.clientX - r.left);
    };

    if (reduced) {
      // one composed still frame: a sky mid-display, no loop
      step(1);
      burst(W * 0.26, H * 0.3, PALETTE[0], "chrys");
      burst(W * 0.68, H * 0.24, PALETTE[4], "willow");
      burst(W * 0.46, H * 0.42, GOLD, "ring", 0.8);
      for (let i = 0; i < 190; i++) step(1);
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
