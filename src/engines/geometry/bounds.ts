import { ELEMENTS_BY_ID } from '../../data/elements';
import type { VecElement } from '../../types';

export type Matrix = [number, number, number, number, number, number];
export interface Bounds { minX: number; minY: number; maxX: number; maxY: number; }
type Pt = [number, number];

const mul = (m: Matrix, n: Matrix): Matrix => [
  m[0] * n[0] + m[2] * n[1], m[1] * n[0] + m[3] * n[1],
  m[0] * n[2] + m[2] * n[3], m[1] * n[2] + m[3] * n[3],
  m[0] * n[4] + m[2] * n[5] + m[4], m[1] * n[4] + m[3] * n[5] + m[5],
];
const apply = (m: Matrix, p: Pt): Pt => [m[0] * p[0] + m[2] * p[1] + m[4], m[1] * p[0] + m[3] * p[1] + m[5]];

export function parseTransform(t: string | undefined): Matrix {
  let m: Matrix = [1, 0, 0, 1, 0, 0];
  if (!t) return m;
  for (const [, name, args] of t.matchAll(/(\w+)\(([^)]*)\)/g)) {
    const a = args.trim().split(/[\s,]+/).map(Number);
    if (name === 'translate') m = mul(m, [1, 0, 0, 1, a[0], a[1] ?? 0]);
    else if (name === 'scale') m = mul(m, [a[0], 0, 0, a[1] ?? a[0], 0, 0]);
    else if (name === 'rotate') { const r = (a[0] * Math.PI) / 180; m = mul(m, [Math.cos(r), Math.sin(r), -Math.sin(r), Math.cos(r), 0, 0]); }
    else throw new Error(`Unsupported transform: ${name}`);
  }
  return m;
}

function arcPoints(x1: number, y1: number, rx: number, ry: number, phi: number, fa: number, fs: number, x2: number, y2: number): Pt[] {
  if (rx === 0 || ry === 0) return [[x2, y2]];
  rx = Math.abs(rx); ry = Math.abs(ry);
  const p = (phi * Math.PI) / 180, cp = Math.cos(p), sp = Math.sin(p);
  const dx = (x1 - x2) / 2, dy = (y1 - y2) / 2;
  const x1p = cp * dx + sp * dy, y1p = -sp * dx + cp * dy;
  const lam = (x1p * x1p) / (rx * rx) + (y1p * y1p) / (ry * ry);
  if (lam > 1) { const s = Math.sqrt(lam); rx *= s; ry *= s; }
  const num = rx * rx * ry * ry - rx * rx * y1p * y1p - ry * ry * x1p * x1p;
  const den = rx * rx * y1p * y1p + ry * ry * x1p * x1p;
  const co = (fa === fs ? -1 : 1) * Math.sqrt(Math.max(0, num / den));
  const cxp = (co * rx * y1p) / ry, cyp = (-co * ry * x1p) / rx;
  const cx = cp * cxp - sp * cyp + (x1 + x2) / 2, cy = sp * cxp + cp * cyp + (y1 + y2) / 2;
  const ang = (ux: number, uy: number, vx: number, vy: number) => Math.atan2(ux * vy - uy * vx, ux * vx + uy * vy);
  const th1 = ang(1, 0, (x1p - cxp) / rx, (y1p - cyp) / ry);
  let dth = ang((x1p - cxp) / rx, (y1p - cyp) / ry, (-x1p - cxp) / rx, (-y1p - cyp) / ry);
  if (!fs && dth > 0) dth -= 2 * Math.PI; else if (fs && dth < 0) dth += 2 * Math.PI;
  const out: Pt[] = [];
  for (let i = 1; i <= 24; i++) {
    const t = th1 + (dth * i) / 24;
    out.push([cp * rx * Math.cos(t) - sp * ry * Math.sin(t) + cx, sp * rx * Math.cos(t) + cp * ry * Math.sin(t) + cy]);
  }
  return out;
}

/** Flatten an SVG path (M L H V C S Q T A Z, absolute + relative) into sample points. */
export function flattenPath(d: string): Pt[] {
  const tok = d.match(/[MmLlHhVvCcSsQqTtAaZz]|-?(?:\d+\.?\d*|\.\d+)(?:e[-+]?\d+)?/g) ?? [];
  const pts: Pt[] = [];
  let i = 0, cmd = '', x = 0, y = 0, sx = 0, sy = 0, lcx = 0, lcy = 0, prev = '';
  const num = () => { const v = parseFloat(tok[i++]); if (Number.isNaN(v)) throw new Error(`Bad path data: ${d}`); return v; };
  const cubic = (x0: number, y0: number, a: number, b: number, c: number, e: number, x3: number, y3: number) => {
    for (let k = 1; k <= 16; k++) { const t = k / 16, u = 1 - t;
      pts.push([u * u * u * x0 + 3 * u * u * t * a + 3 * u * t * t * c + t * t * t * x3, u * u * u * y0 + 3 * u * u * t * b + 3 * u * t * t * e + t * t * t * y3]); }
  };
  while (i < tok.length) {
    if (/[A-Za-z]/.test(tok[i])) cmd = tok[i++];
    else if (cmd === 'M') cmd = 'L'; else if (cmd === 'm') cmd = 'l';
    const rel = cmd === cmd.toLowerCase(), C = cmd.toUpperCase();
    const ox = rel ? x : 0, oy = rel ? y : 0;
    if (C === 'Z') { x = sx; y = sy; prev = 'Z'; continue; }
    if (C === 'M') { x = ox + num(); y = oy + num(); sx = x; sy = y; pts.push([x, y]); }
    else if (C === 'L') { x = ox + num(); y = oy + num(); pts.push([x, y]); }
    else if (C === 'H') { x = (rel ? x : 0) + num(); pts.push([x, y]); }
    else if (C === 'V') { y = (rel ? y : 0) + num(); pts.push([x, y]); }
    else if (C === 'C') { const a = ox + num(), b = oy + num(), c = ox + num(), e = oy + num(), x3 = ox + num(), y3 = oy + num(); cubic(x, y, a, b, c, e, x3, y3); lcx = c; lcy = e; x = x3; y = y3; }
    else if (C === 'S') { const a = prev === 'C' || prev === 'S' ? 2 * x - lcx : x, b = prev === 'C' || prev === 'S' ? 2 * y - lcy : y; const c = ox + num(), e = oy + num(), x3 = ox + num(), y3 = oy + num(); cubic(x, y, a, b, c, e, x3, y3); lcx = c; lcy = e; x = x3; y = y3; }
    else if (C === 'Q' || C === 'T') {
      let qx: number, qy: number;
      if (C === 'Q') { qx = ox + num(); qy = oy + num(); } else { qx = prev === 'Q' || prev === 'T' ? 2 * x - lcx : x; qy = prev === 'Q' || prev === 'T' ? 2 * y - lcy : y; }
      const x3 = ox + num(), y3 = oy + num();
      cubic(x, y, x + (2 / 3) * (qx - x), y + (2 / 3) * (qy - y), x3 + (2 / 3) * (qx - x3), y3 + (2 / 3) * (qy - y3), x3, y3);
      lcx = qx; lcy = qy; x = x3; y = y3;
    }
    else if (C === 'A') { const rx = num(), ry = num(), phi = num(), fa = num(), fs = num(), x2 = ox + num(), y2 = oy + num(); pts.push(...arcPoints(x, y, rx, ry, phi, fa, fs, x2, y2)); x = x2; y = y2; }
    else throw new Error(`Unsupported path command: ${cmd}`);
    prev = C;
  }
  return pts;
}

const cache = new Map<string, { pts: Pt[]; pad: number }>();
function shape(el: VecElement) {
  let c = cache.get(el.id);
  if (!c) {
    const pts: Pt[] = []; let pad = 0;
    for (const p of el.parts) {
      const m = parseTransform(p.transform);
      for (const q of flattenPath(p.d)) pts.push(apply(m, q));
      if (p.role === 'line') pad = Math.max(pad, 1.25 * (p.w ?? 1) + 0.5);
    }
    c = { pts, pad }; cache.set(el.id, c);
  }
  return c;
}

/** Bounds (incl. stroke padding) of an element drawn with the given group transform. */
export function groupBounds(elementId: string, transform: string): Bounds {
  const el = ELEMENTS_BY_ID[elementId];
  if (!el) throw new Error(`Unknown element: ${elementId}`);
  const m = parseTransform(transform), { pts, pad } = shape(el);
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const p of pts) { const [x, y] = apply(m, p); if (x < minX) minX = x; if (x > maxX) maxX = x; if (y < minY) minY = y; if (y > maxY) maxY = y; }
  const sc = Math.max(Math.hypot(m[0], m[1]), Math.hypot(m[2], m[3])) * pad;
  return { minX: minX - sc, minY: minY - sc, maxX: maxX + sc, maxY: maxY + sc };
}
