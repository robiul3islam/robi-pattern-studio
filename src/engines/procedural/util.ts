import type { ProcCtx, ProcParam } from './types';

export const f = (n: number) => +n.toFixed(2);
export const TAU = Math.PI * 2;
export const even = (n: number) => Math.max(2, Math.round(n / 2) * 2);
export const range = (a: number, b: number) => Array.from({ length: Math.max(0, b - a + 1) }, (_, i) => a + i);
export const ink = (c: ProcCtx, p: Record<string, number>) => c.colors[Math.round(p.col ?? 0) % Math.min(4, c.colors.length)];
export const COL: ProcParam = { k: 'col', label: 'Ink colour (palette slot 1-4)', min: 0, max: 3, def: 0 };

/**
 * Smooth periodic 0..1 field used by the halftone engines.
 * kind 0 = top-bottom, 1 = left-right, 2 = diagonal, 3 = blobs at the tile corners/centre.
 * saw = true gives a one-way ramp (hard step at the tile seam, but lattices still wrap exactly).
 */
export function field(kind: number, x: number, y: number, w: number, h: number, saw: boolean, invert: boolean): number {
  const u = x / w, v = y / h;
  let g: number;
  switch (Math.round(kind)) {
    case 1: g = saw ? u : 0.5 - 0.5 * Math.cos(TAU * u); break;
    case 2: g = saw ? (((u + v) / 2) % 1 + 1) % 1 : 0.5 - 0.5 * Math.cos(TAU * (u + v)); break;
    case 3: g = 0.5 + 0.25 * (Math.cos(TAU * u) + Math.cos(TAU * v)); break;
    default: g = saw ? v : 0.5 - 0.5 * Math.cos(TAU * v);
  }
  return invert ? 1 - g : g;
}
