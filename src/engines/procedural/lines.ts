import type { ProcDef } from './types';
import { COL, TAU, even, f, ink, range } from './util';

export const flowLines: ProcDef = {
  id: 'flow-lines', name: 'Flowing wave lines',
  params: [{ k: 'lines', label: 'Lines', min: 8, max: 90, def: 40 }, { k: 'amp', label: 'Wave height', min: 0, max: 100, def: 42 }, { k: 'waves', label: 'Waves across', min: 1, max: 5, def: 2 },
    { k: 'twist', label: 'Line spread', min: 0, max: 100, def: 60 }, { k: 'width', label: 'Line width', min: 0.3, max: 6, step: 0.1, def: 1.6 }, { k: 'fade', label: 'Fade lines (1) / solid (0)', min: 0, max: 1, def: 1 }, COL],
  render(w, h, c, p) {
    const m = Math.round(p.lines), k = Math.round(p.waves), step = h / m, A = (p.amp / 100) * step * 5, T = p.twist / 100;
    const N = 120, out: string[] = [];
    for (const j of range(-6, m + 5)) {
      const y0 = j * step, v = y0 / h;
      let d = '';
      for (let s = 0; s <= N; s++) {
        const x = (s / N) * w, u = x / w;
        const y = y0 + A * (Math.sin(TAU * (k * u + v)) + 0.5 * T * Math.sin(TAU * ((k + 1) * u - 2 * v) + 1.3));
        d += `${s ? 'L' : 'M'}${f(x)},${f(y)}`;
      }
      const op = p.fade > 0 ? 0.55 + 0.45 * (0.5 + 0.5 * Math.cos(TAU * (v * 1 + 0.15))) : 1;
      out.push(`<path d="${d}" opacity="${f(op)}"/>`);
    }
    return `<g fill="none" stroke="${ink(c, p)}" stroke-width="${p.width}" stroke-linecap="round" stroke-linejoin="round">${out.join('')}</g>`;
  },
};

export const cubeWeave: ProcDef = {
  id: 'cube-weave', name: 'Hex cube weave',
  params: [{ k: 'scale', label: 'Cubes across', min: 3, max: 24, def: 9 }, { k: 'lines', label: 'Lines per face', min: 3, max: 16, def: 7 }, { k: 'width', label: 'Line width', min: 0.3, max: 5, step: 0.1, def: 1.6 },
    { k: 'solid', label: 'Faces: 0 lines / 1 solid shades / 2 both', min: 0, max: 2, def: 0 }, COL],
  render(w, h, c, p) {
    const nx = Math.round(p.scale), L = w / (nx * Math.sqrt(3)), W = Math.sqrt(3) * L, ny = even(h / (1.5 * L)), sy = h / (ny * 1.5 * L), K = Math.round(p.lines);
    const col = ink(c, p), fills: string[] = ['', '', ''];
    let lines = '';
    const V = (cx: number, cy: number, k: number): [number, number] => { const a = ((-90 + 60 * k) * Math.PI) / 180; return [cx + L * Math.cos(a), cy + L * Math.sin(a) * sy]; };
    for (const j of range(-1, ny)) for (const i of range(-1, nx)) {
      const cx = i * W + (((j % 2) + 2) % 2) * W / 2, cy = j * 1.5 * L * sy, o: [number, number] = [cx, cy];
      const faces: Array<[[number, number], [number, number], [number, number], [number, number]]> = [[V(cx, cy, 1), V(cx, cy, 5), V(cx, cy, 0), o], [V(cx, cy, 3), V(cx, cy, 1), V(cx, cy, 2), o], [V(cx, cy, 5), V(cx, cy, 3), V(cx, cy, 4), o]];
      faces.forEach(([a, b, q], fi) => {
        // face = o, o+A, o+A+B, o+B with A,B edge vectors: lines run parallel to A
        const A = [a[0] - cx, a[1] - cy], B = [b[0] - cx, b[1] - cy];
        fills[fi] += `M${f(cx)},${f(cy)}l${f(A[0])},${f(A[1])}l${f(B[0])},${f(B[1])}l${f(-A[0])},${f(-A[1])}Z`;
        void q;
        if (p.solid !== 1) for (let t = 1; t < K; t++) { const s = t / K; lines += `M${f(cx + B[0] * s)},${f(cy + B[1] * s)}l${f(A[0])},${f(A[1])}`; }
      });
    }
    const solid = p.solid >= 1 ? [0.18, 0.55, 1].map((o, i) => `<path d="${fills[i]}" fill="${col}" fill-opacity="${o}" stroke="${c.bg}" stroke-width="${f(p.width)}" stroke-linejoin="round"/>`).join('') : '';
    return `${solid}${p.solid !== 1 ? `<path d="${lines}" fill="none" stroke="${col}" stroke-width="${p.width}" stroke-linecap="round"/>` : ''}`;
  },
};
