import type { Part, Role, VecElement } from '../types';

const f = (n: number) => +n.toFixed(1);
const circ = (r: number, cx = 0, cy = 0) => `M${cx - r},${cy}a${r},${r} 0 1,0 ${2 * r},0a${r},${r} 0 1,0 ${-2 * r},0Z`;
const poly = (n: number, r: number, rot = -90) =>
  Array.from({ length: n }, (_, i) => { const a = ((rot + (360 / n) * i) * Math.PI) / 180; return `${i ? 'L' : 'M'}${f(r * Math.cos(a))},${f(r * Math.sin(a))}`; }).join('') + 'Z';
const star = (n: number, ro: number, ri: number) =>
  Array.from({ length: n * 2 }, (_, i) => { const a = ((-90 + (180 / n) * i) * Math.PI) / 180; const r = i % 2 ? ri : ro; return `${i ? 'L' : 'M'}${f(r * Math.cos(a))},${f(r * Math.sin(a))}`; }).join('') + 'Z';
const rot = (d: string, role: Role, angles: number[], w?: number): Part[] => angles.map(a => ({ d, role, transform: `rotate(${a})`, w }));
const ring = (n: number, step = 360 / n) => Array.from({ length: n }, (_, i) => i * step);
const P = (d: string, role: Role = 'primary', extra: Partial<Part> = {}): Part => ({ d, role, ...extra });
const mirror = (d: string, role: Role): Part[] => [P(d, role), P(d, role, { transform: 'scale(-1 1)' })];
const LEAF = 'M0,0C10,-10 26,-10 34,0C26,10 10,10 0,0Z';
const SMALL = 'M0,0C8,-8 20,-8 26,0C20,8 8,8 0,0Z';
const HEART = 'M0,40C-50,6 -40,-34 -16,-34C-6,-34 0,-26 0,-20C0,-26 6,-34 16,-34C40,-34 50,6 0,40Z';
const LN = (d: string, w = 1, extra: Partial<Part> = {}): Part => P(d, 'line', { w, ...extra });
const SPIKES = 'M-5,-30L0,-48L5,-30Z';

const list: Array<[string, string, Part[]]> = [
  // botanical
  ['leaf', 'Leaf', [P('M0,-50C32,-28 32,22 0,50C-32,22 -32,-28 0,-50Z'), P('M0,-44V46', 'line')]],
  ['fern', 'Fern', [P('M0,50V-50', 'line'), ...[40, 24, 8, -8, -24].flatMap(y => [P(LEAF, 'primary', { transform: `translate(0 ${y}) rotate(-35)` }), P(LEAF, 'primary', { transform: `translate(0 ${y}) rotate(-145)` })])]],
  ['flower5', 'Five-petal Flower', [...rot('M0,0C-18,-22 -14,-46 0,-48C14,-46 18,-22 0,0Z', 'primary', ring(5)), P(circ(9), 'accent')]],
  ['daisy', 'Daisy', [...rot('M0,0C-6,-20 -6,-40 0,-48C6,-40 6,-20 0,0Z', 'primary', ring(12)), P(circ(10), 'accent')]],
  ['tulip', 'Tulip', [P('M0,30V50', 'line'), P('M-26,-20C-26,10 -10,30 0,30C10,30 26,10 26,-20L12,-4L0,-30L-12,-4Z')]],
  ['bud', 'Bud Sprig', [P('M0,50Q-4,10 0,-20', 'line'), P('M0,-20C-16,-24 -16,-48 0,-50C16,-48 16,-24 0,-20Z'), P(LEAF, 'secondary', { transform: 'translate(0 30) rotate(-40)' })]],
  // tropical
  ['monstera', 'Monstera Leaf', [P('M0,48C-48,30 -52,-20 -20,-40C-8,-48 0,-40 0,-34C0,-40 8,-48 20,-40C52,-20 48,30 0,48Z'), P('M0,44V-30M0,10L-30,0M0,-6L-34,-18M0,10L30,0M0,-6L34,-18', 'line', { w: 1.5 })]],
  ['palm', 'Palm Frond', rot('M0,0C-12,-20 -10,-44 0,-50C10,-44 12,-20 0,0Z', 'primary', [-60, -30, 0, 30, 60])],
  ['hibiscus', 'Hibiscus', [...rot('M0,0C-24,-14 -30,-40 -8,-48C0,-52 10,-48 14,-42C28,-30 20,-12 0,0Z', 'primary', ring(5)), P('M0,0V-30', 'line'), P(circ(4, 0, -30), 'accent')]],
  ['butterfly', 'Butterfly', [...mirror('M0,0C-10,-40 -50,-44 -46,-8C-44,10 -14,10 0,0Z', 'primary'), ...mirror('M0,2C-10,14 -34,18 -30,36C-26,46 -6,30 0,2Z', 'secondary'), P('M0,-18C4,-18 4,22 0,22C-4,22 -4,-18 0,-18Z', 'accent'), P('M0,-18Q-8,-34 -14,-36M0,-18Q8,-34 14,-36', 'line')]],
  // fauna
  ['ladybug', 'Ladybug', [P(circ(34, 0, 6)), P(circ(14, 0, -30), 'accent'), P(circ(6, -14, 0) + circ(6, 14, 4) + circ(5, -6, 20) + circ(5, 8, 22), 'accent'), P('M0,-26V40', 'line')]],
  ['bee', 'Bee', [P('M-6,-18C-20,-50 8,-50 6,-18Z', 'secondary'), P('M-30,0a30,22 0 1,0 60,0a30,22 0 1,0 -60,0Z', 'accent'), P('M-8,-20V20M8,-20V20', 'line', { w: 2 }), P(circ(3, 22, -4), 'primary')]],
  ['bird', 'Songbird', [P('M-40,10C-30,-20 10,-30 30,-10L48,-14L36,0C34,20 0,36 -40,10Z'), P('M-14,0C0,-14 18,-8 22,4C8,16 -6,12 -14,0Z', 'secondary'), P(circ(3, 22, -10), 'accent')]],
  ['feather', 'Feather', [P('M0,50C-26,10 -22,-30 0,-50C22,-30 26,10 0,50Z'), P('M0,50V-44', 'line')]],
  ['paw', 'Paw Print', [P(circ(18, 0, 14) + circ(8, -26, -8) + circ(8, -9, -24) + circ(8, 9, -24) + circ(8, 26, -8))]],
  ['bear', 'Bear Face', [P(circ(34, 0, 6) + circ(12, -28, -26) + circ(12, 28, -26)), P(circ(14, 0, 16), 'secondary'), P(circ(3, -12, -2) + circ(3, 12, -2) + circ(4, 0, 12), 'accent')]],
  // food
  ['apple', 'Apple', [P('M0,-30C-20,-44 -48,-20 -40,12C-34,38 -14,48 0,40C14,48 34,38 40,12C48,-20 20,-44 0,-30Z'), P('M2,-30C8,-46 22,-50 30,-44C22,-34 12,-30 2,-30Z', 'secondary')]],
  ['cherry', 'Cherries', [P('M-20,8C-14,-20 0,-40 8,-48M22,12C22,-10 12,-34 8,-48', 'line', { w: 1.5 }), P(circ(18, -20, 26) + circ(18, 22, 30)), P('M8,-48C20,-52 34,-46 38,-38C26,-34 14,-38 8,-48Z', 'secondary')]],
  ['lemon', 'Lemon', [P('M-46,0C-30,-30 30,-30 46,0C30,30 -30,30 -46,0Z'), P('M-4,-22C0,-34 14,-38 22,-32C16,-24 6,-22 -4,-22Z', 'secondary')]],
  ['orange', 'Orange Slice', [P(circ(46)), P(circ(38), 'secondary'), P('M0,0L0,-38M0,0L33,-19M0,0L33,19M0,0L0,38M0,0L-33,19M0,0L-33,-19', 'line')]],
  ['strawberry', 'Strawberry', [P('M0,46C-30,34 -42,0 -34,-20C-20,-30 20,-30 34,-20C42,0 30,34 0,46Z'), P('M0,-24L-16,-38L-6,-30L0,-44L6,-30L16,-38Z', 'secondary'), P('M-12,-6h1M10,-8h1M0,6h1M-14,14h1M14,12h1', 'line', { w: 2 })]],
  ['melon', 'Watermelon Slice', [P('M-50,-10A50,50 0 0,0 50,-10Z', 'secondary'), P('M-42,-10A42,42 0 0,0 42,-10Z'), P(circ(3, -14, 10) + circ(3, 0, 18) + circ(3, 14, 10), 'accent')]],
  // geometric
  ['circle', 'Circle', [P(circ(40))]],
  ['ring', 'Ring', [P(circ(40), 'line', { w: 2.5 })]],
  ['triangle', 'Triangle', [P(poly(3, 46))]],
  ['hexagon', 'Hexagon', [P(poly(6, 46, 0)), P(poly(6, 24, 0), 'accent')]],
  ['diamond', 'Diamond', [P('M0,-48L32,0L0,48L-32,0Z')]],
  ['rsquare', 'Rounded Square', [P('M-24,-40h48a16,16 0 0,1 16,16v48a16,16 0 0,1 -16,16h-48a16,16 0 0,1 -16,-16v-48a16,16 0 0,1 16,-16Z')]],
  ['star4', 'Four-point Star', [P(star(4, 48, 14))]],
  ['star6', 'Six-point Star', [P(star(6, 48, 26))]],
  ['halfcircle', 'Half Circle', [P('M-46,20A46,46 0 0,1 46,20Z')]],
  ['arcs', 'Nested Arcs', [P('M-40,20A40,40 0 0,1 40,20M-28,20A28,28 0 0,1 28,20M-16,20A16,16 0 0,1 16,20', 'line', { w: 2.5 })]],
  ['cross', 'Cross', [P('M-10,-40h20v30h30v20h-30v30h-20v-30h-30v-20h30Z')]],
  // organic
  ['blob1', 'Blob A', [P('M-30,-30C0,-52 40,-34 44,-4C48,28 10,50 -22,40C-52,30 -52,-10 -30,-30Z')]],
  ['blob2', 'Blob B', [P('M-40,0C-44,-34 -10,-48 20,-40C50,-32 48,10 28,34C8,56 -36,40 -40,0Z')]],
  ['drop', 'Drop', [P('M0,-48C20,-20 32,-6 32,12A32,32 0 0,1 -32,12C-32,-6 -20,-20 0,-48Z')]],
  ['pebble', 'Pebble', [P('M-44,6C-44,-22 -10,-30 18,-26C44,-22 48,12 26,26C0,42 -44,34 -44,6Z'), P('M-20,6c6,-8 14,-8 20,-6', 'line', { w: 1.5 })]],
  // retro / memphis / boho
  ['sunburst', 'Sunburst', [P(circ(22)), ...rot(SPIKES, 'secondary', ring(12))]],
  ['rainbow', 'Rainbow', [P('M-46,24A46,46 0 0,1 46,24L34,24A34,34 0 0,0 -34,24Z'), P('M-34,24A34,34 0 0,1 34,24L22,24A22,22 0 0,0 -22,24Z', 'secondary'), P('M-22,24A22,22 0 0,1 22,24L10,24A10,10 0 0,0 -10,24Z', 'accent')]],
  ['wave', 'Wave', [P('M-48,0C-36,-24 -24,-24 -12,0S12,24 24,0S42,-24 48,-6', 'line', { w: 3 })]],
  ['squiggle', 'Squiggle', [P('M-46,0q8,-16 16,0t16,0t16,0t16,0t16,0', 'line', { w: 3 })]],
  ['zigzag', 'Zigzag', [P('M-46,12L-30,-12L-14,12L2,-12L18,12L34,-12L46,12', 'line', { w: 3 })]],
  ['dots', 'Dot Cluster', [P(circ(6, -20, -16) + circ(6, 0, 0) + circ(6, 20, 14) + circ(6, -18, 18) + circ(6, 20, -18))]],
  ['arrow', 'Arrow', [P('M-46,0H40M40,0L24,-14M40,0L24,14', 'line', { w: 2.5 })]],
  ['moon', 'Crescent Moon', [P('M10,-46A46,46 0 1,0 10,46A36,36 0 1,1 10,-46Z')]],
  ['seigaiha', 'Wave Scales', [P('M-46,30A46,46 0 0,1 46,30Z'), P('M-34,30A34,34 0 0,1 34,30Z', 'secondary'), P('M-22,30A22,22 0 0,1 22,30Z', 'accent'), P('M-10,30A10,10 0 0,1 10,30Z')]],
  // terrazzo
  ['chip1', 'Chip 1', [P('M-30,-20L10,-34L38,-6L22,30L-26,22Z')]],
  ['chip2', 'Chip 2', [P('M-34,0L-6,-30L30,-18L26,24L-12,34Z')]],
  ['chip3', 'Chip 3', [P('M-20,-30L26,-26L34,10L-6,32L-36,8Z')]],
  ['chip4', 'Chip 4', [P('M-38,-8L0,-34L36,-14L30,22L-10,28Z')]],
  // kids
  ['cloud', 'Cloud', [P('M-34,24A18,18 0 0,1 -34,-12A24,24 0 0,1 12,-22A22,22 0 0,1 36,24Z')]],
  ['heart', 'Heart', [P(HEART)]],
  ['balloon', 'Balloon', [P('M0,28Q-8,38 0,48', 'line'), P('M0,-46C30,-46 34,-8 0,22C-34,-8 -30,-46 0,-46Z'), P('M0,22L-5,29H5Z', 'secondary')]],
  ['star5', 'Star', [P(star(5, 48, 22))]],
  // luxury / islamic / japanese
  ['fleur', 'Fleur', [...mirror('M0,4C-18,-6 -40,-10 -42,6C-36,24 -12,16 0,4Z', 'secondary'), P('M0,-48C14,-30 14,-10 0,4C-14,-10 -14,-30 0,-48Z'), P('M0,4V46M-14,22H14', 'line', { w: 1.5 })]],
  ['ornament', 'Ornament Diamond', [P('M0,-48L22,0L0,48L-22,0Z'), P('M0,-30L12,0L0,30L-12,0Z', 'accent'), P(circ(4), 'secondary')]],
  ['scroll', 'Scroll', [P('M0,0C0,-10 10,-14 16,-8C24,0 18,16 4,18C-16,20 -28,2 -22,-16C-14,-38 20,-42 36,-28', 'line', { w: 2.5 })]],
  ['star8', 'Eight-point Star', [P(star(8, 48, 26)), P(circ(8), 'accent')]],
  ['star12', 'Twelve-point Star', [P(star(12, 48, 34)), P(star(12, 24, 16), 'secondary')]],
  ['octstar', 'Octagram', [P(poly(4, 48, 45) + poly(4, 48, 0)), P(circ(8), 'accent')]],
  ['sakura', 'Sakura', [...rot('M0,0C-18,-14 -16,-36 -6,-46L0,-38L6,-46C16,-36 18,-14 0,0Z', 'primary', ring(5)), P(circ(5), 'accent')]],
  ['bamboo', 'Bamboo', [P('M-8,-48H8V48H-8Z'), P('M-8,-16H8M-8,16H8', 'line'), P('M8,-30C28,-34 38,-26 42,-20C28,-18 16,-20 8,-30Z', 'secondary')]],
  ['waverings', 'Wave Rings', [P(circ(40) + circ(28) + circ(16), 'line', { w: 2 })]],
  // doodle / seasonal / fashion / scandi
  ['spiral', 'Spiral', [P('M0,0C4,-4 10,-2 10,4C10,14 -4,18 -14,10C-26,0 -18,-24 0,-28C26,-32 42,-6 34,18', 'line', { w: 3 })]],
  ['dstar', 'Doodle Star', [P('M0,-44L10,-14L42,-12L16,8L26,40L0,20L-26,40L-16,8L-42,-12L-10,-14Z', 'line', { w: 2.5 })]],
  ['dheart', 'Doodle Heart', [P(HEART, 'line', { w: 2.5 })]],
  ['snowflake', 'Snowflake', rot('M0,0V-46M0,-30L-10,-40M0,-30L10,-40M0,-18L-8,-26M0,-18L8,-26', 'line', ring(6), 2.5)],
  ['pine', 'Pine Tree', [P('M0,-48L28,-14H14L36,16H8V40H-8V16H-36L-14,-14H-28Z'), P('M-8,16H8V40H-8Z', 'secondary')]],
  ['pumpkin', 'Pumpkin', [P('M-44,4C-44,-26 -20,-34 0,-30C20,-34 44,-26 44,4C44,34 20,40 0,38C-20,40 -44,34 -44,4Z'), P('M-14,-30C-24,-4 -24,20 -14,38M14,-30C24,-4 24,20 14,38', 'line'), P('M-4,-30L-2,-44H6L4,-30Z', 'secondary')]],
  ['holly', 'Holly', [P('M-46,0Q-34,-16 -22,-8Q-10,-20 2,-8Q14,-20 26,-8Q38,-16 46,0Q38,16 26,8Q14,20 2,8Q-10,20 -22,8Q-34,16 -46,0Z'), P(circ(6, 0, 14) + circ(6, -10, 22) + circ(6, 10, 22), 'accent')]],
  ['paisley', 'Paisley', [P('M-6,46C-40,40 -44,-8 -14,-34C12,-54 40,-30 30,-2C24,14 4,14 8,-4C10,-14 22,-14 20,-22C14,-34 -12,-22 -14,0C-16,24 6,34 14,26C8,40 0,46 -6,46Z'), P(circ(3, -4, 8), 'accent')]],
  ['stripe', 'Stripe', [P('M-46,-8H46V8H-46Z')]],
  ['polka', 'Polka Dot', [P(circ(14))]],
  ['branch', 'Branch', [P('M0,50V-50', 'line', { w: 1.5 }), ...[34, 14, -6, -26].flatMap((y, i) => [P(SMALL, 'primary', { transform: `translate(0 ${y}) rotate(${i % 2 ? -50 : -35})` }), P(SMALL, 'primary', { transform: `translate(0 ${y}) rotate(${i % 2 ? -130 : -145})` })])]],
  ['dot', 'Dot', [P(circ(10))]],
  ['sun', 'Simple Sun', [P(circ(20)), ...rot('M0,-30V-46', 'line', ring(8), 3)]],
  ['arch', 'Arch', [P('M-30,40V0A30,30 0 0,1 30,0V40Z')]],
  ['la-leaf', 'Line Leaf', [LN('M0,46C-26,24 -26,-24 0,-46C26,-24 26,24 0,46Z'), LN('M0,46V-34', 0.8), ...[22, 6, -10, -26].flatMap(y => [LN(`M0,${y}L-13,${y - 12}`, 0.7), LN(`M0,${y}L13,${y - 12}`, 0.7)])]],
  ['la-sprig', 'Line Sprig', [LN('M0,50V-30'), ...[34, 14, -6, -26].flatMap(y => [P(SMALL, 'line', { w: 0.9, transform: `translate(0 ${y}) rotate(-38)` }), P(SMALL, 'line', { w: 0.9, transform: `translate(0 ${y}) rotate(-142)` })]), P(SMALL, 'line', { w: 0.9, transform: 'translate(0 -28) rotate(-90)' })]],
  ['la-flower', 'Line Flower', [...rot('M0,-6C-14,-16 -14,-34 0,-44C14,-34 14,-16 0,-6Z', 'line', ring(6), 1), LN(circ(5))]],
  ['la-wave', 'Line Waves', [-24, 0, 24].map(y => LN('M-46,0Q-34,-14 -23,0T0,0T23,0T46,0', 1, { transform: `translate(0 ${y})` }))],
  ['la-circles', 'Line Rings', [44, 32, 20, 8].map(r => LN(circ(r)))],
  ['la-sunburst', 'Line Sunburst', [...rot('M0,-26V-46', 'line', ring(16), 1), LN(circ(18)), LN(circ(8))]],
  ['la-moon', 'Line Moon', [LN('M10,-44A44,44 0 1,0 10,44A60,60 0 0,1 10,-44Z', 1.2), LN(star(4, 9, 2), 1, { transform: 'translate(26 -14)' }), LN(star(4, 6, 1.5), 1, { transform: 'translate(32 14)' })]],
  ['la-fan', 'Line Fan', [...[44, 30, 16].map(r => LN(`M${-r},40A${r},${r} 0 0,1 ${r},40`)), ...[-60, -30, 0, 30, 60].map(a => LN('M0,-8V-44', 1, { transform: `translate(0 40) rotate(${a})` }))]],
  ['la-diamond', 'Line Diamond', [LN('M0,-46L40,0L0,46L-40,0Z'), LN('M0,-30L26,0L0,30L-26,0Z'), LN('M0,-14L12,0L0,14L-12,0Z')]],
  ['la-hexagon', 'Line Hexagon', [LN(poly(6, 44)), LN(poly(6, 30)), LN(poly(6, 16))]],
  ['la-star8', 'Line Star', [LN(star(8, 46, 24)), LN(circ(8))]],
  ['la-spiral', 'Line Spiral', [LN('M0,0C0,-6 8,-6 8,0C8,12 -12,12 -12,-2C-12,-22 22,-22 22,2C22,34 -30,34 -30,-6C-30,-44 40,-44 40,6', 1.2)]],
  ['la-arch', 'Line Arches', [LN('M-40,46V0A40,40 0 0,1 40,0V46'), LN('M-28,46V0A28,28 0 0,1 28,0V46'), LN('M-16,46V0A16,16 0 0,1 16,0V46')]],
  ['lux-quatrefoil', 'Quatrefoil', [P(circ(18, -15, 0) + circ(18, 15, 0) + circ(18, 0, -15) + circ(18, 0, 15)), P(circ(7), 'accent')]],
  ['lux-ogee', 'Ogee', [LN('M0,-46C28,-30 40,-14 40,6C40,28 20,40 0,46C-20,40 -40,28 -40,6C-40,-14 -28,-30 0,-46Z', 1.6), LN('M0,-46C28,-30 40,-14 40,6C40,28 20,40 0,46C-20,40 -40,28 -40,6C-40,-14 -28,-30 0,-46Z', 1, { transform: 'scale(0.62)' }), P(circ(5, 0, 2), 'accent')]],
  ['lux-scroll', 'Scroll', [LN('M0,34C-28,34 -42,6 -22,-14C-8,-28 12,-16 4,-4C-2,4 -10,0 -8,-6', 1.6), LN('M0,34C-28,34 -42,6 -22,-14C-8,-28 12,-16 4,-4C-2,4 -10,0 -8,-6', 1.6, { transform: 'scale(-1 1)' }), P(circ(4, 0, 38), 'accent')]],
  ['lux-medallion', 'Medallion', [LN(circ(44), 1.5), LN(circ(36)), ...rot('M0,-18C-6,-24 -6,-30 0,-34C6,-30 6,-24 0,-18Z', 'secondary', ring(8)), P(circ(8), 'accent')]],
  ['lux-greekkey', 'Greek Key', [LN('M-44,40V-40H40V24H-24V-24H24V8H-8', 1.8)]],
  ['lux-fleur', 'Fleur', [P('M0,-46C14,-30 14,-10 0,6C-14,-10 -14,-30 0,-46Z'), ...mirror('M-2,6C-20,-6 -40,-8 -44,8C-40,22 -22,20 -10,14Z', 'secondary'), P('M-18,20H18V28H-18Z', 'accent'), P('M0,28C-4,38 -8,42 -12,46C-4,44 0,46 0,46C4,44 8,42 12,46C8,42 4,38 0,28Z')]],
  ['lux-laurel', 'Laurel', [LN('M4,46C30,34 36,-6 18,-42', 1.4), LN('M4,46C30,34 36,-6 18,-42', 1.4, { transform: 'scale(-1 1)' }), ...[P(SMALL, 'primary', { transform: 'translate(12.5 40.5) rotate(-89)' }), P(SMALL, 'primary', { transform: 'translate(12.5 40.5) rotate(7)' }), P(SMALL, 'primary', { transform: 'translate(21.9 28.5) rotate(-110)' }), P(SMALL, 'primary', { transform: 'translate(21.9 28.5) rotate(-14)' }), P(SMALL, 'primary', { transform: 'translate(27.2 12.9) rotate(-127)' }), P(SMALL, 'primary', { transform: 'translate(27.2 12.9) rotate(-31)' }), P(SMALL, 'primary', { transform: 'translate(28.2 -5.2) rotate(-142)' }), P(SMALL, 'primary', { transform: 'translate(28.2 -5.2) rotate(-46)' }), P(SMALL, 'primary', { transform: 'translate(24.8 -24.5) rotate(-154)' }), P(SMALL, 'primary', { transform: 'translate(24.8 -24.5) rotate(-58)' })].flatMap(p => [p, { ...p, transform: `scale(-1 1) ${p.transform}` }])]],
  ['lux-pearl', 'Pearl Ring', [...ring(12).map(a => P(circ(4, 0, -38), 'primary', { transform: `rotate(${a})` })), LN(circ(24), 0.8), P(circ(8), 'accent')]],
  ['lux-sunrise', 'Deco Sunrise', [P('M-44,40A44,44 0 0,1 44,40Z'), P('M-30,40A30,30 0 0,1 30,40Z', 'secondary'), P('M-16,40A16,16 0 0,1 16,40Z', 'accent')]],
  ['lux-sparkle', 'Sparkle', [P(star(4, 46, 6)), P(star(4, 20, 3), 'accent', { transform: 'rotate(45)' })]],
  ['lux-chevron', 'Chevron Stack', [LN('M-40,-24L0,-4L40,-24', 1.6), LN('M-40,-2L0,18L40,-2', 1.6), LN('M-40,20L0,40L40,20', 1.6)]],
];

export const ELEMENTS: VecElement[] = list.map(([id, name, parts]) => ({ id, name, parts }));
export const ELEMENTS_BY_ID: Record<string, VecElement> = Object.fromEntries(ELEMENTS.map(e => [e.id, e]));
