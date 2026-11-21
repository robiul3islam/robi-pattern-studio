import { bgPatternSvg } from './bgPattern';
import type { Instance, PatternLayout, RenderOptions } from '../../types';
import { ELEMENTS_BY_ID } from '../../data/elements';
import { groupBounds } from '../geometry/bounds';

const esc = (v: string) => v.replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]!));
const EPS = 1e-3;

export function instTransform(inst: Instance, ox: number, oy: number): string {
  const sx = inst.flip ? -inst.s : inst.s;
  return `translate(${+(inst.x + ox).toFixed(2)} ${+(inst.y + oy).toFixed(2)}) rotate(${inst.r}) scale(${sx} ${inst.s})`;
}

export function instanceGroup(inst: Instance, id: string, ox: number, oy: number, o: RenderOptions): string {
  const el = ELEMENTS_BY_ID[inst.el];
  if (!el) throw new Error(`Unknown element: ${inst.el}`);
  const fills = [o.colors[inst.c[0]], o.colors[inst.c[1]], o.colors[inst.c[2]]];
  const parts = el.parts.map(p => {
    const t = p.transform ? ` transform="${p.transform}"` : '';
    if (p.role === 'line')
      return `<path d="${p.d}"${t} fill="none" stroke="${esc(p.stroke ?? o.outline)}" stroke-width="${2.5 * (p.w ?? 1)}" stroke-linecap="round" stroke-linejoin="round"/>`;
    const fill = p.fill ?? (p.role === 'primary' ? fills[0] : p.role === 'secondary' ? fills[1] : fills[2]);
    return `<path d="${p.d}"${t} fill="${esc(fill)}"/>`;
  });
  return `<g id="${id}" data-element="${el.id}" transform="${instTransform(inst, ox, oy)}">${parts.join('')}</g>`;
}

/** Tile content. Every instance is duplicated at each +-w / +-h offset whose real geometry overlaps the tile. */
export function buildTileBody(layout: PatternLayout, o: RenderOptions): string {
  const { w, h } = layout;
  const body: string[] = [];
  for (const inst of layout.instances) {
    const b = groupBounds(inst.el, instTransform(inst, 0, 0));
    for (const ox of [-w, 0, w]) for (const oy of [-h, 0, h]) {
      if (b.maxX + ox <= EPS || b.minX + ox >= w - EPS || b.maxY + oy <= EPS || b.minY + oy >= h - EPS) continue;
      const id = ox === 0 && oy === 0 ? `e${inst.n}` : `e${inst.n}_${ox / w + 1}${oy / h + 1}`;
      body.push(instanceGroup(inst, id, ox, oy, o));
    }
  }
  const bg = o.transparent ? '' : `<rect id="background" width="${w}" height="${h}" fill="${esc(o.bg)}"/>`;
  const tex = o.bgPattern && /^#[0-9a-fA-F]{6}$/.test(o.bgPattern.color) ? bgPatternSvg(o.bgPattern, w, h) : '';
  return `<defs><clipPath id="tile"><rect width="${w}" height="${h}"/></clipPath></defs>${bg}${tex}<g id="pattern" clip-path="url(#tile)">${body.join('')}</g>`;
}

export function buildSvg(layout: PatternLayout, o: RenderOptions, title = 'Seamless pattern tile'): string {
  const { w, h } = layout;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}"><title>${esc(title)}</title>${buildTileBody(layout, o)}</svg>`;
}

/** n x n repeat preview built from the very same tile body via an SVG <pattern>. */
export function buildTiledPreview(layout: PatternLayout, o: RenderOptions, n: number, seamLines: boolean): string {
  const { w, h } = layout;
  let lines = '';
  if (seamLines) {
    const l: string[] = [];
    for (let i = 1; i < n; i++) l.push(`M${i * w},0V${n * h}M0,${i * h}H${n * w}`);
    lines = `<path d="${l.join('')}" fill="none" stroke="#6d5efc" stroke-width="${Math.max(w, h) / 400}" stroke-dasharray="${w / 40} ${w / 40}"/>`;
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" viewBox="0 0 ${w * n} ${h * n}"><defs><pattern id="tp" width="${w}" height="${h}" patternUnits="userSpaceOnUse">${buildTileBody(layout, o)}</pattern></defs><rect width="${w * n}" height="${h * n}" fill="url(#tp)"/>${lines}</svg>`;
}

export function elementThumb(id: string, colors: string[], outline: string): string {
  const el = ELEMENTS_BY_ID[id];
  const o = { colors, bg: '', outline };
  const inst: Instance = { n: 0, el: id, x: 0, y: 0, s: 1, r: 0, flip: false, c: [0, 1, 2] };
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-60 -60 120 120" role="img" aria-label="${esc(el.name)}">${instanceGroup(inst, 't', 0, 0, o)}</svg>`;
}
