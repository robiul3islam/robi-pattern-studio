import { flattenPath } from '../geometry/bounds';
import type { Part, Role, VecElement } from '../../types';

const ROLES: Role[] = ['primary', 'secondary', 'accent', 'line'];
const D_OK = /^[MmLlHhVvCcSsQqTtAaZz0-9eE.,\s+-]+$/;
export interface RawPart { d?: unknown; role?: unknown; mirror?: unknown; w?: unknown; fill?: unknown; stroke?: unknown; }
const HEX = /^#[0-9a-fA-F]{6}$/;
const hex = (v: unknown) => (typeof v === 'string' && HEX.test(v) ? v.toLowerCase() : undefined);
export interface RawMotif { name?: unknown; parts?: unknown; }

const hash = (s: string) => { let h = 5381; for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0; return (h >>> 0).toString(36); };
const f = (n: number) => +n.toFixed(4);

/** Validate an AI-drawn motif and normalise it into the engine's +-50 box centred on 0,0. Returns null if unusable. */
export function buildMotif(raw: RawMotif): VecElement | null {
  if (!raw || !Array.isArray(raw.parts)) return null;
  const name = (typeof raw.name === 'string' ? raw.name : 'motif').replace(/[^\w \-]/g, '').trim().slice(0, 40) || 'motif';
  const src: { d: string; role: Role; mirror: boolean; w: number; fill?: string; stroke?: string }[] = [];
  for (const p of (raw.parts as RawPart[]).slice(0, 24)) {
    if (!p || typeof p.d !== 'string' || p.d.length > 2500 || !D_OK.test(p.d)) continue;
    src.push({ d: p.d.trim(), role: ROLES.includes(p.role as Role) ? (p.role as Role) : 'primary', mirror: p.mirror === true, w: typeof p.w === 'number' && p.w > 0 && p.w <= 4 ? p.w : 1, fill: hex(p.fill), stroke: hex(p.stroke) });
  }
  for (const p of src) if (p.fill && p.role === 'line') p.role = 'primary';
  if (!src.some(p => p.role !== 'line')) return null;

  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  try {
    for (const p of src) for (const [x, y] of flattenPath(p.d)) {
      if (!isFinite(x) || !isFinite(y)) return null;
      for (const xx of p.mirror ? [x, -x] : [x]) { minX = Math.min(minX, xx); maxX = Math.max(maxX, xx); minY = Math.min(minY, y); maxY = Math.max(maxY, y); }
    }
  } catch { return null; }
  const size = Math.max(maxX - minX, maxY - minY);
  if (!isFinite(size) || size < 1) return null;
  const k = 94 / size, cx = (minX + maxX) / 2, cy = (minY + maxY) / 2;
  const base = `scale(${f(k)}) translate(${f(-cx)} ${f(-cy)})`;

  const parts: Part[] = [];
  for (const p of src) {
    const w = p.role === 'line' ? f(Math.min(6, p.w / k)) : undefined; // keep stroke width ~2.5 after scaling
    parts.push({ d: p.d, role: p.role, transform: base, w, fill: p.fill, stroke: p.stroke });
    if (p.mirror) parts.push({ d: p.d, role: p.role, transform: `${base} scale(-1 1)`, w, fill: p.fill, stroke: p.stroke });
  }
  return { id: `ai-${name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'motif'}-${hash(JSON.stringify(src))}`, name, parts };
}
