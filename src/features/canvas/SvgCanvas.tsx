import { useRef, useState, type PointerEvent, type WheelEvent } from 'react';
import { Minus, Plus, Maximize2 } from 'lucide-react';

const SIZES = [1000, 2000, 3000, 4000];

export default function SvgCanvas() {
  const [tile, setTile] = useState(1000);
  const [bg, setBg] = useState('#ffffff');
  const [view, setView] = useState({ x: 0, y: 0, k: 0.6 });
  const drag = useRef<{ x: number; y: number } | null>(null);

  const zoom = (f: number) => setView(v => ({ ...v, k: Math.min(8, Math.max(0.1, v.k * f)) }));
  const onWheel = (e: WheelEvent) => zoom(e.deltaY < 0 ? 1.1 : 1 / 1.1);
  const down = (e: PointerEvent) => { drag.current = { x: e.clientX, y: e.clientY }; (e.target as Element).setPointerCapture?.(e.pointerId); };
  const move = (e: PointerEvent) => {
    if (!drag.current) return;
    const dx = e.clientX - drag.current.x, dy = e.clientY - drag.current.y;
    drag.current = { x: e.clientX, y: e.clientY };
    setView(v => ({ ...v, x: v.x + dx, y: v.y + dy }));
  };
  const up = () => { drag.current = null; };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2 text-sm">
        <label className="flex items-center gap-2">Tile
          <select value={tile} onChange={e => setTile(+e.target.value)} className="rounded border bg-transparent px-2 py-1 dark:border-slate-700">
            {SIZES.map(s => <option key={s} value={s}>{s} × {s}</option>)}
          </select>
        </label>
        <label className="flex items-center gap-2">Background
          <input type="color" value={bg} onChange={e => setBg(e.target.value)} className="h-7 w-10 cursor-pointer rounded" />
          <span className="font-mono">{bg}</span>
        </label>
        <div className="ml-auto flex items-center gap-1">
          <button aria-label="Zoom out" onClick={() => zoom(1 / 1.25)} className="rounded border p-1.5 dark:border-slate-700"><Minus size={16} /></button>
          <span className="w-14 text-center font-mono">{Math.round(view.k * 100)}%</span>
          <button aria-label="Zoom in" onClick={() => zoom(1.25)} className="rounded border p-1.5 dark:border-slate-700"><Plus size={16} /></button>
          <button aria-label="Reset view" onClick={() => setView({ x: 0, y: 0, k: 0.6 })} className="rounded border p-1.5 dark:border-slate-700"><Maximize2 size={16} /></button>
        </div>
      </div>
      <svg
        className="h-[520px] w-full cursor-grab touch-none rounded-xl border bg-slate-200 active:cursor-grabbing dark:border-slate-700 dark:bg-slate-800"
        onWheel={onWheel} onPointerDown={down} onPointerMove={move} onPointerUp={up} role="img" aria-label="Pattern canvas"
      >
        <defs>
          <pattern id="grid" width="100" height="100" patternUnits="userSpaceOnUse">
            <path d="M100 0H0V100" fill="none" stroke="#00000022" strokeWidth="2" />
          </pattern>
        </defs>
        <g transform={`translate(${view.x + 40} ${view.y + 40}) scale(${view.k})`}>
          <rect id="tile" width={tile} height={tile} fill={bg} />
          <rect width={tile} height={tile} fill="url(#grid)" />
          <rect width={tile} height={tile} fill="none" stroke="#6d5efc" strokeWidth={4 / view.k} />
        </g>
      </svg>
      <p className="text-xs text-slate-500">Empty tile canvas. Drag = pan, wheel = zoom. Pattern generation arrives in Phase 2.</p>
    </div>
  );
}
