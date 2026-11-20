import { CATEGORIES } from '../../data/categories';
import { CATEGORY_CONFIG } from '../../data/categoryConfig';
import { ELEMENTS, ELEMENTS_BY_ID } from '../../data/elements';
import { CAT_KW } from '../metadata/build';
import { isHex } from '../color/harmony';
import { defaultProject, registerCustom, type Project } from '../project/store';
import { buildMotif } from './motif';
import type { PatternMode, Symmetry, VecElement } from '../../types';

export const MODELS = ['gemini-2.5-flash', 'gemini-3.5-flash', 'gemini-3.1-flash-lite', 'gemini-2.5-flash-lite'];
const MODES: PatternMode[] = ['grid', 'scattered', 'organic', 'structured', 'dense', 'minimal', 'mirror', 'halfdrop', 'brick'];
const SYMS: Symmetry[] = ['none', 'horizontal', 'vertical', 'both'];

export interface Spec {
  name?: string; summary?: string; categoryId: string; elements: string[]; customElements: VecElement[]; colors: string[]; background: string;
  mode: PatternMode; count: number; size: number; density: number; spacing: number; rotation: number; randomness: number; symmetry: Symmetry;
}

export const SYSTEM = `You are a pattern designer. Convert the user's description into JSON for a seamless vector pattern engine. Follow the description EXACTLY: every subject, colour, style and layout it names must appear, and nothing it excludes.
Return ONLY one JSON object with these keys:
- "summary": one sentence saying what you will make.
- "name": short title.
- "customElements": 2 to 6 motifs YOU DRAW with SVG paths, one for each distinct subject in the description (for example "bengal tiger", "bamboo", "lotus"). Always draw the named subjects yourself instead of approximating them with library shapes.
  Each motif: {"name": string, "parts": [{"d": path, "role": "primary"|"secondary"|"accent"|"line", "mirror": boolean}]}.
  Drawing rules: flat vector style, clear recognisable silhouette, 3 to 10 parts layered back to front (big body shapes first, details on top). Any coordinates are fine, they are rescaled, but keep one consistent coordinate system and y points DOWN.
  Allowed path commands only: M L H V C S Q T A Z. Filled shapes must be closed with Z. role "line" is an outline stroke with no fill (use for veins, stems, whiskers). "mirror": true adds a left-right mirrored copy, so draw only the right half of symmetric things. primary/secondary/accent are filled with palette colours.
- "elements": 0 to 4 ids of simple FILLER shapes from this library, only if the description wants fillers (dots, leaves, stars): ${ELEMENTS.map(e => e.id).join(', ')}. Use [] otherwise.
- "categoryId": best fit from: ${CATEGORIES.map(c => c.id).join(', ')}.
- "colors": exactly 4 HEX motif colours; "background": 1 HEX colour. Use any colours the description names or gives as HEX EXACTLY.
- "mode" one of ${MODES.join(', ')}; "count" 8-120; "size" 40-200; "density" 0-100; "spacing" 0.5-2; "rotation" 0-180 (max random tilt; use 0 for upright); "randomness" 0-100; "symmetry" one of ${SYMS.join(', ')}.`;

const num = (v: unknown, lo: number, hi: number, d: number) => (typeof v === 'number' && isFinite(v) ? Math.min(hi, Math.max(lo, v)) : d);
const hexesIn = (t: string) => [...new Set((t.match(/#[0-9a-fA-F]{6}\b/g) ?? []).map(h => h.toLowerCase()))];

/** Validate and clamp a model reply. Throws a readable Error when unusable. */
export function parseSpec(text: string): Spec {
  const m = text.replace(/```(?:json)?/gi, '').match(/\{[\s\S]*\}/);
  if (!m) throw new Error('AI reply had no JSON.');
  let o: Record<string, unknown>;
  try { o = JSON.parse(m[0]); } catch { throw new Error('AI reply was not valid JSON.'); }
  const categoryId = CATEGORIES.some(c => c.id === o.categoryId) ? (o.categoryId as string) : 'geometric';
  const cfg = CATEGORY_CONFIG[categoryId];
  const lib = [...new Set((Array.isArray(o.elements) ? o.elements : []).filter((e): e is string => typeof e === 'string' && !!ELEMENTS_BY_ID[e] && !e.startsWith('ai-')))].slice(0, 4);
  const custom = (Array.isArray(o.customElements) ? o.customElements : []).slice(0, 6).map(buildMotif).filter((e): e is VecElement => !!e);
  const cols = (Array.isArray(o.colors) ? o.colors : []).filter((c): c is string => typeof c === 'string' && isHex(c));
  const pool = [...custom.map(c => c.id), ...lib];
  return {
    name: typeof o.name === 'string' ? o.name.slice(0, 60) : undefined, summary: typeof o.summary === 'string' ? o.summary.slice(0, 300) : undefined, categoryId,
    elements: pool.length ? pool : cfg.elements, customElements: custom,
    colors: cols.slice(0, 4), background: typeof o.background === 'string' && isHex(o.background) ? o.background : '',
    mode: MODES.includes(o.mode as PatternMode) ? (o.mode as PatternMode) : cfg.mode,
    count: num(o.count, 8, 120, cfg.count), size: num(o.size, 30, 200, cfg.size), density: num(o.density, 0, 100, cfg.density),
    spacing: num(o.spacing, 0.5, 2, cfg.spacing), rotation: num(o.rotation, 0, 180, cfg.rotation), randomness: num(o.randomness, 0, 100, cfg.randomness),
    symmetry: SYMS.includes(o.symmetry as Symmetry) ? (o.symmetry as Symmetry) : 'none',
  };
}

/** HEX colours typed in the prompt always win over whatever the model chose. */
export function forceHex(prompt: string, spec: Spec): Spec {
  const hex = hexesIn(prompt);
  if (!hex.length) return spec;
  const colors = [...new Set([...hex.slice(0, 4), ...spec.colors])].slice(0, 4);
  return { ...spec, colors, background: hex.length >= 5 ? hex[4] : spec.background };
}

/** No-AI fallback: match words in the prompt against categories, library elements and #hex colours. */
export function localSpec(prompt: string): Spec {
  const t = prompt.toLowerCase();
  const score = (id: string) => [...(CAT_KW[id] ?? []), ...(CATEGORIES.find(c => c.id === id)?.name.toLowerCase().split(/[^a-z]+/) ?? [])]
    .filter(w => w.length > 2 && t.includes(w)).length;
  const best = CATEGORIES.map(c => ({ id: c.id, s: score(c.id) })).sort((a, b) => b.s - a.s)[0];
  const categoryId = best.s > 0 ? best.id : 'geometric';
  const hit = ELEMENTS.filter(e => t.includes(e.id) || t.includes(e.name.toLowerCase())).map(e => e.id);
  const cfg = CATEGORY_CONFIG[categoryId];
  return forceHex(prompt, {
    categoryId, elements: hit.length ? hit.slice(0, 10) : cfg.elements, customElements: [], colors: [], background: '',
    mode: cfg.mode, count: cfg.count, size: cfg.size, density: cfg.density, spacing: cfg.spacing, rotation: cfg.rotation, randomness: cfg.randomness, symmetry: 'none',
  });
}

export function specToProject(spec: Spec, seed: number, name: string): Project {
  registerCustom(spec.customElements);
  const base = defaultProject(spec.categoryId, undefined, seed);
  const colors = [...base.colors];
  spec.colors.forEach((c, i) => { colors[i] = c; });
  for (let i = spec.colors.length; spec.colors.length && i < 4; i++) colors[i] = spec.colors[i % spec.colors.length];
  colors[4] = spec.background || base.bg;
  const { count, size, density, spacing, rotation, randomness, mode, symmetry, elements } = spec;
  return { ...base, name: spec.name || name, colors, bg: colors[4], customElements: spec.customElements, settings: { ...base.settings, count, size, density, spacing, rotation, randomness, mode, symmetry, elements } };
}

export interface Turn { role: 'user' | 'model'; text: string; }
export interface AiResult { spec: Spec; raw: string; model: string; }

async function callOnce(key: string, model: string, turns: Turn[]): Promise<string> {
  let res: Response;
  try {
    res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`, {
      method: 'POST', headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: SYSTEM }] },
        contents: turns.map(t => ({ role: t.role, parts: [{ text: t.text }] })),
        generationConfig: { responseMimeType: 'application/json', temperature: 0.6, maxOutputTokens: 16384 },
      }),
    });
  } catch { throw Object.assign(new Error('Network error. Check your internet connection.'), { fatal: true }); }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const m = data?.error?.message ?? res.statusText;
    if (res.status === 400 || res.status === 401 || res.status === 403) throw Object.assign(new Error('Key rejected: ' + m), { fatal: true });
    throw new Error(res.status === 429 ? `Quota used up on ${model}. ${m}` : res.status === 404 ? `Model "${model}" not found.` : `Gemini error ${res.status}: ${m}`);
  }
  const parts: { text?: string; thought?: boolean }[] = data?.candidates?.[0]?.content?.parts ?? [];
  const text = parts.filter(p => !p.thought).map(p => p.text ?? '').join('');
  if (!text) throw new Error('Gemini returned no answer (maybe blocked).');
  return text;
}

/** Tries the chosen model first, then the other models, until one gives a usable answer. */
export async function askGemini(key: string, model: string, prompt: string, history: Turn[] = []): Promise<AiResult> {
  const turns: Turn[] = [...history, { role: 'user', text: prompt }];
  const order = [model, ...MODELS.filter(m => m !== model)];
  let last = new Error('No model answered.');
  for (const m of order) {
    try {
      const raw = await callOnce(key, m, turns);
      const all = turns.filter(t => t.role === 'user').map(t => t.text).join('\n');
      return { spec: forceHex(all, parseSpec(raw)), raw, model: m };
    } catch (e) { last = e as Error; if ((e as { fatal?: boolean }).fatal) break; }
  }
  throw last;
}
