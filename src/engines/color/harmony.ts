export type HarmonyType = 'complementary' | 'analogous' | 'triadic' | 'tetradic' | 'split' | 'monochrome';
export const HARMONIES: HarmonyType[] = ['complementary', 'analogous', 'triadic', 'tetradic', 'split', 'monochrome'];

export const isHex = (s: string) => /^#[0-9a-fA-F]{6}$/.test(s);

export function hexToHsl(hex: string): [number, number, number] {
  const n = parseInt(hex.slice(1), 16);
  const r = ((n >> 16) & 255) / 255, g = ((n >> 8) & 255) / 255, b = (n & 255) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b), d = max - min;
  const l = (max + min) / 2;
  let h = 0, s = 0;
  if (d) {
    s = d / (1 - Math.abs(2 * l - 1));
    h = max === r ? ((g - b) / d) % 6 : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
    h *= 60; if (h < 0) h += 360;
  }
  return [h, s * 100, l * 100];
}

export function hslToHex(h: number, s: number, l: number): string {
  h = ((h % 360) + 360) % 360; s = Math.min(100, Math.max(0, s)) / 100; l = Math.min(100, Math.max(0, l)) / 100;
  const k = (n: number) => (n + h / 30) % 12, a = s * Math.min(l, 1 - l);
  const f = (n: number) => Math.round(255 * (l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)))));
  return '#' + [f(0), f(8), f(4)].map(v => v.toString(16).padStart(2, '0')).join('');
}

const OFFSETS: Record<Exclude<HarmonyType, 'monochrome'>, number[]> = {
  complementary: [0, 180], analogous: [-30, 0, 30], triadic: [0, 120, 240], tetradic: [0, 90, 180, 270], split: [0, 150, 210],
};

export function harmony(base: string, type: HarmonyType): string[] {
  const [h, s, l] = hexToHsl(base);
  if (type === 'monochrome') return [-30, -15, 0, 15, 30].map(d => hslToHex(h, s, l + d));
  return OFFSETS[type].map(o => hslToHex(h + o, s, l));
}

function lum(hex: string) {
  const n = parseInt(hex.slice(1), 16);
  const c = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map(v => { const x = v / 255; return x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4; });
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
}
export function contrast(a: string, b: string): number {
  const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p);
  return (x + 0.05) / (y + 0.05);
}
export const randomHex = (rnd: () => number = Math.random) => hslToHex(rnd() * 360, 50 + rnd() * 40, 40 + rnd() * 25);
