import { validateSeamless } from '../seamless/validate';

export type Status = 'pass' | 'warn' | 'fail';
export interface Check { id: string; label: string; status: Status; detail: string; }
export interface QualityReport { score: number; checks: Check[]; }

export function checkQuality(svg: string, w: number, h: number): QualityReport {
  const checks: Check[] = [];
  const add = (id: string, label: string, status: Status, detail: string) => checks.push({ id, label, status, detail });

  const seam = validateSeamless(svg, w, h);
  add('seamless', 'Seamless tile', seam.ok ? (seam.warnings.length ? 'warn' : 'pass') : 'fail',
    seam.ok ? (seam.warnings[0] ?? 'Edges wrap correctly.') : seam.errors[0]);

  const min = Math.min(w, h);
  add('size', 'Tile size', min >= 2000 ? 'pass' : min >= 1000 ? 'warn' : 'fail',
    `${w} x ${h}px. Stock sites prefer big rasters: export PNG at 2x-4x, or use SVG.`);

  const tops = [...svg.matchAll(/<g id="e(\d+)" data-element="[^"]*" transform="translate\(([-\d.]+) ([-\d.]+)\)/g)];
  add('count', 'Element count', tops.length >= 8 ? 'pass' : tops.length >= 4 ? 'warn' : 'fail', `${tops.length} elements in the tile.`);

  const cells = new Set<number>();
  for (const m of tops) cells.add(Math.min(3, Math.floor(+m[3] / (h / 4))) * 4 + Math.min(3, Math.floor(+m[2] / (w / 4))));
  const empty = 16 - cells.size;
  add('balance', 'Even coverage', tops.length === 0 ? 'fail' : empty === 0 ? 'pass' : empty <= 3 ? 'warn' : 'fail',
    empty === 0 ? 'All 16 zones of the tile have elements.' : `${empty} of 16 zones have no element centre: gaps or clumps likely.`);

  const fills = new Set([...svg.matchAll(/fill="(#[0-9a-fA-F]{3,8})"/g)].map(m => m[1].toLowerCase()));
  add('colors', 'Colour count', fills.size <= 8 ? 'pass' : fills.size <= 12 ? 'warn' : 'fail', `${fills.size} distinct fill colours.`);

  const bad = /<image\b|<text\b|<foreignObject\b|<filter\b/.test(svg);
  add('clean', 'Clean vector', bad ? 'fail' : 'pass', bad ? 'Contains raster, text or filter nodes.' : 'Only plain vector paths.');

  const kb = Math.round(new Blob([svg]).size / 1024);
  add('filesize', 'File size', kb <= 2048 ? 'pass' : kb <= 10240 ? 'warn' : 'fail', `${kb} KB.`);

  const pts = checks.reduce((a, c) => a + (c.status === 'pass' ? 1 : c.status === 'warn' ? 0.5 : 0), 0);
  return { score: Math.round((pts / checks.length) * 100), checks };
}
