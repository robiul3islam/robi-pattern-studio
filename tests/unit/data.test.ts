import { describe, it, expect } from 'vitest';
import { CATEGORIES } from '../../src/data/categories';
import { QUICK_PALETTES } from '../../src/data/palettes';
import { NAV } from '../../src/app/nav';
describe('foundation data', () => {
  it('has 34 unique categories', () => {
    expect(CATEGORIES).toHaveLength(34);
    expect(new Set(CATEGORIES.map(c => c.id)).size).toBe(34);
  });
  it('palettes have valid hex colors', () => {
    for (const p of QUICK_PALETTES) for (const c of p.colors) expect(c).toMatch(/^#[0-9a-f]{6}$/i);
  });
  it('nav has 15 sidebar items', () => expect(NAV).toHaveLength(15));
});
