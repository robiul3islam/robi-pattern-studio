import type { ProcCtx, ProcDef } from './types';
import { f, range } from './util';

/** Pixel rows are 16 columns wide or any width that divides 16, so every band repeats exactly across the tile. */
const U = 16;
const wide = (rows: string[]) => rows.map(r => { if (U % r.length) throw new Error(`Band width ${r.length} does not divide ${U}`); return r.repeat(U / r.length); });
const blank = (n: number) => Array<string>(n).fill('.'.repeat(U));
/** Pad a motif to the band height with a blank row above and below. */
const pad = (rows: string[], top = 1, bot = 1) => [...blank(top), ...wide(rows), ...blank(bot)];

const ZIG = ['....#...', '...#.#..', '..#...#.', '.#.....#', '#.......'];
const SNOW = ['#..#..#.', '.#.#.#..', '..###...', '#######.', '..###...', '.#.#.#..', '#..#..#.'];
const TREE = ['...#....', '..###...', '.#####..', '..###...', '.#####..', '#######.', '...#....', '...#....'];
const HEART = ['.##.##..', '#######.', '#######.', '.#####..', '..###...', '...#....'];
const DIAM = ['...#....', '..###...', '.#####..', '#######.', '.#####..', '..###...', '...#....'];
const DOTS = ['#...', '..#.', '#...', '..#.'];
const STAR = ['...#....', '#..#..#.', '.#.#.#..', '..###...', '#######.', '..###...', '.#.#.#..', '#..#..#.', '...#....'];
const ARROW = ['#.#.', '.#..', '#.#.', '....'];
const DEER = [
  '..........#.#.#.', '...........###..', '..........#####.', '..........####..',
  '...#########.##.', '.###########....', '.###########....', '.###########....',
  '..#.#.....#.#...', '..#.#.....#.#...', '..#.#.....#.#...',
];
const FRIEZE = ['#.', '.#'];
const LINE = ['########'];

type Ref = number | 'b';
interface Band { rows: string[]; fg: Ref; bg: Ref }
const B = (rows: string[], fg: Ref, bg: Ref = 'b'): Band => ({ rows, fg, bg });

const SETS: Record<string, Band[]> = {
  /** Nordic reindeer sweater: light motif (slot 1), accent (slot 2), base colour = tile background. */
  'fair-reindeer': [
    B(pad(SNOW), 0), B(wide(LINE), 1), B(pad(ZIG, 0, 0), 1), B(pad(DEER, 1, 1), 0), B(pad(ZIG, 0, 0), 1), B(wide(LINE), 1), B(pad(TREE), 0), B(pad(HEART, 1, 1), 1),
  ],
  /** Ugly Christmas sweater: green block / cream band / red block. */
  'fair-sweater': [
    B(pad(ARROW, 1, 1), 3, 0), B(pad(DOTS, 1, 1), 3, 0), B(pad(ZIG, 0, 0), 0, 'b'), B(pad(ZIG, 0, 0), 1, 'b'), B(blank(5), 0, 'b'), B(pad(ZIG, 0, 0), 1, 'b'), B(pad(ZIG, 0, 0), 0, 'b'), B(pad(DOTS, 1, 1), 3, 1), B(pad(HEART, 1, 1), 3, 1), B(pad(DOTS, 1, 1), 3, 1),
  ],
  /** All-over snowflake / diamond / star lattice. */
  'fair-allover': [
    B(pad(STAR, 1, 1), 0), B(pad(DIAM, 1, 1), 1), B(pad(SNOW, 1, 1), 0), B(pad(DIAM, 1, 1), 1),
  ],
};

export const makeKnit = (id: string, name: string): ProcDef => ({
  id, name,
  params: [
    { k: 'rep', label: 'Repeats across (1 = big pixels)', min: 1, max: 6, def: 3 },
    { k: 'stitch', label: 'Knit stitch texture', min: 0, max: 1, def: 1 },
    { k: 'tone', label: 'Stitch shading %', min: 5, max: 50, def: 22 },
  ],
  render(w, h, c: ProcCtx, p) {
    const bands = SETS[id], col = (r: Ref) => (r === 'b' ? c.bg : c.colors[r % c.colors.length]);
    const cols = U * Math.round(p.rep), cs = w / cols, Hs = bands.reduce((a, b) => a + b.rows.length, 0);
    const kv = Math.max(1, Math.round(h / (cs * Hs))), rows = Hs * kv, ch = h / rows;
    let svg = '', y = 0, stitches = '';
    const reps = Math.round(p.rep);
    for (let v = 0; v < kv; v++) for (const b of bands) {
      const bh = b.rows.length * ch;
      svg += `<rect x="0" y="${f(y)}" width="${w}" height="${f(bh + 0.4)}" fill="${col(b.bg)}"/>`;
      let d = '';
      b.rows.forEach((row, r) => {
        const full = row.repeat(reps);
        for (let x = 0; x < cols;) {
          if (full[x] !== '#') { x++; continue; }
          let e = x; while (e < cols && full[e] === '#') e++;
          d += `M${f(x * cs)},${f(y + r * ch)}h${f((e - x) * cs + 0.3)}v${f(ch + 0.3)}h${f(-(e - x) * cs - 0.3)}Z`;
          x = e;
        }
      });
      if (d) svg += `<path d="${d}" fill="${col(b.fg)}"/>`;
      y += bh;
    }
    if (p.stitch > 0 && cols * rows <= 16000) {
      for (let r = 0; r < rows; r++) for (let x = 0; x < cols; x++) {
        const x0 = x * cs, y0 = r * ch;
        stitches += `M${f(x0 + cs * 0.14)},${f(y0 + ch * 0.18)}L${f(x0 + cs * 0.5)},${f(y0 + ch * 0.86)}L${f(x0 + cs * 0.86)},${f(y0 + ch * 0.18)}`;
      }
      svg += `<path d="${stitches}" fill="none" stroke="#000" stroke-opacity="${f(p.tone / 100 * 0.6)}" stroke-width="${f(Math.min(cs, ch) * 0.13)}" stroke-linecap="round" stroke-linejoin="round"/>`;
      svg += `<path d="${stitches}" fill="none" stroke="#fff" stroke-opacity="${f(p.tone / 100 * 0.35)}" stroke-width="${f(Math.min(cs, ch) * 0.05)}" stroke-linecap="round" stroke-linejoin="round" transform="translate(${f(cs * 0.04)} ${f(-ch * 0.05)})"/>`;
    }
    void range;
    return svg;
  },
});
