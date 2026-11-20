import { useState } from 'react';
import { Copy, Dices } from 'lucide-react';
import { HARMONIES, contrast, harmony, isHex, randomHex, type HarmonyType } from '../../engines/color/harmony';
import { QUICK_PALETTES } from '../../data/palettes';

export default function ColorStudio({ onSend }: { onSend: (colors: string[]) => void }) {
  const [base, setBase] = useState('#14b8a6');
  const [type, setType] = useState<HarmonyType>('analogous');
  const [bg, setBg] = useState('#ffffff');
  const [msg, setMsg] = useState('');
  const valid = isHex(base);
  const colors = valid ? harmony(base, type) : [];
  const card = 'rounded-xl border bg-white p-4 dark:border-slate-800 dark:bg-slate-900';
  const copy = async (t: string) => { try { await navigator.clipboard.writeText(t); setMsg(`Copied ${t}`); } catch { setMsg('Copy failed'); } setTimeout(() => setMsg(''), 1500); };
  return (
    <div className="space-y-6">
      <section className={card}>
        <div className="flex flex-wrap items-end gap-4">
          <label className="text-xs">Base color
            <div className="mt-1 flex gap-2">
              <input type="color" value={valid ? base : '#000000'} onChange={e => setBase(e.target.value)} className="h-9 w-12" />
              <input value={base} onChange={e => setBase(e.target.value)} className={`w-28 rounded border px-2 font-mono text-sm dark:bg-slate-800 ${valid ? '' : 'border-red-500'}`} aria-label="Base HEX" />
            </div>
          </label>
          <label className="text-xs">Harmony
            <select value={type} onChange={e => setType(e.target.value as HarmonyType)} className="mt-1 block rounded border px-2 py-2 text-sm dark:bg-slate-800">
              {HARMONIES.map(h => <option key={h}>{h}</option>)}
            </select>
          </label>
          <label className="text-xs">Background
            <input type="color" value={bg} onChange={e => setBg(e.target.value)} className="mt-1 block h-9 w-12" />
          </label>
          <button onClick={() => setBase(randomHex())} className="flex items-center gap-2 rounded-lg border px-3 py-2 text-sm dark:border-slate-700"><Dices size={16} /> Random</button>
          {colors.length > 0 && <button onClick={() => copy(colors.join(', '))} className="flex items-center gap-2 rounded-lg bg-brand-500 px-3 py-2 text-sm text-white hover:bg-brand-600"><Copy size={16} /> Copy all</button>}
          {colors.length > 0 && <button onClick={() => onSend(colors)} className="rounded-lg border px-3 py-2 text-sm dark:border-slate-700">Use in generator</button>}
          {msg && <span className="text-xs text-slate-500">{msg}</span>}
        </div>
        {!valid && <p className="mt-2 text-xs text-red-500">Enter a 6-digit HEX like #14b8a6.</p>}
      </section>
      {colors.length > 0 && (
        <section className={card}>
          <h3 className="mb-3 font-semibold">Palette</h3>
          <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {colors.map(c => {
              const r = contrast(c, bg);
              return (
                <button key={c} onClick={() => copy(c)} className="overflow-hidden rounded-lg border text-left dark:border-slate-700">
                  <div style={{ background: c }} className="h-20" />
                  <div className="p-2 text-xs"><div className="font-mono">{c}</div>
                    <div className="text-slate-500">vs bg {r.toFixed(2)}:1 {r >= 4.5 ? 'AA' : r >= 3 ? 'AA large' : 'low'}</div></div>
                </button>
              );
            })}
          </div>
        </section>
      )}
      <section className={card}>
        <h3 className="mb-3 font-semibold">Start from a palette (click swatch to set base)</h3>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {QUICK_PALETTES.map(p => (
            <div key={p.id}>
              <div className="mb-1 text-xs text-slate-500">{p.name} · {p.group}</div>
              <div className="flex overflow-hidden rounded-lg border dark:border-slate-700">
                {p.colors.map(c => <button key={c} title={c} aria-label={`Use ${c}`} onClick={() => setBase(c)} style={{ background: c }} className="h-9 flex-1" />)}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
