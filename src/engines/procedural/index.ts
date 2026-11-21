import type { LayoutSettings, RenderOptions } from '../../types';
import type { ProcDef } from './types';
import { halftoneDots, halftoneSlash, halftoneTri } from './halftone';
import { cubeWeave, flowLines } from './lines';
import { swirlSun, warpStripes } from './groovy';
import { makeKnit } from './knit';

export type { ProcDef, ProcParam } from './types';
export const PROC_LIST: ProcDef[] = [
  halftoneTri, halftoneDots, halftoneSlash, flowLines, cubeWeave, swirlSun, warpStripes,
  makeKnit('fair-reindeer', 'Nordic reindeer knit'), makeKnit('fair-sweater', 'Ugly Christmas sweater'), makeKnit('fair-allover', 'Snowflake knit all-over'),
];
export const PROCS: Record<string, ProcDef> = Object.fromEntries(PROC_LIST.map(p => [p.id, p]));

export const procDefaults = (id: string): Record<string, number> => Object.fromEntries((PROCS[id]?.params ?? []).map(p => [p.k, p.def]));

/** Full-tile procedural layer drawn between the background texture and the motifs. */
export function procLayer(s: LayoutSettings, o: RenderOptions): string {
  const def = s.proc ? PROCS[s.proc] : undefined;
  if (!def) return '';
  const p = { ...procDefaults(def.id), ...(s.pv ?? {}) };
  return `<g id="procedural" data-proc="${def.id}" clip-path="url(#tile)">${def.render(s.w, s.h, { colors: o.colors, bg: o.bg, seed: s.seed }, p)}</g>`;
}
