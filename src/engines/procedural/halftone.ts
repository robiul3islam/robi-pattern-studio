import type { ProcDef } from './types';
import { COL, TAU, even, f, field, ink, range } from './util';
import { mulberry32 } from '../../utils/rng';

const GRAD = { k: 'dir', label: 'Gradient: 0 down / 1 side / 2 diagonal / 3 blobs', min: 0, max: 3, def: 0 };
const SAW = { k: 'saw', label: 'One-way fade (1) or smooth loop (0)', min: 0, max: 1, def: 0 };
const INV = { k: 'inv', label: 'Invert gradient', min: 0, max: 1, def: 0 };

export const halftoneTri: ProcDef = {
  id: 'halftone-tri', name: 'Halftone triangles',
  params: [{ k: 'scale', label: 'Triangles across', min: 6, max: 60, def: 22 }, { k: 'min', label: 'Smallest size %', min: 2, max: 60, def: 8 }, { k: 'max', label: 'Largest size %', min: 60, max: 100, def: 97 }, GRAD, SAW, INV, COL],
  render(w, h, c, p) {
    const n = Math.round(p.scale), a = w / n, m = even(h / (a * 0.866)), hh = h / m, lo = p.min / 100, hi = p.max / 100;
    let d = '';
    const tri = (pts: number[][], cx: number, cy: number) => {
      const g = field(p.dir, cx, cy, w, h, p.saw > 0, p.inv > 0), k = lo + (hi - lo) * g;
      if (k < 0.03) return;
      d += pts.map(([x, y], i) => `${i ? 'L' : 'M'}${f(cx + (x - cx) * k)},${f(cy + (y - cy) * k)}`).join('') + 'Z';
    };
    for (const j of range(0, m - 1)) {
      const ox = (j % 2) * a / 2, y0 = j * hh, y1 = y0 + hh;
      for (const i of range(-1, n)) {
        const x = i * a + ox;
        tri([[x + a / 2, y0], [x, y1], [x + a, y1]], x + a / 2, (y0 + 2 * y1) / 3);
        tri([[x + a / 2, y0], [x + 1.5 * a, y0], [x + a, y1]], x + a, (2 * y0 + y1) / 3);
      }
    }
    return `<path d="${d}" fill="${ink(c, p)}"/>`;
  },
};

export const halftoneDots: ProcDef = {
  id: 'halftone-dots', name: 'Halftone dots',
  params: [{ k: 'scale', label: 'Dots across', min: 8, max: 70, def: 30 }, { k: 'min', label: 'Smallest dot %', min: 0, max: 50, def: 6 }, { k: 'hex', label: 'Offset rows (1) or square grid (0)', min: 0, max: 1, def: 1 },
    { k: 'shape', label: 'Shape: 0 circle / 1 square / 2 diamond', min: 0, max: 2, def: 0 }, { ...GRAD, def: 3 }, SAW, INV, COL],
  render(w, h, c, p) {
    const n = Math.round(p.scale), cw = w / n, hex = p.hex > 0, m = hex ? even(h / (cw * 0.866)) : Math.max(2, Math.round(h / cw)), ch = h / m;
    const lo = p.min / 100, R = (hex ? 0.56 : 0.5) * Math.min(cw, ch * (hex ? 1.15 : 1)) * 1.04;
    let d = '';
    for (const j of range(0, m - 1)) for (const i of range(-1, n)) {
      const x = (i + 0.5 + (hex && j % 2 ? 0.5 : 0)) * cw, y = (j + 0.5) * ch;
      const r = R * (lo + (1 - lo) * field(p.dir, x, y, w, h, p.saw > 0, p.inv > 0));
      if (r < 0.6) continue;
      if (p.shape < 0.5) d += `M${f(x - r)},${f(y)}a${f(r)},${f(r)} 0 1,0 ${f(2 * r)},0a${f(r)},${f(r)} 0 1,0 ${f(-2 * r)},0Z`;
      else if (p.shape < 1.5) d += `M${f(x - r)},${f(y - r)}h${f(2 * r)}v${f(2 * r)}h${f(-2 * r)}Z`;
      else d += `M${f(x)},${f(y - r * 1.2)}L${f(x + r * 1.2)},${f(y)}L${f(x)},${f(y + r * 1.2)}L${f(x - r * 1.2)},${f(y)}Z`;
    }
    return `<path d="${d}" fill="${ink(c, p)}"/>`;
  },
};

export const halftoneSlash: ProcDef = {
  id: 'halftone-slash', name: 'Speed slash fade',
  params: [{ k: 'rows', label: 'Bands', min: 4, max: 40, def: 24 }, { k: 'lines', label: 'Slashes per band', min: 10, max: 120, def: 70 }, { k: 'slant', label: 'Slant', min: 0.3, max: 2.5, step: 0.1, def: 1 },
    { k: 'thick', label: 'Thickness', min: 0.2, max: 1, step: 0.05, def: 0.7 }, { k: 'jit', label: 'Band offset (0 = aligned)', min: 0, max: 1, step: 0.05, def: 0.55 }, { k: 'inv', label: 'Invert (fade direction)', min: 0, max: 1, def: 0 }, COL],
  render(w, h, c, p) {
    const R = Math.round(p.rows), hh = h / R, N = Math.round(p.lines), pitch = w / N, dx = hh * p.slant, extra = Math.ceil(dx / pitch) + 1, rnd = mulberry32(1000 + c.seed);
    let d = '';
    for (const j of range(0, R - 1)) {
      const sh = rnd() * p.jit, y0 = j * hh, y1 = y0 + hh;
      for (const i of range(-extra, N + extra)) {
        const x = i * pitch;
        let g = 0.5 - 0.5 * Math.cos(TAU * (x / w + sh)); if (p.inv > 0) g = 1 - g;
        const t = pitch * p.thick * Math.pow(g, 1.1);
        if (t < 0.5) continue;
        d += `M${f(x)},${f(y1)}h${f(t)}l${f(dx)},${f(-hh)}h${f(-t)}Z`;
      }
    }
    return `<path d="${d}" fill="${ink(c, p)}"/>`;
  },
};
