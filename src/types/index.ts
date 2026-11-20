export interface Category { id: string; name: string; accent: string; }
export interface Palette { id: string; name: string; group: string; colors: string[]; }
export type PageId = 'dashboard' | 'generator' | 'prompt' | 'categories' | 'color' | 'editor' | 'projects' | 'trend' | 'quality' | 'metadata' | 'batch' | 'export' | 'ai' | 'settings';
export interface NavItem { id: PageId; label: string; phase: number; }

export type Role = 'primary' | 'secondary' | 'accent' | 'line';
export interface Part { d: string; role: Role; transform?: string; w?: number; }
export interface VecElement { id: string; name: string; parts: Part[]; }
export type PatternMode = 'grid' | 'scattered' | 'organic' | 'structured' | 'dense' | 'minimal' | 'mirror' | 'halfdrop' | 'brick';
export type Symmetry = 'none' | 'horizontal' | 'vertical' | 'both';
export interface LayoutSettings {
  categoryId: string; mode: PatternMode; count: number; size: number; density: number;
  spacing: number; rotation: number; randomness: number; symmetry: Symmetry; w: number; h: number; seed: number;
  elements?: string[];
}
export interface Instance { n: number; el: string; x: number; y: number; s: number; r: number; flip: boolean; c: [number, number, number]; }
export interface PatternLayout { settings: LayoutSettings; instances: Instance[]; w: number; h: number; }
export interface RenderOptions { colors: string[]; bg: string; outline: string; transparent?: boolean; }
export interface CategoryConfig {
  elements: string[]; palette: string; mode: PatternMode; size: number; count: number;
  density: number; spacing: number; rotation: number; randomness: number;
}
