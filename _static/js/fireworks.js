/* ==========================================================================
   Hero canvas — shells, bursts, embers, drifting sparks.
   Self-throttling: pauses off-screen / on hidden tabs, scales particle
   budget to viewport area, and stands down entirely for reduced motion.
   ========================================================================== */
(function () {
  "use strict";

  function FireworkSky(canvas) {
    const ctx = canvas.getContext("2d", { alpha: true });
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const PALETTE = [
      [255, 84, 84], [255, 148, 46], [255, 205, 92],
      [255, 240, 205], [255, 108, 176], [126, 214, 255], [168, 255, 176],
    ];

    let W = 0, H = 0, dpr = 1;
    let shells = [], sparks = [], stars = [];
    let raf = null, last = 0, spawnAt = 0, running = false;

    function resize() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      const r = canvas.getBoundingClientRect();
      W = Math.max(1, r.width);
      H = Math.max(1, r.height);
      canvas.width = Math.round(W * dpr);
      canvas.height = Math.round(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      seedStars();
    }

    function seedStars() {
      const n = Math.round((W * H) / 14000);
      stars = [];
      for (let i = 0; i < n; i++) {
        stars.push({
          x: Math.random() * W,
          y: Math.random() * H * 0.82,
          r: Math.random() * 1.15 + 0.25,
          a: Math.random() * 0.5 + 0.16,
          tw: Math.random() * 0.02 + 0.004,
          ph: Math.random() * Math.PI * 2,
        });
      }
    }

    const budget = () => Math.round(Math.min(110, Math.max(46, (W * H) / 9000)));

    function launch(x) {
      const targetY = H * (0.14 + Math.random() * 0.32);
      const startX = x != null ? x : W * (0.12 + Math.random() * 0.76);
      shells.push({
        x: startX,
        y: H + 8,
        vx: (Math.random() - 0.5) * 0.5,
        vy: -(Math.sqrt(2 * 0.11 * (H - targetY)) + Math.random() * 0.5),
        targetY,
        colour: PALETTE[(Math.random() * PALETTE.length) | 0],
        trail: [],
      });
    }

    function burst(x, y, colour) {
      const n = budget();
      const power = 2.1 + Math.random() * 1.9;
      const ring = Math.random() > 0.55;

      for (let i = 0; i < n; i++) {
        const a = ring
          ? (i / n) * Math.PI * 2 + Math.random() * 0.06
          : Math.random() * Math.PI * 2;
        const sp = ring ? power * (0.88 + Math.random() * 0.24) : power * Math.random();
        sparks.push({
          x, y,
          vx: Math.cos(a) * sp,
          vy: Math.sin(a) * sp,
          life: 1,
          decay: 0.006 + Math.random() * 0.012,
          colour,
          size: Math.random() * 1.7 + 0.7,
        });
      }

      // flash
      sparks.push({ x, y, flash: 1, life: 1, decay: 0.06, colour, size: 0 });
    }

    function step(dt) {
      ctx.globalCompositeOperation = "source-over";
      ctx.clearRect(0, 0, W, H);

      /* starfield */
      for (let i = 0; i < stars.length; i++) {
        const s = stars[i];
        s.ph += s.tw * dt;
        const a = s.a + Math.sin(s.ph) * 0.22;
        ctx.globalAlpha = Math.max(0, a);
        ctx.fillStyle = "#fff6e6";
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;

      ctx.globalCompositeOperation = "lighter";

      /* rising shells */
      for (let i = shells.length - 1; i >= 0; i--) {
        const s = shells[i];
        s.vy += 0.11 * dt * 0.06;
        s.x += s.vx * dt;
        s.y += s.vy * dt;

        s.trail.push({ x: s.x, y: s.y });
        if (s.trail.length > 9) s.trail.shift();

        for (let t = 0; t < s.trail.length; t++) {
          const p = s.trail[t];
          const a = (t / s.trail.length) * 0.6;
          ctx.globalAlpha = a;
          ctx.fillStyle = `rgb(${s.colour[0]},${s.colour[1]},${s.colour[2]})`;
          ctx.beginPath();
          ctx.arc(p.x, p.y, 1.5 * (t / s.trail.length) + 0.4, 0, Math.PI * 2);
          ctx.fill();
        }

        if (s.vy >= -0.35 || s.y <= s.targetY) {
          burst(s.x, s.y, s.colour);
          shells.splice(i, 1);
        }
      }

      /* burst particles */
      for (let i = sparks.length - 1; i >= 0; i--) {
        const p = sparks[i];
        p.life -= p.decay * dt;

        if (p.life <= 0) { sparks.splice(i, 1); continue; }

        if (p.flash) {
          const r = 90 * (1 - p.life);
          const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, Math.max(1, r));
          g.addColorStop(0, `rgba(${p.colour[0]},${p.colour[1]},${p.colour[2]},${p.life * 0.5})`);
          g.addColorStop(1, "rgba(0,0,0,0)");
          ctx.globalAlpha = 1;
          ctx.fillStyle = g;
          ctx.beginPath();
          ctx.arc(p.x, p.y, Math.max(1, r), 0, Math.PI * 2);
          ctx.fill();
          continue;
        }

        p.vy += 0.019 * dt;
        p.vx *= 0.985;
        p.vy *= 0.985;
        p.x += p.vx * dt;
        p.y += p.vy * dt;

        ctx.globalAlpha = Math.max(0, p.life);
        ctx.fillStyle = `rgb(${p.colour[0]},${p.colour[1]},${p.colour[2]})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = "source-over";
    }

    function frame(t) {
      if (!running) return;
      const dt = Math.min(3, (t - last) / 16.67) || 1;
      last = t;

      if (t > spawnAt && shells.length < 4) {
        launch();
        spawnAt = t + 700 + Math.random() * 1500;
      }
      step(dt);
      raf = requestAnimationFrame(frame);
    }

    function start() {
      if (running || reduced) return;
      running = true;
      last = performance.now();
      spawnAt = last + 300;
      raf = requestAnimationFrame(frame);
    }

    function stop() {
      running = false;
      if (raf) cancelAnimationFrame(raf);
      raf = null;
    }

    /* one static frame so the sky is never empty for reduced-motion users */
    function paintStill() {
      resize();
      step(1);
      launch(W * 0.3);
      launch(W * 0.72);
      for (let i = 0; i < 260; i++) step(1);
    }

    resize();
    window.addEventListener("resize", debounceLocal(resize, 200));

    if (reduced) {
      paintStill();
    } else {
      const io = new IntersectionObserver(
        (e) => (e[0].isIntersecting ? start() : stop()),
        { threshold: 0.02 }
      );
      io.observe(canvas);
      document.addEventListener("visibilitychange", () =>
        document.hidden ? stop() : (isOnScreen(canvas) && start())
      );
      // a click anywhere on the hero fires a shell at the pointer
      const host = canvas.parentElement;
      if (host) {
        host.addEventListener("pointerdown", (e) => {
          if (e.target.closest("a, button, input")) return;
          const r = canvas.getBoundingClientRect();
          launch(e.clientX - r.left);
        });
      }
    }

    return { start, stop, launch };
  }

  function isOnScreen(el) {
    const r = el.getBoundingClientRect();
    return r.bottom > 0 && r.top < window.innerHeight;
  }

  function debounceLocal(fn, ms) {
    let t;
    return function () { clearTimeout(t); t = setTimeout(fn, ms); };
  }

  window.FireworkSky = FireworkSky;
})();
