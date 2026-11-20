import type { Instance, LayoutSettings, PatternLayout } from '../../types';
import { CATEGORY_CONFIG } from '../../data/categoryConfig';
import { QUICK_PALETTES } from '../../data/palettes';
import { generateLayout } from '../pattern/generate';
import { buildSvg } from '../vector/buildSvg';

export interface Project {
  id: string; name: string; settings: LayoutSettings; colors: string[]; bg: string; outline: string;
  instances?: Instance[]; createdAt: number;
}

export const safeGet = (k: string) => { try { return localStorage.getItem(k); } catch { return null; } };
export const safeSet = (k: string, v: string) => { try { localStorage.setItem(k, v); return true; } catch { return false; } };
const PK = 'robi.projects.v1', SK = 'robi.stats.v1', EK = 'robi.exports.v1';
export const newId = () => Math.random().toString(36).slice(2, 10);

function readJson<T>(k: string, fallback: T): T {
  const raw = safeGet(k);
  if (!raw) return fallback;
  try { return JSON.parse(raw) as T; } catch { return fallback; }
}
const isProject = (p: unknown): p is Project => {
  const o = p as Project;
  return !!o && typeof o.id === 'string' && !!o.settings && Array.isArray(o.colors) && typeof o.bg === 'string';
};
export const loadProjects = (): Project[] => readJson<unknown[]>(PK, []).filter(isProject);
export const saveProjects = (l: Project[]) => safeSet(PK, JSON.stringify(l));
export function upsertProject(p: Project): boolean {
  const l = loadProjects(); const i = l.findIndex(x => x.id === p.id);
  if (i >= 0) l[i] = p; else l.unshift(p);
  return saveProjects(l);
}
export const deleteProject = (id: string) => saveProjects(loadProjects().filter(p => p.id !== id));
export const parseProjects = (text: string): Project[] => {
  const v = JSON.parse(text); return (Array.isArray(v) ? v : [v]).filter(isProject);
};

export interface Stats { generated: number; exports: number; }
export const loadStats = (): Stats => ({ generated: 0, exports: 0, ...readJson<Partial<Stats>>(SK, {}) });
export function bump(key: keyof Stats, by = 1) { const s = loadStats(); s[key] += by; safeSet(SK, JSON.stringify(s)); }
export interface ExportLog { name: string; fmt: string; at: number; }
export const loadExports = (): ExportLog[] => readJson<ExportLog[]>(EK, []);
export function logExport(name: string, fmt: string) {
  safeSet(EK, JSON.stringify([{ name, fmt, at: Date.now() }, ...loadExports()].slice(0, 8)));
  bump('exports');
}

export function defaultSettings(categoryId: string, seed = 1): LayoutSettings {
  const c = CATEGORY_CONFIG[categoryId];
  return { categoryId, mode: c.mode, count: c.count, size: c.size, density: c.density, spacing: c.spacing, rotation: c.rotation, randomness: c.randomness, symmetry: 'none', w: 1000, h: 1000, seed };
}
export function defaultProject(categoryId: string, paletteId?: string, seed = 1): Project {
  const pal = QUICK_PALETTES.find(p => p.id === (paletteId ?? CATEGORY_CONFIG[categoryId].palette)) ?? QUICK_PALETTES[0];
  return { id: newId(), name: `${categoryId} #${seed}`, settings: defaultSettings(categoryId, seed), colors: pal.colors, bg: pal.colors[4], outline: '#222222', createdAt: Date.now() };
}

/** Registers a user palette (4 pattern colours + background) under id "custom" and returns the id. */
export function setCustomPalette(colors: string[]): string {
  const four = Array.from({ length: 4 }, (_, i) => colors[i % colors.length]);
  const full = colors.length >= 5 ? colors.slice(0, 5) : [...four, '#ffffff'];
  const i = QUICK_PALETTES.findIndex(p => p.id === 'custom');
  const pal = { id: 'custom', name: 'Custom', group: 'Custom', colors: full };
  if (i >= 0) QUICK_PALETTES[i] = pal; else QUICK_PALETTES.push(pal);
  return 'custom';
}

export const layoutOf = (p: Project): PatternLayout =>
  p.instances ? { settings: p.settings, instances: p.instances, w: p.settings.w, h: p.settings.h } : generateLayout(p.settings);
export const renderSvg = (p: Project, transparent = false): string =>
  buildSvg(layoutOf(p), { colors: p.colors, bg: p.bg, outline: p.outline, transparent }, `${p.name}`);

export const variations = (base: Project, n: number): Project[] =>
  Array.from({ length: n }, (_, i) => ({ ...base, id: newId(), instances: undefined, name: `${base.name}-v${i + 1}`, settings: { ...base.settings, seed: base.settings.seed + i + 1 } }));
export const allCategories = (ids: string[], seed = 1): Project[] => ids.map(id => defaultProject(id, undefined, seed));
