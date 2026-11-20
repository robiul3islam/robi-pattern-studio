import type { Instance, LayoutSettings, PatternLayout } from '../../types';
import { CATEGORY_CONFIG } from '../../data/categoryConfig';
import { ELEMENTS_BY_ID } from '../../data/elements';
import { mulberry32, shuffle } from '../../utils/rng';

const wrap = (v: number, m: number) => ((v % m) + m) % m;
export function periodicDist(ax: number, ay: number, bx: number, by: number, w: number, h: number) {
  let dx = Math.abs(ax - bx); dx = Math.min(dx, w - dx);
  let dy = Math.abs(ay - by); dy = Math.min(dy, h - dy);
  return Math.hypot(dx, dy);
}

export function generateLayout(s: LayoutSettings): PatternLayout {
  const cfg = CATEGORY_CONFIG[s.categoryId];
  if (!cfg) throw new Error(`Unknown category: ${s.categoryId}`);
  for (const id of cfg.elements) if (!ELEMENTS_BY_ID[id]) throw new Error(`Missing element: ${id}`);
  const { w, h } = s;
  const rnd = mulberry32(s.seed);
  let bag: string[] = [];
  let last = '';
  const nextEl = () => {
    if (!bag.length) { bag = shuffle(cfg.elements, rnd); if (bag.length > 1 && bag[bag.length - 1] === last) bag.reverse(); }
    last = bag.pop()!;
    return last;
  };
  const dens = 0.4 + (s.density / 100) * 1.2;
  const modeF = s.mode === 'dense' ? 1.6 : s.mode === 'minimal' ? 0.5 : 1;
  const N = Math.max(2, Math.round(s.count * dens * modeF));
  const sizeEff = s.size * (s.mode === 'dense' ? 0.8 : s.mode === 'minimal' ? 1.2 : 1);
  const rv = s.randomness / 100;
  const instances: Instance[] = [];

  const add = (x: number, y: number, r: number, flip: boolean, el?: string) => {
    const c = shuffle([0, 1, 2, 3], rnd).slice(0, 3) as [number, number, number];
    instances.push({
      n: instances.length, el: el ?? nextEl(), x: wrap(x, w), y: wrap(y, h),
      s: +((sizeEff / 100) * (1 + (rnd() - 0.5) * rv * 1.2)).toFixed(3), r: +r.toFixed(1), flip, c,
    });
  };

  const gridLike = ['grid', 'structured', 'mirror', 'halfdrop', 'brick'].includes(s.mode);
  if (gridLike) {
    let cols = Math.max(2, Math.round(Math.sqrt((N * w) / h)));
    let rows = Math.max(2, Math.round(N / cols));
    if (s.mode === 'brick' || s.mode === 'mirror') { if (rows % 2) rows++; }
    if (s.mode === 'halfdrop' || s.mode === 'mirror') { if (cols % 2) cols++; }
    const cw = w / cols, ch = h / rows;
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
      let x = (c + 0.5) * cw, y = (r + 0.5) * ch;
      if (s.mode === 'brick' && r % 2) x += cw / 2;
      if (s.mode === 'halfdrop' && c % 2) y += ch / 2;
      x += (rnd() - 0.5) * cw * rv * 0.5; y += (rnd() - 0.5) * ch * rv * 0.5;
      let rot = (rnd() - 0.5) * 2 * s.rotation;
      let flip = false;
      if (s.mode === 'structured') rot = ((r + c) % 2) * s.rotation;
      if (s.mode === 'mirror') { flip = c % 2 === 1; if (flip) rot = -rot; }
      add(x, y, rot, flip);
    }
  } else {
    const spacingF = s.mode === 'dense' ? 0.7 : s.mode === 'minimal' ? 1.2 : 1;
    const dmin = s.spacing * sizeEff * 0.8 * spacingF;
    let attempts = N * 80;
    while (instances.length < N && attempts-- > 0) {
      const x = rnd() * w, y = rnd() * h;
      const pts: Array<{ x: number; y: number; mx: boolean; my: boolean }> = [{ x, y, mx: false, my: false }];
      if (s.symmetry === 'horizontal' || s.symmetry === 'both') pts.push({ x: w - x, y, mx: true, my: false });
      if (s.symmetry === 'vertical' || s.symmetry === 'both') pts.push({ x, y: h - y, mx: false, my: true });
      if (s.symmetry === 'both') pts.push({ x: w - x, y: h - y, mx: true, my: true });
      const ok = pts.every((p, i) =>
        instances.every(o => periodicDist(p.x, p.y, o.x, o.y, w, h) >= dmin) &&
        pts.every((q, j) => j <= i || periodicDist(p.x, p.y, q.x, q.y, w, h) >= dmin));
      if (!ok) continue;
      let base = (rnd() - 0.5) * 2 * s.rotation;
      if (s.mode === 'organic') base = 0.5 * s.rotation * (Math.sin((2 * Math.PI * 2 * x) / w) + Math.cos((2 * Math.PI * y) / h)) + (rnd() - 0.5) * 30;
      const el = nextEl();
      for (const p of pts) {
        let r = base, flip = false;
        if (p.mx && !p.my) { flip = true; r = -base; }
        else if (!p.mx && p.my) { flip = true; r = 180 - base; }
        else if (p.mx && p.my) { r = base + 180; }
        add(p.x, p.y, r, flip, el);
      }
    }
  }
  return { settings: s, instances, w, h };
}
