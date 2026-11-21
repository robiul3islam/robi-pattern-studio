import type { BgPattern, BgType } from '../../types';

export const BG_TYPES: BgType[] = ['dots', 'hexdots', 'stripes', 'pinstripe', 'diagonal', 'crosshatch', 'grid', 'checks', 'waves', 'chevron', 'scales', 'crosses', 'diamonds'];
const f = (n: number) => +n.toFixed(2);
const even = (n: number) => Math.max(2, Math.round(n / 2) * 2);
const range = (a: number, b: number) => Array.from({ length: Math.max(0, b - a + 1) }, (_, i) => a + i);

/** Tile-periodic background texture. Every lattice divides the tile exactly, so it never breaks the seam. */
export function bgPatternSvg(bp: BgPattern, w: number, h: number): string {
  const n = Math.min(40, Math.max(2, Math.round(bp.scale)));
  const cw = w / n, m = Math.max(1, Math.round(h / cw)), ch = h / m, u = Math.min(cw, ch);
  const c = bp.color, lines = (d: string, sw: number) => `<path d="${d}" fill="none" stroke="${c}" stroke-width="${f(sw)}" stroke-linecap="round" stroke-linejoin="round"/>`;
  let body = '';
  switch (bp.type) {
    case 'dots': body = range(0, n - 1).flatMap(i => range(0, m - 1).map(j => `<circle cx="${f((i + 0.5) * cw)}" cy="${f((j + 0.5) * ch)}" r="${f(u * 0.14)}" fill="${c}"/>`)).join(''); break;
    case 'hexdots': { const mm = even(m), hh = h / mm; body = range(-1, n).flatMap(i => range(0, mm - 1).map(j => `<circle cx="${f((i + 0.5 + (j % 2) * 0.5) * cw)}" cy="${f((j + 0.5) * hh)}" r="${f(u * 0.13)}" fill="${c}"/>`)).join(''); break; }
    case 'stripes': body = range(0, n - 1).map(i => `<rect x="${f(i * cw)}" y="0" width="${f(cw / 2)}" height="${h}" fill="${c}"/>`).join(''); break;
    case 'pinstripe': body = lines(range(0, n - 1).map(i => `M${f((i + 0.5) * cw)},0V${h}`).join(''), cw * 0.04); break;
    case 'diagonal': body = lines(range(0, 2 * n).map(k => `M${f(k * cw)},0L${f(k * cw - w)},${h}`).join(''), cw * 0.1); break;
    case 'crosshatch': body = lines(range(0, 2 * n).map(k => `M${f(k * cw)},0L${f(k * cw - w)},${h}`).join('') + range(-n, n).map(k => `M${f(k * cw)},0L${f(k * cw + w)},${h}`).join(''), cw * 0.05); break;
    case 'grid': body = lines(range(0, n).map(i => `M${f(i * cw)},0V${h}`).join('') + range(0, m).map(j => `M0,${f(j * ch)}H${w}`).join(''), cw * 0.05); break;
    case 'checks': { const n2 = even(n), c2 = w / n2, m2 = even(Math.round(h / c2)), h2 = h / m2; body = range(0, n2 - 1).flatMap(i => range(0, m2 - 1).filter(j => (i + j) % 2 === 0).map(j => `<rect x="${f(i * c2)}" y="${f(j * h2)}" width="${f(c2)}" height="${f(h2)}" fill="${c}"/>`)).join(''); break; }
    case 'waves': { const n2 = even(n), c2 = w / n2, a = ch * 0.22; body = lines(range(0, m - 1).map(j => { const y = (j + 0.5) * ch; return `M0,${f(y)}` + range(0, n2 - 1).map(i => `Q${f((i + 0.5) * c2)},${f(y + (i % 2 ? 2 : -2) * a)} ${f((i + 1) * c2)},${f(y)}`).join(''); }).join(''), cw * 0.06); break; }
    case 'chevron': { const n2 = even(n), c2 = w / n2, a = ch * 0.3; body = lines(range(0, m - 1).map(j => { const y = (j + 0.35) * ch; return `M0,${f(y)}` + range(1, n2).map(i => `L${f(i * c2)},${f(y + (i % 2 ? a : 0))}`).join(''); }).join(''), cw * 0.07); break; }
    case 'scales': { const r = cw / 2, mm = even(Math.round(h / r)), hh = h / mm; body = range(0, mm - 1).flatMap(j => range(-1, n).map(i => { const x = (i + (j % 2 ? 0.5 : 0)) * cw + cw / 2, y = j * hh; return `<circle cx="${f(x)}" cy="${f(y)}" r="${f(r)}" fill="none" stroke="${c}" stroke-width="${f(cw * 0.05)}"/>`; })).join(''); break; }
    case 'crosses': { const s2 = u * 0.14; body = lines(range(0, n - 1).flatMap(i => range(0, m - 1).map(j => { const x = (i + 0.5) * cw, y = (j + 0.5) * ch; return `M${f(x - s2)},${f(y)}H${f(x + s2)}M${f(x)},${f(y - s2)}V${f(y + s2)}`; })).join(''), cw * 0.05); break; }
    case 'diamonds': { const s2 = u * 0.2; body = range(0, n - 1).flatMap(i => range(0, m - 1).map(j => { const x = (i + 0.5) * cw, y = (j + 0.5) * ch; return `<path d="M${f(x)},${f(y - s2)}L${f(x + s2)},${f(y)}L${f(x)},${f(y + s2)}L${f(x - s2)},${f(y)}Z" fill="${c}"/>`; })).join(''); break; }
  }
  return `<g id="bgpattern" opacity="${f(Math.min(1, Math.max(0, bp.opacity)))}" clip-path="url(#tile)">${body}</g>`;
}
