import { describe, it, expect } from 'vitest';
import { CATEGORIES } from '../../src/data/categories';
import { QUICK_PALETTES } from '../../src/data/palettes';
import { generateLayout } from '../../src/engines/pattern/generate';
import { buildSvg } from '../../src/engines/vector/buildSvg';
import { validateSeamless } from '../../src/engines/seamless/validate';
import { groupBounds } from '../../src/engines/geometry/bounds';
import type { LayoutSettings, PatternMode } from '../../src/types';

const base = (o: Partial<LayoutSettings> = {}): LayoutSettings => ({
  categoryId: 'tropical', mode: 'scattered', count: 30, size: 100, density: 50, spacing: 1, rotation: 90, randomness: 40,
  symmetry: 'none', w: 1000, h: 1000, seed: 5, ...o,
});
const opts = { colors: QUICK_PALETTES[0].colors, bg: '#fff', outline: '#000' };
const MODES: PatternMode[] = ['grid', 'scattered', 'organic', 'structured', 'dense', 'minimal', 'mirror', 'halfdrop', 'brick'];
const svgOf = (o: Partial<LayoutSettings> = {}) => { const s = base(o); return buildSvg(generateLayout(s), opts); };

describe('geometry', () => {
  it('circle bounds are exact', () => {
    const b = groupBounds('circle', 'translate(100 100) rotate(0) scale(1 1)');
    expect(b.minX).toBeCloseTo(60, 0); expect(b.maxX).toBeCloseTo(140, 0);
  });
  it('arc and curve bounds are sane', () => {
    const b = groupBounds('halfcircle', 'translate(0 0) rotate(0) scale(1 1)');
    expect(b.minX).toBeCloseTo(-46, 0); expect(b.maxX).toBeCloseTo(46, 0); expect(b.minY).toBeLessThan(-20);
  });
});

describe('seamless validator', () => {
  it('passes for every category x mode x symmetry sample, non-square tiles', () => {
    for (const c of CATEGORIES) for (const mode of MODES) {
      const symmetry = (['none', 'horizontal', 'vertical', 'both'] as const)[(c.id.length + mode.length) % 4];
      const o = { categoryId: c.id, mode, symmetry, w: 1200, h: 800, seed: c.id.length * 7 };
      const r = validateSeamless(svgOf(o), 1200, 800);
      expect(r.errors, `${c.id}/${mode}`).toEqual([]);
      expect(r.ok).toBe(true);
    }
  });
  it('actually exercises edge elements', () => {
    const r = validateSeamless(svgOf({ size: 160 }), 1000, 1000);
    expect(r.edgeGroups).toBeGreaterThan(3); expect(r.checkedCopies).toBeGreaterThan(5);
  });
  it('FAILS when a wrapped copy is removed', () => {
    const svg = svgOf({ size: 160 });
    const copy = svg.match(/<g id="e\d+_\d\d"[^>]*>.*?<\/g>/)![0];
    const r = validateSeamless(svg.replace(copy, ''), 1000, 1000);
    expect(r.ok).toBe(false); expect(r.errors.join()).toMatch(/Seam break/);
  });
  it('FAILS when a wrapped copy is misplaced', () => {
    const svg = svgOf({ size: 160 });
    const copy = svg.match(/<g id="e\d+_\d\d"[^>]*>.*?<\/g>/)![0];
    const bad = copy.replace(/translate\(([-\d.]+) /, (_, x) => `translate(${+x + 6} `);
    expect(validateSeamless(svg.replace(copy, bad), 1000, 1000).ok).toBe(false);
  });
  it('FAILS when the clip path or viewBox is wrong', () => {
    const svg = svgOf();
    expect(validateSeamless(svg.replace('clip-path="url(#tile)"', ''), 1000, 1000).ok).toBe(false);
    expect(validateSeamless(svg.replace('viewBox="0 0 1000 1000"', 'viewBox="0 0 999 1000"'), 1000, 1000).ok).toBe(false);
  });
  it('fails on an SVG with no elements', () => {
    expect(validateSeamless('<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 10 10"/>', 10, 10).ok).toBe(false);
  });
});
