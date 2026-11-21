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
  name?: string; summary?: string; categoryId: string; elements: string[]; customElements: VecElement[]; elementSpec: Record<string, { size: number; weight: number }>; colors: string[]; background: string;
  mode: PatternMode; count: number; size: number; density: number; spacing: number; rotation: number; randomness: number; symmetry: Symmetry;
}

const EXAMPLE = `{"name":"Gift box","size":26,"weight":3,"parts":[{"d":"M-48,-14 H48 V34 H-48 Z","fill":"#c9444a"},{"d":"M-48,-14 H48 V-4 H-48 Z","fill":"#a8363c"},{"d":"M-7,-14 H7 V34 H-7 Z","fill":"#f4e4c1"},{"d":"M0,-14 C-30,-52 -52,-30 0,-14 Z","fill":"#f4e4c1","mirror":true},{"d":"M-48,-14 H48","role":"line","stroke":"#8f2b30","w":0.8}]}`;

export const SYSTEM = `You are a professional surface-pattern designer making seamless wrapping-paper / textile tiles in the style of modern flat vector stock illustration. Convert the user's description (and the reference image, if one is attached) into JSON for a pattern engine. Reproduce the description EXACTLY: every subject, colour, mood and arrangement it names, and nothing it excludes. If an image is attached, copy its look: same kinds of motifs, same palette, same background, same density and arrangement.
Return ONLY one JSON object with these keys:
- "summary": one sentence describing what you will make.
- "name": short title.
- "customElements": 5 to 10 motifs that YOU DRAW with SVG paths. Include 3 to 6 HERO motifs (the main subjects named in the description, size 18 to 34) and 2 to 4 tiny FILLER motifs (stars, hearts, sparkles, dots, small leaves; size 3 to 7). Always draw the named subjects yourself, never approximate them.
  Each motif: {"name": string, "size": number (its largest dimension as % of the tile width), "weight": 1-4 (how often it repeats), "parts": [...]}.
  Each part: {"d": path, "fill": "#rrggbb", "mirror": boolean} or an outline {"d": path, "role": "line", "stroke": "#rrggbb", "w": 0.5-2}.
  Quality rules: give EVERY filled part its own explicit fill HEX. Build depth with tones: a base colour, a darker shade for shadow sides and a lighter tint for highlights. Add the details that make the subject recognisable (ribbon stripes, dots, stars, veins, folds). Use 8 to 20 parts per hero motif, layered back to front. Thin darker outline parts (role "line") are welcome. "mirror": true adds a left-right mirrored copy, so draw only the right half of symmetric shapes. Colours must come from the description's palette plus its darker and lighter tones.
  Path rules: allowed commands M L H V C S Q T A Z only, each path under 500 characters, filled shapes closed with Z, y points DOWN, one consistent coordinate system per motif (any scale: it is auto-fitted and centred).
  Example of one hero motif: ${EXAMPLE}
- "elements": [] (library ids are optional fillers; use [] unless the description asks for simple library shapes). Library ids: ${ELEMENTS.map(e => e.id).join(', ')}.
- "categoryId": best fit from: ${CATEGORIES.map(c => c.id).join(', ')}.
- "colors": exactly 4 HEX palette colours and "background": 1 HEX. Use any colours the description gives EXACTLY.
- "mode": "halfdrop" | "brick" | "grid" (arrangement of the hero motifs; default halfdrop); "spacing" 0.9-1.4 (1 = tight); "density" 0-100 (how many fillers; 50 normal); "rotation" 0-15 (max random tilt in degrees, 0 = upright); "randomness" 0-60.`;

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
  const custom: VecElement[] = [], elementSpec: Spec['elementSpec'] = {};
  for (const raw of (Array.isArray(o.customElements) ? o.customElements : []).slice(0, 10)) {
    const e = buildMotif(raw); if (!e) continue;
    custom.push(e); elementSpec[e.id] = { size: num((raw as Record<string, unknown>).size, 2, 45, 20), weight: Math.round(num((raw as Record<string, unknown>).weight, 1, 4, 2)) };
  }
  for (const id of lib) elementSpec[id] = { size: 4, weight: 2 };
  const cols = (Array.isArray(o.colors) ? o.colors : []).filter((c): c is string => typeof c === 'string' && isHex(c));
  const pool = [...custom.map(c => c.id), ...lib];
  return {
    name: typeof o.name === 'string' ? o.name.slice(0, 60) : undefined, summary: typeof o.summary === 'string' ? o.summary.slice(0, 300) : undefined, categoryId,
    elements: pool.length ? pool : cfg.elements, customElements: custom, elementSpec,
    colors: cols.slice(0, 4), background: typeof o.background === 'string' && isHex(o.background) ? o.background : '',
    mode: MODES.includes(o.mode as PatternMode) ? (o.mode as PatternMode) : custom.length ? 'halfdrop' : cfg.mode,
    count: num(o.count, 8, 120, cfg.count), size: num(o.size, 30, 200, cfg.size), density: num(o.density, 0, 100, cfg.density),
    spacing: num(o.spacing, 0.5, 2, custom.length ? 1 : cfg.spacing), rotation: num(o.rotation, 0, 180, custom.length ? 6 : cfg.rotation), randomness: num(o.randomness, 0, 100, custom.length ? 25 : cfg.randomness),
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
    categoryId, elements: hit.length ? hit.slice(0, 10) : cfg.elements, customElements: [], elementSpec: {}, colors: [], background: '',
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
  const { count, size, density, spacing, rotation, randomness, mode, symmetry, elements, elementSpec } = spec;
  return { ...base, name: spec.name || name, colors, bg: colors[4], customElements: spec.customElements, settings: { ...base.settings, count: Object.keys(elementSpec).length ? 30 : count, size: Object.keys(elementSpec).length ? 100 : size, density, spacing, rotation, randomness, mode, symmetry, elements, elementSpec: Object.keys(elementSpec).length ? elementSpec : undefined } };
}

export interface Turn { role: 'user' | 'model'; text: string; image?: { mime: string; data: string }; }
export interface AiResult { spec: Spec; raw: string; model: string; }

async function callOnce(key: string, model: string, turns: Turn[]): Promise<string> {
  let res: Response;
  try {
    res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`, {
      method: 'POST', headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: SYSTEM }] },
        contents: turns.map(t => ({ role: t.role, parts: [...(t.image ? [{ inlineData: { mimeType: t.image.mime, data: t.image.data } }] : []), { text: t.text }] })),
        generationConfig: { responseMimeType: 'application/json', temperature: 0.6, maxOutputTokens: 32768 },
      }),
      signal: AbortSignal.timeout(150000),
    });
  } catch (e) { throw Object.assign(new Error((e as Error).name === 'TimeoutError' ? 'Gemini took too long (150s). Try again.' : 'Network error. Check your internet connection.'), { fatal: (e as Error).name !== 'TimeoutError' }); }
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
export async function askGemini(key: string, model: string, prompt: string, history: Turn[] = [], image?: Turn['image']): Promise<AiResult> {
  const turns: Turn[] = [...history, { role: 'user', text: prompt, image }];
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
