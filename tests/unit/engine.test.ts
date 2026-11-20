import { describe, it, expect } from 'vitest';
import { CATEGORIES } from '../../src/data/categories';
import { CATEGORY_CONFIG } from '../../src/data/categoryConfig';
import { ELEMENTS, ELEMENTS_BY_ID } from '../../src/data/elements';
import { QUICK_PALETTES } from '../../src/data/palettes';
import { generateLayout } from '../../src/engines/pattern/generate';
import { buildSvg } from '../../src/engines/vector/buildSvg';
import type { LayoutSettings, PatternMode } from '../../src/types';

const base = (over: Partial<LayoutSettings> = {}): LayoutSettings => ({
  categoryId: 'tropical', mode: 'scattered', count: 24, size: 90, density: 50, spacing: 1, rotation: 45, randomness: 40,
  symmetry: 'none', w: 1000, h: 1000, seed: 42, ...over,
});
const pal = QUICK_PALETTES[0];
const opts = (colors = pal.colors) => ({ colors, bg: '#fff', outline: '#222' });
const MODES: PatternMode[] = ['grid', 'scattered', 'organic', 'structured', 'dense', 'minimal', 'mirror', 'halfdrop', 'brick'];

describe('generator', () => {
  it('every category has config and valid elements', () => {
    for (const c of CATEGORIES) {
      const cfg = CATEGORY_CONFIG[c.id];
      expect(cfg, c.id).toBeDefined();
      for (const e of cfg.elements) expect(ELEMENTS_BY_ID[e], e).toBeDefined();
      expect(QUICK_PALETTES.some(p => p.id === cfg.palette), cfg.palette).toBe(true);
    }
  });
  it('all element parts have path data', () => {
    for (const e of ELEMENTS) { expect(e.parts.length).toBeGreaterThan(0); for (const p of e.parts) expect(p.d.length).toBeGreaterThan(3); }
  });
  it('same seed = same pattern, different seed = different', () => {
    expect(generateLayout(base())).toEqual(generateLayout(base()));
    expect(generateLayout(base({ seed: 43 })).instances).not.toEqual(generateLayout(base()).instances);
  });
  it('all categories x all modes produce instances', () => {
    for (const c of CATEGORIES) for (const mode of MODES) {
      const l = generateLayout(base({ categoryId: c.id, mode, symmetry: 'none' }));
      expect(l.instances.length, `${c.id}/${mode}`).toBeGreaterThan(2);
    }
  });
  it('symmetry modes still produce instances', () => {
    for (const symmetry of ['horizontal', 'vertical', 'both'] as const)
      expect(generateLayout(base({ symmetry })).instances.length).toBeGreaterThan(2);
  });
  it('palette change keeps geometry identical', () => {
    const l = generateLayout(base());
    const tf = (s: string) => [...s.matchAll(/transform="translate[^"]*"/g)].map(m => m[0]);
    expect(tf(buildSvg(l, opts(QUICK_PALETTES[0].colors)))).toEqual(tf(buildSvg(l, opts(QUICK_PALETTES[1].colors))));
    expect(buildSvg(l, opts(QUICK_PALETTES[0].colors))).not.toEqual(buildSvg(l, opts(QUICK_PALETTES[1].colors)));
  });
  it('edge instances get wrapped copies', () => {
    const l = generateLayout(base());
    const svg = buildSvg({ ...l, instances: [{ ...l.instances[0], x: 2, y: 500, s: 1 }] }, opts());
    expect(svg).toContain('translate(1002 500)');
    expect(svg).toContain('translate(2 500)');
  });
  it('svg has no raster, script or external refs', () => {
    const svg = buildSvg(generateLayout(base()), opts());
    expect(svg).not.toMatch(/<image|<script|href=|xlink/);
    expect(svg).toContain('viewBox="0 0 1000 1000"');
  });
});
