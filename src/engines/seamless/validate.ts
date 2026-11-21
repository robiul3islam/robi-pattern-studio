import { groupBounds, type Bounds } from '../geometry/bounds';

export interface SeamlessReport {
  ok: boolean; errors: string[]; warnings: string[];
  groups: number; edgeGroups: number; checkedCopies: number;
}
const EPS = 1e-3, POS_TOL = 0.02;

/**
 * Validates the REAL exported SVG (not the layout): re-parses every element group, recomputes its true
 * geometric bounds from path data + transform, and verifies periodic closure. Whenever a group, shifted by
 * any of the 8 neighbouring tile offsets, overlaps the tile, an identical group (same element, rotation,
 * scale, flip, fills) must exist at exactly that shifted position. Missing or misplaced copies = seam.
 */
export function validateSeamless(svg: string, w: number, h: number): SeamlessReport {
  const errors: string[] = [], warnings: string[] = [];
  const root = svg.match(/<svg\b[^>]*>/)?.[0] ?? '';
  if (!root) errors.push('Not an SVG document.');
  if (!root.includes(`viewBox="0 0 ${w} ${h}"`)) errors.push(`viewBox is not "0 0 ${w} ${h}".`);
  if (!root.includes(`width="${w}"`) || !root.includes(`height="${h}"`)) errors.push('width/height do not match the tile size.');
  if (!/<clipPath id="tile"><rect width="\d+" height="\d+"\/><\/clipPath>/.test(svg)) errors.push('Tile clip path is missing.');
  if (!svg.includes('clip-path="url(#tile)"')) errors.push('Pattern group is not clipped to the tile.');

  interface G { id: string; x: number; y: number; b: Bounds; sig: string; }
  const gs: G[] = [];
  for (const m of svg.matchAll(/<g id="([^"]+)" data-element="([^"]+)" transform="([^"]+)">(.*?)<\/g>/g)) {
    const t = m[3].match(/^translate\(([-\d.e]+) ([-\d.e]+)\) (.+)$/);
    if (!t) { errors.push(`Group ${m[1]} has an unexpected transform.`); continue; }
    let b: Bounds;
    try { b = groupBounds(m[2], m[3]); } catch (e) { errors.push(`Group ${m[1]}: ${(e as Error).message}`); continue; }
    gs.push({ id: m[1], x: +t[1], y: +t[2], b, sig: `${m[2]}|${t[3]}|${m[4]}` });
  }
  const index = new Map<string, G[]>();
  for (const g of gs) { const a = index.get(g.sig); if (a) a.push(g); else index.set(g.sig, [g]); }
  const hits = (b: Bounds, sx: number, sy: number) =>
    b.maxX + sx > EPS && b.minX + sx < w - EPS && b.maxY + sy > EPS && b.minY + sy < h - EPS;

  let edgeGroups = 0, checked = 0;
  for (const g of gs) {
    if (!hits(g.b, 0, 0)) { warnings.push(`Hidden object ${g.id} lies fully outside the tile.`); continue; }
    let edge = false;
    for (const sx of [-w, 0, w]) for (const sy of [-h, 0, h]) {
      if ((sx === 0 && sy === 0) || !hits(g.b, sx, sy)) continue;
      edge = true; checked++;
      const found = index.get(g.sig)!.some(o => Math.abs(o.x - (g.x + sx)) < POS_TOL && Math.abs(o.y - (g.y + sy)) < POS_TOL);
      if (!found) errors.push(`Seam break: ${g.id} has no matching copy at tile offset (${sx / w}, ${sy / h}).`);
    }
    if (edge) edgeGroups++;
  }
  if (!gs.length && !svg.includes('id="procedural"')) errors.push('No pattern elements found.');
  return { ok: errors.length === 0, errors, warnings, groups: gs.length, edgeGroups, checkedCopies: checked };
}
