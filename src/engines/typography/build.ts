import { buildMotif } from '../ai/motif';
import { QUICK_PALETTES } from '../../data/palettes';
import { defaultProject, registerCustom, type Project } from '../project/store';
import { glyphPaths, GLYPH_H, hasGlyph, wordWidth } from './glyphs';
import type { VecElement } from '../../types';

export interface TypoOpts { text: string; mode: 'words' | 'letters'; weight: number; size: number; layout: 'halfdrop' | 'brick' | 'grid'; paletteId: string; filler: boolean; }

export const cleanWords = (t: string): string[] =>
  t.toUpperCase().split(/[\s,;\n]+/).map(w => [...w].filter(hasGlyph).join('').slice(0, 14)).filter(Boolean).slice(0, 6);

/** One motif from a word: all its strokes laid out left to right as line parts. */
export function wordMotif(word: string, ink: string, weight: number): VecElement | null {
  const wd = wordWidth(word.length), w = Math.min(4, Math.max(0.25, weight * 0.02 * ((94 * GLYPH_H) / Math.max(wd, GLYPH_H))));
  const parts = [...word].flatMap((ch, i) => glyphPaths(ch, i).map(d => ({ d, role: 'line', stroke: ink, w })));
  return buildMotif({ name: word, parts }, true);
}

export function typographyProject(o: TypoOpts, seed = 1): Project {
  const pal = QUICK_PALETTES.find(p => p.id === o.paletteId) ?? QUICK_PALETTES[0];
  const ink = pal.colors[0];
  const words = cleanWords(o.text);
  const items = o.mode === 'words' ? words : [...new Set(words.join('').split(''))];
  const motifs = items.map(t => wordMotif(t, ink, o.weight)).filter((e): e is VecElement => !!e);
  if (!motifs.length) throw new Error('Type some letters or numbers (A-Z, 0-9, + ! & ♥).');
  registerCustom(motifs);
  const base = defaultProject('typography', pal.id, seed);
  const spec: Record<string, { size: number; weight: number }> = {};
  const wide = (t: string) => Math.max(wordWidth(t.length), GLYPH_H), maxW = Math.max(...items.map(wide));
  motifs.forEach((m, i) => { spec[m.id] = { size: o.mode === 'words' ? o.size * (wide(items[i]) / maxW) : o.size * 0.45, weight: 2 }; });
  const ids = motifs.map(m => m.id);
  if (o.filler) { ids.push('lux-sparkle'); spec['lux-sparkle'] = { size: 4, weight: 2 }; }
  return {
    ...base, name: `typo-${words.join('-').slice(0, 16)}`, customElements: motifs,
    settings: { ...base.settings, mode: o.layout, rotation: 0, randomness: 10, density: 45, spacing: 1, size: 100, count: 30, elements: ids, elementSpec: spec },
  };
}
