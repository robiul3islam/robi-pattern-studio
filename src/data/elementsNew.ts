import type { Part, Role } from '../types';

const f = (n: number) => +n.toFixed(1);
const circ = (r: number, cx = 0, cy = 0) => `M${f(cx - r)},${f(cy)}a${r},${r} 0 1,0 ${2 * r},0a${r},${r} 0 1,0 ${-2 * r},0Z`;
const poly = (n: number, r: number, rot = -90) =>
  Array.from({ length: n }, (_, i) => { const a = ((rot + (360 / n) * i) * Math.PI) / 180; return `${i ? 'L' : 'M'}${f(r * Math.cos(a))},${f(r * Math.sin(a))}`; }).join('') + 'Z';
const star = (n: number, ro: number, ri: number) =>
  Array.from({ length: n * 2 }, (_, i) => { const a = ((-90 + (180 / n) * i) * Math.PI) / 180; const r = i % 2 ? ri : ro; return `${i ? 'L' : 'M'}${f(r * Math.cos(a))},${f(r * Math.sin(a))}`; }).join('') + 'Z';
const ring = (n: number) => Array.from({ length: n }, (_, i) => (360 / n) * i);
const P = (d: string, role: Role = 'primary', extra: Partial<Part> = {}): Part => ({ d, role, ...extra });
const LN = (d: string, w = 1, extra: Partial<Part> = {}): Part => P(d, 'line', { w, ...extra });
const mirror = (d: string, role: Role = 'primary', extra: Partial<Part> = {}): Part[] => [P(d, role, extra), P(d, role, { ...extra, transform: 'scale(-1 1)' })];
const rotP = (d: string, role: Role, angles: number[], extra: Partial<Part> = {}): Part[] => angles.map(a => P(d, role, { ...extra, transform: `rotate(${a})` }));
const rotL = (d: string, angles: number[], w = 1, extra: Partial<Part> = {}): Part[] => angles.map(a => LN(d, w, { ...extra, transform: `rotate(${a})` }));
const dots = (pts: number[][], r: number) => pts.map(([x, y]) => circ(r, x, y)).join('');
/** closed wobbly ring: radius r with k lobes of amplitude a */
const wob = (r: number, k: number, a: number, ph = 0) =>
  Array.from({ length: 64 }, (_, i) => { const t = (i / 64) * Math.PI * 2, rr = r + a * Math.sin(k * t + ph); return `${i ? 'L' : 'M'}${f(rr * Math.cos(t))},${f(rr * Math.sin(t))}`; }).join('') + 'Z';

/** serrated holly leaf along the y axis, length 100 */
function holly(): string {
  const N = 9, right: string[] = [], left: string[] = [];
  for (let i = 0; i <= N * 2; i++) {
    const t = i / (N * 2), y = -50 + 100 * t, w = Math.sin(Math.PI * Math.pow(t, 0.85)) * 22 + (i % 2 ? 9 : 0) * Math.sin(Math.PI * t);
    right.push(`${f(w)},${f(y)}`); left.push(`${f(-w)},${f(y)}`);
  }
  return `M${right.join('L')}L${left.reverse().join('L')}Z`;
}
const HOLLY_VEINS = [-34, -20, -6, 8, 22].flatMap(y => [`M0,${y + 10}L18,${y - 2}`, `M0,${y + 10}L-18,${y - 2}`]).join('');

const pine = (tiers: number, w: number) => {
  let d = 'M0,-50', y = -50; const hStep = 78 / tiers;
  const right: string[] = [], left: string[] = [];
  for (let i = 0; i < tiers; i++) {
    const ww = w * (0.4 + (0.6 * (i + 1)) / tiers), y1 = y + hStep;
    right.push(`L${f(ww * 0.5)},${f(y + hStep * 0.55)}L${f(ww * 0.28)},${f(y + hStep * 0.55)}L${f(ww)},${f(y1 + 4)}`); left.push(`L${f(-ww)},${f(y1 + 4)}L${f(-ww * 0.28)},${f(y + hStep * 0.55)}L${f(-ww * 0.5)},${f(y + hStep * 0.55)}`);
    y = y1;
  }
  d += right.join('') + `L5,${f(y + 4)}V46H-5V${f(y + 4)}` + left.reverse().join('') + 'Z';
  return d;
};

const GOAT_HORN = 'M2,-8C-6,-34 -26,-52 -46,-44C-34,-44 -26,-38 -22,-26C-18,-14 -10,-4 2,-8Z';
const GOAT_HORN2 = 'M8,-8C6,-30 -4,-48 -18,-52C-10,-44 -6,-34 -6,-22C-6,-12 -2,-4 8,-8Z';

const RAW: Array<[string, string, Part[]]> = [
  // ---- damask
  ['dm-acanthus', 'Damask Acanthus', [
    P('M0,-50C8,-42 10,-32 0,-22C-10,-32 -8,-42 0,-50Z'),
    P('M0,-18C12,-8 12,6 0,16C-12,6 -12,-8 0,-18Z', 'secondary'),
    P('M0,50C-5,40 -11,34 -23,31C-12,27 -5,21 0,12C5,21 12,27 23,31C11,34 5,40 0,50Z'),
    ...mirror('M3,-8C12,-32 36,-40 46,-26C50,-14 40,-6 32,-12C28,-16 30,-22 36,-22C32,-28 20,-24 16,-12C12,-2 20,10 32,8C26,20 8,20 3,6Z'),
    ...mirror('M4,22C14,16 28,20 36,30C26,28 18,32 12,42C8,34 6,28 4,22Z', 'secondary'),
    P(dots([[-40, -36], [40, -36], [-30, -42], [30, -42], [-46, -14], [46, -14], [-22, 14], [22, 14]], 2), 'secondary'),
  ]],
  ['dm-leafpair', 'Damask Leaf Pair', [
    ...mirror('M2,0C14,-16 32,-18 44,-6C34,-2 22,4 2,0Z'),
    ...mirror('M2,2C14,14 30,16 40,8C32,6 20,2 2,2Z', 'secondary'),
    P('M0,-14C5,-8 5,-2 0,4C-5,-2 -5,-8 0,-14Z', 'accent'),
  ]],
  ['dm-bud', 'Damask Bud', [P('M0,-30C12,-16 12,-4 0,8C-12,-4 -12,-16 0,-30Z'), ...mirror('M2,10C12,4 24,6 30,16C20,14 12,18 6,28Z', 'secondary'), P(circ(3, 0, 20), 'accent')]],

  // ---- abstract shape set
  ['bs-dotdisc', 'Dotted Disc', [
    ...[[44, 28], [32, 20], [20, 12], [8, 5]].map(([r, n]) => P(dots(Array.from({ length: n }, (_, i) => [r * Math.cos((i / n) * Math.PI * 2), r * Math.sin((i / n) * Math.PI * 2)]), r > 30 ? 3 : r > 16 ? 2.8 : 2.4))),
    P(circ(2.5)),
  ]],
  ['bs-rings', 'Concentric Rings', [...[44, 35, 26, 17].map(r => LN(circ(r), 1.4)), P(circ(7))]],
  ['bs-stripedisc', 'Striped Disc', [-36, -26, -16, -6, 4, 14, 24, 34].map(y => { const hw = Math.sqrt(44 * 44 - (y + 3) * (y + 3)); return LN(`M${f(-hw)},${y}H${f(hw)}`, 2.2); })],
  ['bs-dotgrid', 'Dot Grid', [P(dots([-36, -18, 0, 18, 36].flatMap(x => [-36, -18, 0, 18, 36].map(y => [x, y])), 4.2))]],
  ['bs-zigzag', 'Zigzag Bars', [-24, 0, 24].map(y => LN(`M-46,${y}l12,-12l12,24l12,-24l12,24l12,-24l12,24l12,-12`, 1.6))],
  ['bs-crescent', 'Crescent Set', [LN('M-20,-44A44,44 0 0,1 -20,44', 1.8), LN('M-6,-36A36,36 0 0,1 -6,36', 1.8), LN('M8,-28A28,28 0 0,1 8,28', 1.8), LN('M22,-20A20,20 0 0,1 22,20', 1.8)]],
  ['bs-plus', 'Plus Row', [P('M-44,-6H-26V-24H-18V-6H0V2H-18V20H-26V2H-44Z'), P('M2,-6H20V-24H28V-6H46V2H28V20H20V2H2Z', 'secondary')].map((p, i) => (i ? { ...p, transform: 'translate(-1 0)' } : p))],
  ['bs-grid', 'Grid Square', [LN('M-40,-40H40V40H-40Z', 1.4), ...[-20, 0, 20].flatMap(v => [LN(`M${v},-40V40`, 1), LN(`M-40,${v}H40`, 1)])]],
  ['bs-contour', 'Contour Waves', [[44, 5, 0], [35, 5, 0.6], [26, 4, 1.1], [17, 3, 1.6], [8, 2, 2]].map(([r, a, ph]) => LN(wob(r, 6, a, ph), 1.1))],
  ['bs-quarter', 'Quarter Disc', [P('M-40,40L-40,-40A80,80 0 0,1 40,40Z'), P('M-40,40L-40,0A40,40 0 0,1 0,40Z', 'secondary')]],
  ['bs-halftone', 'Halftone Fade', [P([0, 1, 2, 3, 4, 5].flatMap(c => [0, 1, 2, 3, 4, 5].map(r => { const s = Math.max(0, 14 - c * 2.6 - (r % 2) * 0.6), x = -42 + c * 16, y = -42 + r * 16; return s > 1 ? `M${f(x - s / 2 + 7)},${f(y - s / 2 + 7)}h${f(s)}v${f(s)}h${f(-s)}Z` : ''; })).join(''))]],
  ['bs-semis', 'Half Circles', [P('M-44,0A22,22 0 0,1 0,0Z'), P('M0,0A22,22 0 0,0 44,0Z', 'secondary'), P('M-44,6A22,22 0 0,0 0,6Z', 'secondary'), P('M0,6A22,22 0 0,1 44,6Z')]],
  ['bs-chevrons', 'Chevrons', [-24, -4, 16].map(y => LN(`M-40,${y}L0,${y + 22}L40,${y}`, 1.8))],
  ['bs-sqrings', 'Square Rings', [40, 30, 20, 10].map(r => LN(`M${-r},${-r}H${r}V${r}H${-r}Z`, 1.3))],

  // ---- christmas
  ['xm-holly', 'Holly Leaf', [P(holly(), 'primary', { fill: '$0' }), LN('M0,-44V46', 1.2, { stroke: '$1' }), LN(HOLLY_VEINS, 1, { stroke: '$1' })]],
  ['xm-berries', 'Holly Berries', [P(dots([[-10, 4], [10, 4], [0, -13]], 9), 'accent', { fill: '$2' }), P(dots([[-13, 1], [7, 1], [-3, -16]], 2.6), 'secondary', { fill: '$1' })]],
  ['xm-snow', 'Snowflake', [...rotL('M0,0V-40M0,-14L-8,-22M0,-14L8,-22M0,-26L-7,-33M0,-26L7,-33', ring(6), 1.2, { stroke: '$1' }), P(circ(3.2), 'accent', { fill: '$1' })]],
  ['xm-snow2', 'Snowflake Sage', [...rotL('M0,0V-40M0,-14L-8,-22M0,-14L8,-22M0,-26L-7,-33M0,-26L7,-33', ring(6), 1.2, { stroke: '$0' }), P(circ(3.2), 'accent', { fill: '$0' })]],
  ['xm-dot', 'Snow Dot', [P(circ(3.2), 'primary', { fill: '$2' })]],
  ['xm-pine', 'Sketch Pine', [P(pine(4, 30), 'primary', { fill: '$0' }), LN('M-10,-20L-4,-14M10,-4L16,2M-20,10L-12,16M4,16L12,22', 0.8, { stroke: '$4' })]],
  ['xm-pine2', 'Sketch Pine Slim', [P(pine(5, 22), 'primary', { fill: '$1' })]],
  ['xm-sprig', 'Gold Sprig', [LN('M0,46V-46', 1.1), ...[-34, -22, -10, 2, 14, 26].flatMap(y => [LN(`M0,${y + 8}L-14,${y - 4}`, 1), LN(`M0,${y + 8}L14,${y - 4}`, 1)]), LN('M0,-46L0,-50', 1)]],
  ['xm-hollyline', 'Gold Holly Line', [LN(holly(), 1.1, { transform: 'rotate(-30) scale(0.8)' }), LN(holly(), 1.1, { transform: 'rotate(30) scale(0.8)' }), LN(circ(6, -4, 10) + circ(6, 8, 6) + circ(6, 0, -2), 1.1)]],
  ['xm-snowline', 'Gold Snowflake Line', [...rotL('M0,0V-44M0,-16L-9,-25M0,-16L9,-25M0,-30L-7,-37M0,-30L7,-37', ring(6), 1), LN(circ(4), 1)]],
  ['xm-starline', 'Gold Star Line', [LN(star(4, 40, 8), 1.2), LN(star(4, 20, 4), 1, { transform: 'rotate(45)' }), LN(circ(2), 1)]],
  ['xm-berrysprig', 'Gold Berry Sprig', [LN('M0,46Q-6,10 0,-30', 1.1), ...[[-6, 20], [-8, 4], [-4, -12]].map(([x, y]) => LN(`M${x},${y}L${x - 14},${y - 10}`, 1)), ...[[-6, 22], [6, 10], [4, -6], [0, -30]].map(([x, y]) => LN(circ(6, x + (y < 0 ? 0 : 8), y), 1))]],

  // ---- chinese new year
  ['cny-goat', 'Geometric Goat', [
    P('M3,-12C-1,-34 -12,-50 -36,-50C-24,-42 -20,-28 -14,-8Z', 'secondary'),
    P('M12,-14C10,-32 2,-46 -14,-52C-8,-42 -4,-30 -2,-12Z', 'secondary', { transform: 'translate(6 2)' }),
    P('M-14,-6C-4,-16 10,-16 24,-4C34,4 44,10 44,18C44,26 38,30 30,30C20,30 12,28 4,32L-6,46L-26,46C-26,30 -24,10 -14,-6Z', 'primary'),
    P('M-8,0L-36,-6L-14,14Z', 'secondary'),
    P('M8,-13C22,-11 38,3 44,16L30,12C20,6 12,-4 8,-13Z', 'secondary'),
    P(circ(3, 16, 0), 'accent', { fill: '$3' }), P(circ(2, 39, 17), 'accent', { fill: '$3' }),
    P('M24,30L30,50L14,32Z', 'primary'),
  ]],
  ['cny-lantern', 'Red Lantern', [
    LN('M0,-48V-38', 1.2), P('M-12,-38H12V-32H-12Z', 'primary'), P('M-12,34H12V40H-12Z', 'primary'),
    P('M-12,-32C-36,-26 -36,26 -12,34H12C36,26 36,-26 12,-32Z', 'secondary', { fill: '$3' }),
    LN('M0,-32V34M-14,-31C-26,-14 -26,18 -14,33M14,-31C26,-14 26,18 14,33', 1, { stroke: '$0' }),
    LN('M0,40V50M-4,40L-5,50M4,40L5,50', 1, { stroke: '$0' }),
  ]],
  ['cny-coin', 'Ancient Coin', [P(circ(42), 'primary'), LN(circ(36), 0.8, { stroke: '$3' }), P('M-11,-11H11V11H-11Z', 'accent', { fill: '$3' }), LN('M0,-36V-11M0,11V36M-36,0H-11M11,0H36', 0.7, { stroke: '$3' })]],
  ['cny-cloud', 'Auspicious Cloud', [LN('M-42,22H34C50,22 50,0 34,0C36,-18 12,-22 6,-8C-2,-18 -24,-10 -18,6C-34,4 -46,14 -42,22Z', 1.4), LN('M-4,6C-12,6 -12,-4 -4,-4C2,-4 4,2 0,4', 1.2), LN('M24,2C18,2 18,-6 24,-6C28,-6 30,-2 28,0', 1.2)]],
  ['cny-blossom', 'Plum Blossom', [P(dots(ring(5).map(a => [20 * Math.cos(((a - 90) * Math.PI) / 180), 20 * Math.sin(((a - 90) * Math.PI) / 180)]), 15), 'primary'), P(circ(6), 'accent', { fill: '$3' }), ...rotL('M0,0V-12', ring(5), 0.7, { stroke: '$0' }), P(dots(ring(5).map(a => [12 * Math.cos(((a - 90) * Math.PI) / 180), 12 * Math.sin(((a - 90) * Math.PI) / 180)]), 1.6), 'secondary', { fill: '$1' })]],
  ['cny-knot', 'Chinese Knot', [LN('M0,-48V-26', 1.4), LN('M0,-26L14,-12L0,2L-14,-12Z', 1.8), LN('M0,-14L14,0L0,14L-14,0Z', 1.8), LN('M-6,-8L6,-8M-6,6L6,6', 1.2), P('M-5,16H5L7,24H-7Z', 'primary'), LN('M-5,24V46M-2,24V46M2,24V46M5,24V46', 1, { stroke: '$0' })]],
  ['cny-yang', 'Yang Character', [LN('M-14,-42L-7,-31', 3.4), LN('M14,-42L7,-31', 3.4), LN('M-24,-26H24', 3.2), LN('M-30,-10H30', 3.2), LN('M-20,6H20', 3.2), LN('M-34,22H34', 3.2), LN('M0,-30V48', 3.2)]],

  // ---- geometric holiday mosaic
  ['gh-tree', 'Geo Tree', [P('M0,-44L22,-14H-22Z', 'primary', { fill: '$1' }), P('M0,-26L30,8H-30Z', 'primary', { fill: '$1' }), P('M0,-6L38,32H-38Z', 'primary', { fill: '$1' }), P('M-5,32H5V44H-5Z', 'primary', { fill: '$0' })]],
  ['gh-bullseye', 'Bullseye', [P(circ(40), 'primary', { fill: '$0' }), P(circ(30), 'primary', { fill: '$4' }), P(circ(20), 'primary', { fill: '$0' }), P(circ(10), 'primary', { fill: '$3' })]],
  ['gh-asterisk', 'Spoke Star', [...rotP('M-4.5,-40H4.5V0H-4.5Z', 'primary', [0, 45, 90, 135, 180, 225, 270, 315], { fill: '$2' }), P(circ(6), 'primary', { fill: '$0' })]],
  ['gh-halfpair', 'Half Circle Pair', [P('M-40,2A40,40 0 0,0 40,2Z', 'primary', { fill: '$3' }), P('M-40,-2A40,40 0 0,1 40,-2Z', 'primary', { fill: '$0' })]],
  ['gh-quarter', 'Geo Quarter', [P('M-40,40L-40,-40A80,80 0 0,1 40,40Z', 'primary', { fill: '$1' }), P('M-40,40L-40,0A40,40 0 0,1 0,40Z', 'primary', { fill: '$3' })]],
  ['gh-clover', 'Geo Clover', [P(dots([[-19, 0], [19, 0], [0, -19], [0, 19]], 19), 'primary', { fill: '$1' }), P(star(4, 14, 4), 'primary', { fill: '$4' })]],
  ['gh-sqstar', 'Star Tile', [P('M-40,-40H40V40H-40Z', 'primary', { fill: '$2' }), P(star(4, 28, 7), 'primary', { fill: '$4' })]],
  ['gh-bowtie', 'Bow Tie', [P('M-42,-26L0,0L-42,26Z', 'primary', { fill: '$0' }), P('M42,-26L0,0L42,26Z', 'primary', { fill: '$0' }), P(circ(7), 'primary', { fill: '$3' })]],
  ['gh-flower', 'Geo Flower', [P(dots(ring(8).map(a => [24 * Math.cos((a * Math.PI) / 180), 24 * Math.sin((a * Math.PI) / 180)]), 11), 'primary', { fill: '$0' }), P(circ(12), 'primary', { fill: '$3' })]],
];


/** Single-colour families keep their palette slot on every instance (damask stays silver, CNY stays gold). */
const TINT: Record<string, Partial<Record<Role, string>>> = { 'dm-': { primary: '$0', secondary: '$1', accent: '$2' }, 'cny-': { primary: '$0', secondary: '$1', accent: '$2' } };
export const NEW: Array<[string, string, Part[]]> = RAW.map(([id, name, parts]) => {
  const t = Object.entries(TINT).find(([k]) => id.startsWith(k))?.[1];
  return [id, name, t ? parts.map(p => (p.role !== 'line' && !p.fill ? { ...p, fill: t[p.role] } : p)) : parts];
});
void poly;
