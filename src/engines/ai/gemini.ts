import { CATEGORIES } from '../../data/categories';
import { CATEGORY_CONFIG } from '../../data/categoryConfig';
import { ELEMENTS, ELEMENTS_BY_ID } from '../../data/elements';
import { CAT_KW } from '../metadata/build';
import { isHex } from '../color/harmony';
import { defaultProject, type Project } from '../project/store';
import type { PatternMode, Symmetry } from '../../types';

export const MODELS = ['gemini-2.5-flash', 'gemini-2.5-flash-lite', 'gemini-3.1-flash-lite', 'gemini-3.5-flash'];
const MODES: PatternMode[] = ['grid', 'scattered', 'organic', 'structured', 'dense', 'minimal', 'mirror', 'halfdrop', 'brick'];
const SYMS: Symmetry[] = ['none', 'horizontal', 'vertical', 'both'];

export interface Spec {
  name?: string; categoryId: string; elements: string[]; colors: string[]; background: string;
  mode: PatternMode; count: number; size: number; density: number; spacing: number; rotation: number; randomness: number; symmetry: Symmetry;
}

export const SYSTEM = `You turn a text description of a seamless textile / surface pattern into JSON settings for a vector pattern engine.
Return ONLY one JSON object, no prose, with these keys:
name (short string), categoryId (one of: ${CATEGORIES.map(c => c.id).join(', ')}),
elements (3 to 10 ids chosen ONLY from this list: ${ELEMENTS.map(e => e.id).join(', ')}),
colors (exactly 4 HEX colours like #aabbcc for the motifs), background (1 HEX colour),
mode (one of: ${MODES.join(', ')}), count (8-120), size (30-200), density (0-100), spacing (0.5-2), rotation (0-180), randomness (0-100),
symmetry (one of: ${SYMS.join(', ')}).
Pick elements that fit the description, and colours that match any colours it mentions.`;

const num = (v: unknown, lo: number, hi: number, d: number) => (typeof v === 'number' && isFinite(v) ? Math.min(hi, Math.max(lo, v)) : d);

/** Validate and clamp a model reply. Throws a readable Error when unusable. */
export function parseSpec(text: string): Spec {
  const m = text.replace(/```(?:json)?/gi, '').match(/\{[\s\S]*\}/);
  if (!m) throw new Error('AI reply had no JSON.');
  let o: Record<string, unknown>;
  try { o = JSON.parse(m[0]); } catch { throw new Error('AI reply was not valid JSON.'); }
  const categoryId = CATEGORIES.some(c => c.id === o.categoryId) ? (o.categoryId as string) : 'geometric';
  const cfg = CATEGORY_CONFIG[categoryId];
  const els = (Array.isArray(o.elements) ? o.elements : []).filter((e): e is string => typeof e === 'string' && !!ELEMENTS_BY_ID[e]);
  const cols = (Array.isArray(o.colors) ? o.colors : []).filter((c): c is string => typeof c === 'string' && isHex(c));
  return {
    name: typeof o.name === 'string' ? o.name.slice(0, 60) : undefined, categoryId,
    elements: [...new Set(els)].slice(0, 10).length ? [...new Set(els)].slice(0, 10) : cfg.elements,
    colors: cols.slice(0, 4), background: typeof o.background === 'string' && isHex(o.background) ? o.background : '',
    mode: MODES.includes(o.mode as PatternMode) ? (o.mode as PatternMode) : cfg.mode,
    count: num(o.count, 8, 120, cfg.count), size: num(o.size, 30, 200, cfg.size), density: num(o.density, 0, 100, cfg.density),
    spacing: num(o.spacing, 0.5, 2, cfg.spacing), rotation: num(o.rotation, 0, 180, cfg.rotation), randomness: num(o.randomness, 0, 100, cfg.randomness),
    symmetry: SYMS.includes(o.symmetry as Symmetry) ? (o.symmetry as Symmetry) : 'none',
  };
}

/** No-AI fallback: match words in the prompt against categories, elements and #hex colours. */
export function localSpec(prompt: string): Spec {
  const t = prompt.toLowerCase();
  const score = (id: string) => [...(CAT_KW[id] ?? []), ...(CATEGORIES.find(c => c.id === id)?.name.toLowerCase().split(/[^a-z]+/) ?? [])]
    .filter(w => w.length > 2 && t.includes(w)).length;
  const best = CATEGORIES.map(c => ({ id: c.id, s: score(c.id) })).sort((a, b) => b.s - a.s)[0];
  const categoryId = best.s > 0 ? best.id : 'geometric';
  const hit = ELEMENTS.filter(e => t.includes(e.id) || t.includes(e.name.toLowerCase())).map(e => e.id);
  const hex = [...new Set((prompt.match(/#[0-9a-fA-F]{6}\b/g) ?? []).map(h => h.toLowerCase()))];
  const cfg = CATEGORY_CONFIG[categoryId];
  return {
    categoryId, elements: hit.length ? hit.slice(0, 10) : cfg.elements, colors: hex.slice(0, 4), background: '',
    mode: cfg.mode, count: cfg.count, size: cfg.size, density: cfg.density, spacing: cfg.spacing, rotation: cfg.rotation, randomness: cfg.randomness, symmetry: 'none',
  };
}

export function specToProject(spec: Spec, seed: number, name: string): Project {
  const base = defaultProject(spec.categoryId, undefined, seed);
  const colors = [...base.colors];
  spec.colors.forEach((c, i) => { colors[i] = c; });
  if (spec.colors.length && spec.colors.length < 4) for (let i = spec.colors.length; i < 4; i++) colors[i] = spec.colors[i % spec.colors.length];
  colors[4] = spec.background || base.bg;
  const { count, size, density, spacing, rotation, randomness, mode, symmetry, elements } = spec;
  return { ...base, name: spec.name || name, colors, bg: colors[4], settings: { ...base.settings, count, size, density, spacing, rotation, randomness, mode, symmetry, elements } };
}

export async function askGemini(key: string, model: string, prompt: string): Promise<Spec> {
  let res: Response;
  try {
    res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`, {
      method: 'POST', headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: SYSTEM }] },
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: { responseMimeType: 'application/json', temperature: 0.7 },
      }),
    });
  } catch { throw new Error('Network error. Check your internet connection.'); }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const m = data?.error?.message ?? res.statusText;
    if (res.status === 429) throw new Error('Free quota used up for now. Wait a minute or try another model. ' + m);
    if (res.status === 400 || res.status === 403) throw new Error('Key rejected or model not allowed: ' + m);
    if (res.status === 404) throw new Error(`Model "${model}" not found. Pick another model.`);
    throw new Error(`Gemini error ${res.status}: ${m}`);
  }
  const parts: { text?: string; thought?: boolean }[] = data?.candidates?.[0]?.content?.parts ?? [];
  const text = parts.filter(p => !p.thought).map(p => p.text ?? '').join('');
  if (!text) throw new Error('Gemini returned no answer (maybe blocked). Reword the prompt.');
  return parseSpec(text);
}
