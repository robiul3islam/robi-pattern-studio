export interface ProcParam { k: string; label: string; min: number; max: number; step?: number; def: number }
export interface ProcCtx { colors: string[]; bg: string; seed: number }
export interface ProcDef {
  id: string; name: string; params: ProcParam[];
  /** Returns SVG for the whole tile. Every lattice must divide the tile exactly so the tile stays seamless. */
  render: (w: number, h: number, c: ProcCtx, p: Record<string, number>) => string;
}
