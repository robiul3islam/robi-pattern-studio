import type { Instance, LayoutSettings, PatternLayout } from '../../types';
import { CATEGORY_CONFIG } from '../../data/categoryConfig';
import { ELEMENTS_BY_ID } from '../../data/elements';
import { mulberry32, shuffle } from '../../utils/rng';
import { groupBounds } from '../geometry/bounds';

const wrap = (v: number, m: number) => ((v % m) + m) % m;
export function periodicDist(ax: number, ay: number, bx: number, by: number, w: number, h: number) {
  let dx = Math.abs(ax - bx); dx = Math.min(dx, w - dx);
  let dy = Math.abs(ay - by); dy = Math.min(dy, h - dy);
  return Math.hypot(dx, dy);
}

export function generateLayout(s: LayoutSettings): PatternLayout {
  const cfg = CATEGORY_CONFIG[s.categoryId];
  if (!cfg) throw new Error(`Unknown category: ${s.categoryId}`);
  const pool = s.elements?.length ? s.elements : cfg.elements;
  for (const id of pool) if (!ELEMENTS_BY_ID[id]) throw new Error(`Missing element: ${id}`);
  const { w, h } = s;
  const rnd = mulberry32(s.seed);
  if (s.elementSpec && pool.some(id => s.elementSpec![id])) return { settings: s, instances: composed(s, pool, rnd), w, h };
  let bag: string[] = [];
  let last = '';
  const nextEl = () => {
    if (!bag.length) { bag = shuffle(pool, rnd); if (bag.length > 1 && bag[bag.length - 1] === last) bag.reverse(); }
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

/** Designer-style layout: big "hero" motifs on a half-drop/brick lattice, then small fillers in the gaps. */
function composed(s: LayoutSettings, pool: string[], rnd: () => number): Instance[] {
  const { w, h } = s, rv = s.randomness / 100;
  const spec = s.elementSpec ?? {};
  const kinds = pool.map(id => {
    const sp = spec[id] ?? { size: 5, weight: 2 };
    const b1 = groupBounds(id, 'scale(1)');
    const unit = Math.max(b1.maxX - b1.minX, b1.maxY - b1.minY, 1);
    const sc = ((sp.size / 100) * w) / unit;
    const b = groupBounds(id, `scale(${sc})`);
    return { id, sc, bw: b.maxX - b.minX, bh: b.maxY - b.minY, weight: Math.max(1, Math.round(sp.weight)), size: sp.size };
  });
  type Kind = (typeof kinds)[number];
  let heroes = kinds.filter(k => k.size >= 12);
  if (!heroes.length) heroes = [kinds.reduce((a, b) => (b.size > a.size ? b : a))];
  const fillers = kinds.filter(k => !heroes.includes(k));
  const bag = (list: Kind[]) => { let b: Kind[] = []; return () => { if (!b.length) b = shuffle(list.flatMap(k => Array<Kind>(k.weight).fill(k)), rnd); return b.pop()!; }; };
  const tilt = s.rotation > 20;
  const box = (k: Kind) => (tilt ? { w: Math.max(k.bw, k.bh), h: Math.max(k.bw, k.bh) } : { w: k.bw, h: k.bh });
  const placed: { x: number; y: number; w: number; h: number; hero: boolean }[] = [];
  const out: Instance[] = [], heroOut: Instance[] = [];
  const mk = (k: Kind, x: number, y: number, hero: boolean): Instance => ({
    n: 0, el: k.id, x: wrap(x, w), y: wrap(y, h), s: +(k.sc * (1 + (rnd() - 0.5) * rv * 0.3)).toFixed(3),
    r: +((rnd() - 0.5) * 2 * s.rotation).toFixed(1), flip: false, c: hero ? [0, 1, 2] : (shuffle([0, 1, 2, 3], rnd).slice(0, 3) as [number, number, number]),
  });

  // 1. hero lattice
  const avgW = heroes.reduce((a, k) => a + box(k).w, 0) / heroes.length, avgH = heroes.reduce((a, k) => a + box(k).h, 0) / heroes.length;
  const mode = ['brick', 'halfdrop', 'grid'].includes(s.mode) ? s.mode : 'halfdrop';
  const cellW = avgW * (1 + 0.35 * s.spacing), cellH = Math.max(avgH, avgW * 0.75) * (1 + 0.35 * s.spacing);
  const near = (ideal: number, even: boolean) => Math.max(2, even ? Math.round(ideal / 2) * 2 : Math.round(ideal));
  const cols = near(w / cellW, mode === 'halfdrop'), rows = near(h / cellH, mode === 'brick');
  const cw = w / cols, ch = h / rows, nextHero = bag(heroes);
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
    let x = (c + 0.5) * cw, y = (r + 0.5) * ch;
    if (mode === 'brick' && r % 2) x += cw / 2;
    if (mode === 'halfdrop' && c % 2) y += ch / 2;
    x += (rnd() - 0.5) * cw * rv * 0.3; y += (rnd() - 0.5) * ch * rv * 0.3;
    const k = nextHero();
    heroOut.push(mk(k, x, y, true)); placed.push({ x: wrap(x, w), y: wrap(y, h), ...box(k), hero: true });
  }

  // 2. fillers: best-candidate sampling in the gaps (periodic, so the tile stays seamless)
  if (fillers.length) {
    const nextFill = bag(fillers);
    const target = Math.min(120, Math.round(heroOut.length * (0.8 + s.density / 40)));
    let fails = 0;
    while (out.length < target && fails < 40) {
      const k = nextFill(), bx = box(k);
      let best: { x: number; y: number; gap: number } | null = null;
      for (let t = 0; t < 70; t++) {
        const x = rnd() * w, y = rnd() * h;
        let gap = Infinity;
        for (const o of placed) {
          let dx = Math.abs(x - o.x); dx = Math.min(dx, w - dx);
          let dy = Math.abs(y - o.y); dy = Math.min(dy, h - dy);
          const g = Math.max(dx - (o.w + bx.w) / 2, dy - (o.h + bx.h) / 2) + (o.hero ? 0.1 * Math.min(bx.w, bx.h) : 0);
          if (g < gap) gap = g;
        }
        if (!best || gap > best.gap) best = { x, y, gap };
      }
      if (!best || best.gap < 0.02 * w) { fails++; continue; }
      fails = 0; out.push(mk(k, best.x, best.y, false)); placed.push({ x: best.x, y: best.y, ...bx, hero: false });
    }
  }
  // fillers first, heroes on top
  return [...out, ...heroOut].map((i, n) => ({ ...i, n }));
}
