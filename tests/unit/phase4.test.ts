import { describe, expect, it } from 'vitest';
import { contrast, harmony, hexToHsl, hslToHex, isHex } from '../../src/engines/color/harmony';
import { buildPrompt, defaultInput } from '../../src/engines/prompt/build';

describe('color', () => {
  it('round-trips hex via hsl', () => {
    for (const h of ['#ff6b5e', '#14b8a6', '#111827']) {
      const [a, b, c] = hexToHsl(h); expect(hslToHex(a, b, c)).toBe(h);
    }
  });
  it('validates hex', () => { expect(isHex('#abcdef')).toBe(true); expect(isHex('abc')).toBe(false); });
  it('complementary is 2 colors, tetradic 4', () => {
    expect(harmony('#ff0000', 'complementary')).toEqual(['#ff0000', '#00ffff']);
    expect(harmony('#ff0000', 'tetradic')).toHaveLength(4);
  });
  it('contrast black/white is 21', () => { expect(contrast('#000000', '#ffffff')).toBeCloseTo(21, 0); });
});

describe('prompt', () => {
  it('includes category, elements, colors', () => {
    const i = { ...defaultInput('tropical'), colors: ['#ff6b5e'] };
    const { prompt, negative } = buildPrompt(i);
    expect(prompt).toContain('tropical pattern'); expect(prompt).toContain('monstera'); expect(prompt).toContain('#ff6b5e');
    expect(negative).toContain('watermark');
  });
  it('midjourney adds --tile and no separate negative', () => {
    const r = buildPrompt({ ...defaultInput('geometric'), platform: 'midjourney' });
    expect(r.prompt).toContain('--tile'); expect(r.negative).toBe('');
  });
});
