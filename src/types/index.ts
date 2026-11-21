export interface Category { id: string; name: string; accent: string; }
export interface Palette { id: string; name: string; group: string; colors: string[]; }
export type PageId = 'dashboard' | 'generator' | 'prompt' | 'categories' | 'color' | 'editor' | 'projects' | 'trend' | 'quality' | 'metadata' | 'batch' | 'export' | 'ai' | 'typo' | 'settings';
export interface NavItem { id: PageId; label: string; phase: number; }

export type Role = 'primary' | 'secondary' | 'accent' | 'line';
export interface Part { d: string; role: Role; transform?: string; w?: number; fill?: string; stroke?: string; }
export interface VecElement { id: string; name: string; parts: Part[]; }
export type PatternMode = 'grid' | 'scattered' | 'organic' | 'structured' | 'dense' | 'minimal' | 'mirror' | 'halfdrop' | 'brick';
export type Symmetry = 'none' | 'horizontal' | 'vertical' | 'both';
export interface LayoutSettings {
  categoryId: string; mode: PatternMode; count: number; size: number; density: number;
  spacing: number; rotation: number; randomness: number; symmetry: Symmetry; w: number; h: number; seed: number;
  elements?: string[];
  /** Designer-style composition: per-motif size (% of tile width) and frequency weight. */
  elementSpec?: Record<string, { size: number; weight: number }>;
  /** Procedural full-tile layer (halftone, weave, swirl, knit...). Periodic by construction. */
  proc?: string;
  /** Parameter values of the procedural layer. */
  pv?: Record<string, number>;
}
export interface Instance { n: number; el: string; x: number; y: number; s: number; r: number; flip: boolean; c: [number, number, number]; }
export interface PatternLayout { settings: LayoutSettings; instances: Instance[]; w: number; h: number; }
export type BgType = 'dots' | 'hexdots' | 'stripes' | 'pinstripe' | 'diagonal' | 'crosshatch' | 'grid' | 'checks' | 'waves' | 'chevron' | 'scales' | 'crosses' | 'diamonds';
export interface BgPattern { type: BgType; color: string; opacity: number; scale: number; }
export interface RenderOptions { colors: string[]; bg: string; outline: string; transparent?: boolean; bgPattern?: BgPattern; }
export interface CategoryConfig {
  elements: string[]; palette: string; mode: PatternMode; size: number; count: number;
  density: number; spacing: number; rotation: number; randomness: number;
  /** Procedural styles this category can render (first one is the default). */
  procs?: string[];
  /** Best default palette for each procedural style. */
  procPalette?: Record<string, string>;
  /** Designer-style composition: heroes + fillers (size = % of tile width, weight = how often). */
  spec?: Record<string, { size: number; weight: number }>;
}
