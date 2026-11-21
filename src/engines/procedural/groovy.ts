import type { ProcDef } from './types';
import { COL, TAU, f, ink, range } from './util';

export const swirlSun: ProcDef = {
  id: 'swirl-sun', name: 'Groovy swirl sunburst',
  params: [{ k: 'cells', label: 'Swirls per side', min: 1, max: 5, def: 2 }, { k: 'rays', label: 'Rays', min: 6, max: 48, def: 20 }, { k: 'twist', label: 'Twist (degrees)', min: -720, max: 720, step: 10, def: 220 },
    { k: 'duty', label: 'Ray width %', min: 20, max: 80, def: 50 }, { k: 'mirror', label: 'Mirror neighbours (1) / same direction (0)', min: 0, max: 1, def: 0 }, { ...COL, def: 1 }],
  render(w, h, c, p) {
    const n = Math.round(p.cells), cw = w / n, ch = h / n, R = Math.hypot(cw, ch) / 2 * 1.03, rays = Math.round(p.rays), tw = (p.twist * Math.PI) / 180, S = 14;
    const wedge = (k: number) => {
      const a0 = (TAU * k) / rays, a1 = a0 + (TAU / rays) * (p.duty / 100), pt = (a: number, t: number) => `${f(cw / 2 + R * t * Math.cos(a + tw * t))},${f(ch / 2 + R * t * Math.sin(a + tw * t))}`;
      let d = `M${f(cw / 2)},${f(ch / 2)}`;
      for (let s = 1; s <= S; s++) d += `L${pt(a0, s / S)}`;
      for (let s = S; s >= 1; s--) d += `L${pt(a1, s / S)}`;
      return d + 'Z';
    };
    const sun = range(0, rays - 1).map(wedge).join('');
    const cells = range(0, n - 1).flatMap(j => range(0, n - 1).map(i => {
      const flip = p.mirror > 0 && (i + j) % 2 === 1;
      const t = flip ? `translate(${f((i + 1) * cw)} ${f(j * ch)}) scale(-1 1)` : `translate(${f(i * cw)} ${f(j * ch)})`;
      return `<g transform="${t}" clip-path="url(#swc)"><path d="${sun}"/></g>`;
    })).join('');
    return `<defs><clipPath id="swc"><rect width="${f(cw)}" height="${f(ch)}"/></clipPath></defs><g fill="${ink(c, p)}">${cells}</g>`;
  },
};

export const warpStripes: ProcDef = {
  id: 'warp-stripes', name: 'Groovy warped stripes',
  params: [{ k: 'stripes', label: 'Stripes', min: 3, max: 40, def: 12 }, { k: 'amp', label: 'Warp strength', min: 0, max: 200, def: 70 }, { k: 'freq', label: 'Waves', min: 1, max: 8, def: 2 },
    { k: 'harm', label: 'Second wave %', min: 0, max: 100, def: 40 }, { k: 'duty', label: 'Stripe width %', min: 20, max: 80, def: 50 }, { k: 'horiz', label: 'Horizontal stripes', min: 0, max: 1, def: 0 }, COL],
  render(w, h, c, p) {
    const hz = p.horiz > 0, P = hz ? h : w, Lg = hz ? w : h, n = Math.round(p.stripes), cw = P / n, A = (p.amp / 100) * cw, k = Math.round(p.freq), N = 140;
    const off = (t: number) => A * (Math.sin(TAU * k * t) + (p.harm / 100) * Math.sin(TAU * (2 * k + 1) * t + 0.9));
    const xy = (a: number, b: number) => (hz ? `${f(b)},${f(a)}` : `${f(a)},${f(b)}`);
    let d = '';
    for (const i of range(-3, n + 2)) {
      let l = '', r = '';
      for (let s = 0; s <= N; s++) { const t = s / N, o = off(t); l += `${s ? 'L' : 'M'}${xy(i * cw + o, t * Lg)}`; r = `L${xy(i * cw + o + cw * (p.duty / 100), t * Lg)}` + r; }
      d += l + r + 'Z';
    }
    return `<path d="${d}" fill="${ink(c, p)}"/>`;
  },
};
