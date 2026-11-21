import { describe, expect, it } from 'vitest';
import { allCategories, defaultProject, layoutOf, renderSvg, setCustomPalette, variations } from '../../src/engines/project/store';
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

import { buildMotif } from '../../src/engines/ai/motif';
import { forceHex } from '../../src/engines/ai/gemini';
import { validateSeamless } from '../../src/engines/seamless/validate';
describe('ai motifs', () => {
  const tiger = { name: 'Tiger Head', parts: [
    { d: 'M200,300 C100,300 80,200 150,150 C180,120 220,120 250,150 C320,200 300,300 200,300 Z', role: 'primary' },
    { d: 'M150,200 L170,230 L190,200 Z', role: 'secondary', mirror: true }, { d: 'M200,220 V260', role: 'line' } ] };
  it('normalises into +-50 box', () => {
    const e = buildMotif(tiger)!; expect(e).toBeTruthy(); expect(e.parts.length).toBe(4);
    const p = defaultProject('geometric'); p.customElements = [e]; p.settings = { ...p.settings, elements: [e.id] };
    const svg = renderSvg(p); expect(svg).toContain(`data-element="${e.id}"`);
    expect(validateSeamless(svg, 1000, 1000).ok).toBe(true);
  });
  it('rejects unsafe or broken paths', () => {
    expect(buildMotif({ name: 'x', parts: [{ d: 'M0,0 L10,10" onload="x', role: 'primary' }] })).toBeNull();
    expect(buildMotif({ name: 'x', parts: [{ d: 'M0,0 L0,0 Z', role: 'primary' }] })).toBeNull();
    expect(buildMotif({ name: 'x', parts: [{ d: 'M0,0 L10,10', role: 'line' }] })).toBeNull();
  });
  it('prompt hex colours override model colours', () => {
    const s = forceHex('use #ff0000 #00ff00 #0000ff #ffff00 on #123456', { ...localSpec('x'), colors: ['#111111'], background: '#fff' });
    expect(s.colors).toEqual(['#ff0000', '#00ff00', '#0000ff', '#ffff00']); expect(s.background).toBe('#123456');
  });
});

describe('composed layout', () => {
  const gift = buildMotif({ name: 'Gift', parts: [{ d: 'M-48,-14 H48 V34 H-48 Z', fill: '#c9444a' }, { d: 'M-7,-14 H7 V34 H-7 Z', fill: '#f4e4c1' }] })!;
  const star = buildMotif({ name: 'Star', parts: [{ d: 'M0,-10 L3,-3 L10,-3 L4,2 L6,9 L0,5 L-6,9 L-4,2 L-10,-3 L-3,-3 Z', fill: '#f2b84b' }] })!;
  it('big heroes on lattice + fillers, fixed colours, seamless', () => {
    const p = defaultProject('seasonal-holiday', undefined, 3);
    p.customElements = [gift, star];
    p.settings = { ...p.settings, elements: [gift.id, star.id], mode: 'halfdrop', rotation: 5, randomness: 20, elementSpec: { [gift.id]: { size: 26, weight: 2 }, [star.id]: { size: 4, weight: 2 } } };
    const lay = layoutOf(p);
    const heroes = lay.instances.filter(i => i.el === gift.id), fill = lay.instances.filter(i => i.el === star.id);
    expect(heroes.length).toBeGreaterThanOrEqual(6); expect(fill.length).toBeGreaterThan(3);
    expect(lay.instances.map(i => i.n)).toEqual(lay.instances.map((_, i) => i));
    const svg = renderSvg(p); expect(svg).toContain('fill="#c9444a"'); expect(svg).toContain('fill="#f2b84b"');
    expect(validateSeamless(svg, 1000, 1000).ok).toBe(true);
    expect(renderSvg(p)).toBe(svg);
  });
});

import { BG_TYPES } from '../../src/engines/vector/bgPattern';
import { ELEMENTS } from '../../src/data/elements';
import { groupBounds } from '../../src/engines/geometry/bounds';
import { typographyProject, cleanWords } from '../../src/engines/typography/build';
describe('new features', () => {
  it('every element has finite bounds inside ~+-60', () => {
    for (const e of ELEMENTS) { const b = groupBounds(e.id, 'scale(1)'); for (const v of [b.minX, b.maxX, b.minY, b.maxY]) { expect(isFinite(v)).toBe(true); expect(Math.abs(v)).toBeLessThan(64); } }
  });
  it('line-art and luxury categories render seamlessly', () => {
    for (const c of ['line-art', 'art-deco-luxury', 'typography']) { const svg = renderSvg(defaultProject(c)); expect(validateSeamless(svg, 1000, 1000).ok).toBe(true); }
  });
  it('every background texture renders and keeps the seam valid', () => {
    for (const t of BG_TYPES) {
      const p = { ...defaultProject('geometric'), bgPattern: { type: t, color: '#888888', opacity: 0.2, scale: 8 } };
      const svg = renderSvg(p); expect(svg).toContain('id="bgpattern"'); expect(svg).not.toContain('NaN'); expect(validateSeamless(svg, 1000, 1000).ok).toBe(true);
    }
  });
  it('typography: words become line motifs, seamless', () => {
    expect(cleanWords('hello, world!? ok')).toEqual(['HELLO', 'WORLD!', 'OK']);
    for (const mode of ['words', 'letters'] as const) {
      const p = typographyProject({ text: 'LUXE ATELIER 24', mode, weight: 1.4, size: 30, layout: 'halfdrop', paletteId: 'gold-1', filler: true }, 4);
      const svg = renderSvg(p); expect(svg).toContain('data-element="ai-'); expect(validateSeamless(svg, 1000, 1000).ok).toBe(true);
    }
    expect(() => typographyProject({ text: '???', mode: 'words', weight: 1, size: 30, layout: 'grid', paletteId: 'gold-1', filler: false })).toThrow();
  });
  it('AI-style projects respond to the size, count and mode controls', () => {
    const p = typographyProject({ text: 'AB', mode: 'words', weight: 1, size: 20, layout: 'halfdrop', paletteId: 'gold-1', filler: true }, 2);
    const at = (o: object) => layoutOf({ ...p, settings: { ...p.settings, ...o } });
    const big = (o: object) => Math.max(...at(o).instances.map(i => i.s));
    expect(big({ size: 60 })).toBeLessThan(big({ size: 140 }));
    expect(at({ count: 10 }).instances.length).toBeLessThan(at({ count: 90 }).instances.length);
    expect(at({ mode: 'scattered' }).instances.length).toBeGreaterThan(2);
  });
});
