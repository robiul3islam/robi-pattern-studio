import { describe, expect, it } from 'vitest';
import { allCategories, defaultProject, renderSvg, setCustomPalette, variations } from '../../src/engines/project/store';
import { checkQuality } from '../../src/engines/quality/check';
import { buildMetadata, colorName, SITES } from '../../src/engines/metadata/build';
import { pngSize } from '../../src/engines/export/png';
import { CATEGORIES } from '../../src/data/categories';
import { QUICK_PALETTES } from '../../src/data/palettes';
import { TRENDS } from '../../src/data/trends';

describe('project', () => {
  it('renders same svg for same project', () => { const p = defaultProject('tropical'); expect(renderSvg(p)).toBe(renderSvg(p)); });
  it('variations change seed only', () => {
    const p = defaultProject('geometric'); const v = variations(p, 3);
    expect(v.map(x => x.settings.seed)).toEqual([2, 3, 4]); expect(v[0].colors).toEqual(p.colors);
  });
  it('all categories render', () => { for (const p of allCategories(CATEGORIES.map(c => c.id))) expect(renderSvg(p)).toContain('<svg'); });
  it('custom palette has 5 colours', () => {
    setCustomPalette(['#ff0000', '#00ff00']); const c = QUICK_PALETTES.find(p => p.id === 'custom')!;
    expect(c.colors).toHaveLength(5); expect(c.colors[4]).toBe('#ffffff');
    setCustomPalette(['#111111']); expect(QUICK_PALETTES.filter(p => p.id === 'custom')).toHaveLength(1);
  });
  it('trends reference real categories and palettes', () => {
    for (const t of TRENDS) { expect(CATEGORIES.some(c => c.id === t.categoryId)).toBe(true); expect(QUICK_PALETTES.some(p => p.id === t.paletteId)).toBe(true); }
  });
});

describe('quality', () => {
  it('generated tile passes seamless check', () => {
    const p = defaultProject('tropical'); const r = checkQuality(renderSvg(p), 1000, 1000);
    expect(r.checks.find(c => c.id === 'seamless')!.status).not.toBe('fail'); expect(r.score).toBeGreaterThan(0);
  });
  it('fails text nodes', () => {
    const r = checkQuality('<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 10 10"><text>x</text></svg>', 10, 10);
    expect(r.checks.find(c => c.id === 'clean')!.status).toBe('fail');
  });
});

describe('metadata', () => {
  it('respects site limits, no duplicate keywords', () => {
    for (const site of Object.keys(SITES) as (keyof typeof SITES)[]) {
      const m = buildMetadata({ categoryId: 'tropical', elementIds: ['monstera', 'palm', 'hibiscus'], colors: ['#ff6b5e', '#14b8a6', '#facc15', '#22c55e'] }, site);
      expect(m.title.length).toBeLessThanOrEqual(SITES[site].title); expect(m.keywords.length).toBeLessThanOrEqual(SITES[site].kw);
      expect(new Set(m.keywords).size).toBe(m.keywords.length); expect(m.keywords).toContain('tropical');
    }
  });
  it('names colours', () => { expect(colorName('#ffffff')).toBe('white'); expect(colorName('#000000')).toBe('black'); expect(colorName('#00ff00')).toBe('green'); });
});

describe('png size', () => {
  it('caps at 8000px', () => { expect(pngSize(1000, 1000, 2)).toEqual({ w: 2000, h: 2000 }); expect(pngSize(4000, 4000, 8).w).toBe(8000); });
});

import { localSpec, parseSpec, specToProject } from '../../src/engines/ai/gemini';
describe('ai', () => {
  it('parses fenced JSON and clamps/filters', () => {
    const s = parseSpec('```json\n{"categoryId":"seasonal-holiday","elements":["snowflake","nope","pine"],"colors":["#ff0000","bad","#00ff00"],"background":"#fff5e1","mode":"zzz","count":9999,"size":1}\n```');
    expect(s.elements).toEqual(['snowflake', 'pine']); expect(s.colors).toEqual(['#ff0000', '#00ff00']);
    expect(s.count).toBe(120); expect(s.size).toBe(30); expect(s.mode).toBeTruthy(); expect(s.background).toBe('#fff5e1');
  });
  it('rejects non-JSON', () => { expect(() => parseSpec('sorry')).toThrow(); });
  it('falls back to category defaults on bad category/elements', () => {
    const s = parseSpec('{"categoryId":"x","elements":[]}'); expect(s.categoryId).toBe('geometric'); expect(s.elements.length).toBeGreaterThan(0);
  });
  it('local spec: christmas prompt picks holiday + hex colours', () => {
    const s = localSpec('christmas pattern with holly, colors #b91c1c #166534'); expect(s.categoryId).toBe('seasonal-holiday');
    expect(s.elements).toContain('holly'); expect(s.colors).toEqual(['#b91c1c', '#166534']);
  });
  it('spec renders with custom elements and 5 colours', () => {
    const p = specToProject(localSpec('snowflake and pine'), 5, 'x');
    expect(p.colors).toHaveLength(5); expect(p.settings.elements).toEqual(expect.arrayContaining(['snowflake', 'pine']));
    const svg = renderSvg(p); expect(svg).toContain('data-element="snowflake"'); expect(svg).not.toContain('data-element="pumpkin"');
  });
});
