/**
 * Firework audio, synthesised in the browser.
 *
 * Nothing is downloaded — every report, crackle and whistle is built from an
 * oscillator and a noise buffer at play time, so each one is slightly
 * different and the whole thing costs zero bytes.
 *
 * Rules this obeys:
 *  - silent until the visitor asks for it (browsers block autoplay anyway, but
 *    the point is that nobody gets startled by a bang they didn't request)
 *  - the choice persists, and it is off on a first visit
 *  - suspended whenever the tab is hidden or the hero scrolls away
 *  - hard-limited so overlapping shells can never clip
 */

type Kind = "peony" | "chrys" | "willow" | "ring" | "crackle" | "palm";

const rand = (a: number, b: number) => a + Math.random() * (b - a);

export class FireworkAudio {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private noise: AudioBuffer | null = null;
  private started = false;

  /** Built lazily: constructing an AudioContext before a gesture warns. */
  private ensure(): boolean {
    if (this.ctx) return true;
    const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC) return false;

    const ctx = new AC();
    // a limiter so three shells at once stay level instead of clipping
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -14;
    comp.knee.value = 22;
    comp.ratio.value = 12;
    comp.attack.value = 0.004;
    comp.release.value = 0.22;

    const master = ctx.createGain();
    master.gain.value = 0;
    master.connect(comp).connect(ctx.destination);

    // one second of white noise, reused for every report
    const len = ctx.sampleRate;
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;

    this.ctx = ctx;
    this.master = master;
    this.noise = buf;
    return true;
  }

  /** Must be called from a user gesture. */
  async enable(volume = 0.34) {
    if (!this.ensure() || !this.ctx || !this.master) return false;
    if (this.ctx.state === "suspended") await this.ctx.resume();
    this.master.gain.setTargetAtTime(volume, this.ctx.currentTime, 0.12);
    this.started = true;
    return true;
  }

  disable() {
    if (!this.ctx || !this.master) return;
    this.master.gain.setTargetAtTime(0, this.ctx.currentTime, 0.08);
    this.started = false;
  }

  suspend() { this.ctx?.state === "running" && this.ctx.suspend(); }
  resume() { this.started && this.ctx?.state === "suspended" && this.ctx.resume(); }
  close() { this.ctx?.close(); this.ctx = null; this.master = null; }

  get on() { return this.started; }

  /* ------------------------------------------------------------ helpers */

  private src(dur: number, when: number) {
    const s = this.ctx!.createBufferSource();
    s.buffer = this.noise!;
    s.loop = true;
    s.start(when);
    s.stop(when + dur + 0.05);
    return s;
  }

  private pan(x: number) {
    // x is 0..1 across the canvas; keep it off the hard edges
    const p = this.ctx!.createStereoPanner();
    p.pan.value = Math.max(-0.85, Math.min(0.85, (x * 2 - 1) * 0.8));
    return p;
  }

  /* -------------------------------------------------------------- voices */

  /** The rising shell: a thin whistle that climbs and thins out. */
  launch(x: number) {
    if (!this.started || !this.ctx) return;
    const t = this.ctx.currentTime;
    // matched to the climb, which is now ~2s
    const dur = rand(1.7, 2.2);

    const osc = this.ctx.createOscillator();
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(rand(360, 470), t);
    osc.frequency.exponentialRampToValueAtTime(rand(1000, 1400), t + dur);

    const bp = this.ctx.createBiquadFilter();
    bp.type = "bandpass";
    bp.frequency.value = 1100;
    bp.Q.value = 6;

    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.045, t + 0.2);
    g.gain.exponentialRampToValueAtTime(0.012, t + dur * 0.75);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);

    osc.connect(bp).connect(g).connect(this.pan(x)).connect(this.master!);
    osc.start(t);
    osc.stop(t + dur + 0.05);
  }

  /**
   * The report. Light beats sound, so the bang is delayed by how far the
   * shell is — a small thing that makes the whole scene feel physical.
   */
  boom(x: number, y: number, kind: Kind, scale = 1) {
    if (!this.started || !this.ctx) return;
    const dist = 0.35 + y * 0.65;                 // y 0..1, higher = further
    const t = this.ctx.currentTime + dist * 0.22;
    const size = scale * (1.25 - dist * 0.4);

    const soft = kind === "willow";
    const dur = soft ? rand(1.5, 2.1) : rand(0.85, 1.4);

    /* body: noise through a filter that sweeps down as it decays */
    const n = this.src(dur, t);
    const lp = this.ctx.createBiquadFilter();
    lp.type = "lowpass";
    lp.frequency.setValueAtTime(soft ? 1400 : rand(2600, 3600), t);
    lp.frequency.exponentialRampToValueAtTime(rand(90, 150), t + dur);
    lp.Q.value = 0.9;

    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime((soft ? 0.2 : 0.42) * size, t + (soft ? 0.05 : 0.012));
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);

    const p = this.pan(x);
    n.connect(lp).connect(g).connect(p).connect(this.master!);

    /* thump: the low end you feel more than hear */
    const osc = this.ctx.createOscillator();
    osc.type = "sine";
    osc.frequency.setValueAtTime(rand(78, 110), t);
    osc.frequency.exponentialRampToValueAtTime(rand(32, 44), t + 0.3);
    const og = this.ctx.createGain();
    og.gain.setValueAtTime(0.0001, t);
    og.gain.exponentialRampToValueAtTime(0.5 * size, t + 0.016);
    og.gain.exponentialRampToValueAtTime(0.0001, t + 0.42);
    osc.connect(og).connect(p);
    osc.start(t);
    osc.stop(t + 0.5);

    if (kind === "crackle") this.crackle(x, t + 0.06, size);
    if (kind === "palm" || kind === "chrys") this.tail(x, t + 0.1, size);
  }

  /** The pop-pop-pop of a glitter shell. */
  crackle(x: number, when: number, size = 1) {
    if (!this.started || !this.ctx) return;
    const p = this.pan(x);
    p.connect(this.master!);
    const count = 26 + ((Math.random() * 14) | 0);

    for (let i = 0; i < count; i++) {
      const t = when + Math.pow(Math.random(), 0.7) * 1.25;
      const n = this.src(0.05, t);
      const bp = this.ctx.createBiquadFilter();
      bp.type = "bandpass";
      bp.frequency.value = rand(2600, 6200);
      bp.Q.value = rand(4, 11);
      const g = this.ctx.createGain();
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(rand(0.05, 0.13) * size, t + 0.004);
      g.gain.exponentialRampToValueAtTime(0.0001, t + rand(0.05, 0.11));
      n.connect(bp).connect(g).connect(p);
    }
  }

  /** The hiss that hangs after a big break. */
  private tail(x: number, when: number, size: number) {
    const dur = rand(0.9, 1.6);
    const n = this.src(dur, when);
    const bp = this.ctx!.createBiquadFilter();
    bp.type = "bandpass";
    bp.frequency.setValueAtTime(rand(3000, 4200), when);
    bp.frequency.exponentialRampToValueAtTime(rand(900, 1400), when + dur);
    bp.Q.value = 1.4;
    const g = this.ctx!.createGain();
    g.gain.setValueAtTime(0.0001, when);
    g.gain.exponentialRampToValueAtTime(0.075 * size, when + 0.12);
    g.gain.exponentialRampToValueAtTime(0.0001, when + dur);
    n.connect(bp).connect(g).connect(this.pan(x)).connect(this.master!);
  }

  /** A ground fountain: sustained hiss with a bit of sputter. */
  fountain(x: number) {
    if (!this.started || !this.ctx) return;
    const t = this.ctx.currentTime;
    const dur = rand(1.4, 2.2);
    const n = this.src(dur, t);
    const bp = this.ctx.createBiquadFilter();
    bp.type = "bandpass";
    bp.frequency.value = rand(3200, 4600);
    bp.Q.value = 0.8;
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.11, t + 0.18);
    g.gain.setValueAtTime(0.11, t + dur * 0.6);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    n.connect(bp).connect(g).connect(this.pan(x)).connect(this.master!);
    this.crackle(x, t + 0.2, 0.5);
  }
}

/* ==========================================================================
   Shared instance
   The canvas and the toggle live in different parts of the tree, so the
   engine is a module singleton with a tiny subscription rather than a prop
   threaded through a wrapper component.
   ========================================================================== */

let instance: FireworkAudio | null = null;
const listeners = new Set<(on: boolean) => void>();
const KEY = "sanka-sound";

export function fireworkAudio(): FireworkAudio {
  if (!instance) instance = new FireworkAudio();
  return instance;
}

export const soundOn = () => instance?.on ?? false;

export function subscribeSound(fn: (on: boolean) => void): () => void {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

/** Must run inside a user gesture the first time. */
export async function toggleSound(): Promise<boolean> {
  const a = fireworkAudio();
  if (a.on) a.disable();
  else await a.enable();
  try { localStorage.setItem(KEY, a.on ? "on" : "off"); } catch {}
  listeners.forEach((fn) => fn(a.on));
  return a.on;
}

/** Was sound on last visit? Used only to hint, never to auto-start. */
export function soundRemembered() {
  try { return localStorage.getItem(KEY) === "on"; } catch { return false; }
}
