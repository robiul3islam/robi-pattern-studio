import { useMemo, useState } from 'react';
import { Copy } from 'lucide-react';
import { CATEGORIES } from '../../data/categories';
import { CATEGORY_CONFIG } from '../../data/categoryConfig';
import { QUICK_PALETTES } from '../../data/palettes';
import { MOODS, PLATFORMS, STYLES, buildPrompt, defaultInput, type Platform, type PromptInput } from '../../engines/prompt/build';

export default function PromptPage({ categoryId, setCategoryId, onSend }: { categoryId: string; setCategoryId: (id: string) => void; onSend: (prompt: string) => void }) {
  const [inp, setInp] = useState<PromptInput>(() => defaultInput(categoryId));
  const [msg, setMsg] = useState('');
  const set = (p: Partial<PromptInput>) => setInp(v => ({ ...v, ...p }));
  const out = useMemo(() => buildPrompt(inp), [inp]);
  const all = CATEGORY_CONFIG[inp.categoryId].elements;
  const copy = async (t: string) => { try { await navigator.clipboard.writeText(t); setMsg('Copied'); } catch { setMsg('Copy failed'); } setTimeout(() => setMsg(''), 1200); };
  const field = 'mt-1 block w-full rounded border px-2 py-2 text-sm dark:bg-slate-800';
  const card = 'rounded-xl border bg-white p-4 dark:border-slate-800 dark:bg-slate-900';
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <section className={`${card} space-y-4`}>
        <label className="block text-xs">Category
          <select value={inp.categoryId} className={field}
            onChange={e => { setCategoryId(e.target.value); setInp(defaultInput(e.target.value)); }}>
            {CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </label>
        <div className="grid grid-cols-3 gap-3">
          <label className="block text-xs">Platform
            <select value={inp.platform} onChange={e => set({ platform: e.target.value as Platform })} className={field}>{PLATFORMS.map(p => <option key={p}>{p}</option>)}</select></label>
          <label className="block text-xs">Style
            <select value={inp.style} onChange={e => set({ style: e.target.value })} className={field}>{STYLES.map(p => <option key={p}>{p}</option>)}</select></label>
          <label className="block text-xs">Mood
            <select value={inp.mood} onChange={e => set({ mood: e.target.value })} className={field}>{MOODS.map(p => <option key={p}>{p}</option>)}</select></label>
        </div>
        <div>
          <div className="mb-1 text-xs">Elements</div>
          <div className="flex flex-wrap gap-2">
            {all.map(e => {
              const on = inp.elements.includes(e);
              return <button key={e} onClick={() => set({ elements: on ? inp.elements.filter(x => x !== e) : [...inp.elements, e] })}
                className={`rounded-full border px-3 py-1 text-xs dark:border-slate-700 ${on ? 'bg-brand-500 text-white' : ''}`}>{e}</button>;
            })}
          </div>
        </div>
        <div>
          <div className="mb-1 text-xs">Palette {inp.colors.length === 0 && <span className="text-slate-500">(none)</span>}</div>
          <div className="space-y-2">
            <button onClick={() => set({ colors: [] })} className="text-xs underline">No palette</button>
            {QUICK_PALETTES.map(p => (
              <button key={p.id} onClick={() => set({ colors: p.colors })} aria-label={p.name} className={`flex w-full overflow-hidden rounded border ${inp.colors === p.colors ? 'ring-2 ring-brand-500' : 'dark:border-slate-700'}`}>
                {p.colors.map(c => <span key={c} style={{ background: c }} className="h-6 flex-1" />)}
              </button>
            ))}
          </div>
        </div>
        <label className="block text-xs">Extra details
          <input value={inp.extra} onChange={e => set({ extra: e.target.value })} placeholder="e.g. small dots between motifs" className={field} /></label>
        <div className="flex gap-6 text-xs">
          <label className="flex items-center gap-2"><input type="checkbox" checked={inp.seamless} onChange={e => set({ seamless: e.target.checked })} /> Seamless</label>
          <label className="flex items-center gap-2"><input type="checkbox" checked={inp.commercial} onChange={e => set({ commercial: e.target.checked })} /> Stock-ready</label>
        </div>
      </section>
      <section className={`${card} space-y-4`}>
        <div>
          <div className="mb-1 flex items-center justify-between"><h3 className="font-semibold">Prompt</h3>
            <span className="flex gap-3"><button onClick={() => onSend(out.prompt)} className="text-xs underline">Send to AI Generate</button><button onClick={() => copy(out.prompt)} className="flex items-center gap-1 text-xs"><Copy size={14} /> Copy {msg}</button></span></div>
          <textarea readOnly value={out.prompt} rows={8} className="w-full rounded border p-2 text-sm dark:bg-slate-800" aria-label="Generated prompt" />
        </div>
        {out.negative && (
          <div>
            <div className="mb-1 flex items-center justify-between"><h3 className="font-semibold">Negative prompt</h3>
              <button onClick={() => copy(out.negative)} className="flex items-center gap-1 text-xs"><Copy size={14} /> Copy</button></div>
            <textarea readOnly value={out.negative} rows={3} className="w-full rounded border p-2 text-sm dark:bg-slate-800" aria-label="Negative prompt" />
          </div>
        )}
      </section>
    </div>
  );
}
