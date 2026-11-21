import { useEffect, useMemo, useState } from 'react';
import { Dices, Download } from 'lucide-react';
import { CATEGORIES } from '../../data/categories';
import { CATEGORY_CONFIG } from '../../data/categoryConfig';
import { QUICK_PALETTES } from '../../data/palettes';
import { generateLayout } from '../../engines/pattern/generate';
import { buildSvg, buildTiledPreview } from '../../engines/vector/buildSvg';
import { validateSeamless } from '../../engines/seamless/validate';
import ValidationPanel from '../seamless-engine/ValidationPanel';
import BgPanel from '../bgpanel';
import { ELEMENTS_BY_ID } from '../../data/elements';
import type { BgPattern } from '../../types';
import { PROCS, procDefaults } from '../../engines/procedural';
import { LINE_CATS, paletteFor, registerCustom, bump, defaultSettings, newId, setCustomPalette, upsertProject, type Project } from '../../engines/project/store';
import type { LayoutSettings, PatternMode, Symmetry } from '../../types';

const MODES: PatternMode[] = ['grid', 'scattered', 'organic', 'structured', 'dense', 'minimal', 'mirror', 'halfdrop', 'brick'];
const SYMS: Symmetry[] = ['none', 'horizontal', 'vertical', 'both'];
const STYLES: Record<string, { size: number; density: number; spacing: number }> = {
  Classic: { size: 1, density: 0, spacing: 1 }, Bold: { size: 1.4, density: -15, spacing: 0.9 },
  Delicate: { size: 0.7, density: 20, spacing: 1 }, Airy: { size: 1, density: -20, spacing: 1.4 },
};

const initial = (categoryId: string): LayoutSettings => defaultSettings(categoryId);

function Slider({ label, v, min, max, step = 1, on }: { label: string; v: number; min: number; max: number; step?: number; on: (n: number) => void }) {
  return (
    <label className="block text-xs">
      <div className="flex justify-between"><span>{label}</span><span className="font-mono">{v}</span></div>
      <input type="range" min={min} max={max} step={step} value={v} onChange={e => on(+e.target.value)} className="w-full" />
    </label>
  );
}

export default function GeneratorPage({ categoryId, setCategoryId, work, onWork }: { categoryId: string; setCategoryId: (id: string) => void; work: Project; onWork: (p: Project) => void }) {
  const [s, setS] = useState<LayoutSettings>(() => { registerCustom(work.customElements); return work.settings; });
  const [paletteId, setPaletteId] = useState(() => QUICK_PALETTES.find(p => p.colors.join() === work.colors.join())?.id ?? setCustomPalette(work.colors));
  const [bg, setBg] = useState(work.bg);
  const [outline, setOutline] = useState(work.outline);
  const [bgp, setBgp] = useState<BgPattern | undefined>(work.bgPattern);
  const [saved, setSaved] = useState('');
  const [error, setError] = useState('');
  const [repeat, setRepeat] = useState(1);
  const [seams, setSeams] = useState(true);
  const set = <K extends keyof LayoutSettings>(k: K, v: LayoutSettings[K]) => setS(o => ({ ...o, [k]: v }));
  const palette = QUICK_PALETTES.find(p => p.id === paletteId)!;
  void categoryId;
  const cfg = CATEGORY_CONFIG[s.categoryId];
  const procOnly = !!s.proc && !cfg.elements.length && !s.elementSpec;
  const procDef = s.proc ? PROCS[s.proc] : undefined;

  // publish the working pattern so Editor, Quality, Metadata, Export and Batch can use it
  useEffect(() => {
    const same = JSON.stringify([work.settings, work.colors, work.bg, work.outline, work.bgPattern]) === JSON.stringify([s, palette.colors, bg, outline, bgp]);
    if (same) return;
    onWork({ id: work.id, name: work.name, settings: s, colors: palette.colors, bg, outline, createdAt: work.createdAt, customElements: work.customElements, bgPattern: bgp });
    setSaved('');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [s, palette, bg, outline, bgp]);
  const save = () => {
    const ok = upsertProject({ id: work.id || newId(), name: work.name, settings: s, colors: palette.colors, bg, outline, instances: undefined, createdAt: work.createdAt, customElements: work.customElements, bgPattern: bgp });
    setSaved(ok ? 'Saved' : 'Save failed: storage unavailable');
  };

  const pickCategory = (id: string) => {
    setCategoryId(id);
    setS(o => ({ ...initial(id), seed: o.seed, w: o.w, h: o.h }));
    const pid = paletteFor(id, CATEGORY_CONFIG[id].procs?.[0]); setPaletteId(pid);
    setBg(QUICK_PALETTES.find(p => p.id === pid)!.colors[4]);
    setOutline(LINE_CATS.includes(id) ? QUICK_PALETTES.find(p => p.id === pid)!.colors[0] : '#222222');
  };
  const pickProc = (id: string) => {
    setS(o => ({ ...o, proc: id, pv: procDefaults(id) }));
    const pid = cfg.procPalette?.[id];
    if (pid) { setPaletteId(pid); setBg(QUICK_PALETTES.find(p => p.id === pid)!.colors[4]); }
  };
  const pickPalette = (id: string) => { setPaletteId(id); setBg(QUICK_PALETTES.find(p => p.id === id)!.colors[4]); };
  const applyStyle = (name: string) => {
    const st = STYLES[name], c = CATEGORY_CONFIG[s.categoryId];
    setS(o => ({ ...o, size: Math.round(c.size * st.size), density: Math.min(100, Math.max(0, c.density + st.density)), spacing: st.spacing }));
  };

  // layout depends on geometry settings only: colour changes never re-run it
  const { layout, err } = useMemo(() => {
    try { return { layout: generateLayout(s), err: '' }; } catch (e) { return { layout: null, err: (e as Error).message }; }
  }, [s]);
  const svg = useMemo(() => layout ? buildSvg(layout, { colors: palette.colors, bg, outline, bgPattern: bgp }, `${s.categoryId} pattern tile`) : '', [layout, palette, bg, outline, bgp, s.categoryId]);

  // validation runs on the real SVG output of the layout (geometry only; colours do not matter)
  const report = useMemo(() => layout ? validateSeamless(buildSvg(layout, { colors: QUICK_PALETTES[0].colors, bg: '#fff', outline: '#000' }), s.w, s.h) : null, [layout, s.w, s.h]);
  const shown = useMemo(() => {
    if (!layout) return '';
    const o = { colors: palette.colors, bg, outline, bgPattern: bgp };
    return repeat === 1 ? svg.replace(/width="\d+" height="\d+" viewBox/, 'width="100%" height="100%" viewBox') : buildTiledPreview(layout, o, repeat, seams);
  }, [layout, svg, repeat, seams, palette, bg, outline, bgp]);

  const download = () => {
    try {
      const url = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml' }));
      const a = document.createElement('a'); a.href = url; a.download = `${s.categoryId}_pattern_seed${s.seed}.svg`; a.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000); setError('');
    } catch (e) { setError(`Download failed: ${(e as Error).message}`); }
  };
  const sel = 'w-full rounded border bg-transparent px-2 py-1 text-sm dark:border-slate-700';
  const num = (k: 'w' | 'h' | 'seed', min: number, max: number) => (
    <input type="number" min={min} max={max} value={s[k]} onChange={e => set(k, Math.min(max, Math.max(min, Math.round(+e.target.value) || min)))} className={sel} />
  );

  return (
    <div className="grid gap-4 lg:grid-cols-[300px_1fr]">
      <div className="space-y-3 rounded-xl border bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
        <label className="block text-xs">Category
          <select className={sel} value={s.categoryId} onChange={e => pickCategory(e.target.value)}>{CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select>
        </label>
        {cfg.procs && procDef && (
          <div className="space-y-2 rounded-lg border p-2 dark:border-slate-700">
            <label className="block text-xs font-semibold">Pattern style
              <select className={sel} value={s.proc} onChange={e => pickProc(e.target.value)}>{cfg.procs.map(id => <option key={id} value={id}>{PROCS[id].name}</option>)}</select>
            </label>
            {procDef.params.map(q => <Slider key={q.k} label={q.label} v={s.pv?.[q.k] ?? q.def} min={q.min} max={q.max} step={q.step ?? 1} on={n => setS(o => ({ ...o, pv: { ...(o.pv ?? {}), [q.k]: n } }))} />)}
          </div>
        )}
        <div className="grid grid-cols-2 gap-2">
          {!procOnly && <>
          <label className="block text-xs">Composition
            <select className={sel} value={s.mode} onChange={e => set('mode', e.target.value as PatternMode)}>{MODES.map(m => <option key={m}>{m}</option>)}</select>
          </label>
          <label className="block text-xs">Style preset
            <select className={sel} defaultValue="Classic" onChange={e => applyStyle(e.target.value)}>{Object.keys(STYLES).map(m => <option key={m}>{m}</option>)}</select>
          </label>
          <label className="block text-xs">Symmetry
            <select className={sel} value={s.symmetry} onChange={e => set('symmetry', e.target.value as Symmetry)}>{SYMS.map(m => <option key={m}>{m}</option>)}</select>
          </label>
          </>}
          <label className="block text-xs">Palette
            <select className={sel} value={paletteId} onChange={e => pickPalette(e.target.value)}>{QUICK_PALETTES.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select>
          </label>
        </div>
        <div className="flex overflow-hidden rounded border dark:border-slate-700">{palette.colors.map(c => <div key={c} style={{ background: c }} className="h-5 flex-1" title={c} />)}</div>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <label>Background <input type="color" value={bg} onChange={e => setBg(e.target.value)} className="h-7 w-full cursor-pointer" /></label>
          <label>Outline <input type="color" value={outline} onChange={e => setOutline(e.target.value)} className="h-7 w-full cursor-pointer" /></label>
        </div>
        {!procOnly && <>
        <Slider label={s.elementSpec ? "Fillers amount" : "Number of elements"} v={s.count} min={4} max={200} on={n => set('count', n)} />
        <Slider label={s.elementSpec ? "Overall size (all motifs)" : "Element size"} v={s.size} min={20} max={220} on={n => set('size', n)} />
        <Slider label="Density" v={s.density} min={0} max={100} on={n => set('density', n)} />
        <Slider label="Spacing" v={s.spacing} min={0.5} max={2} step={0.05} on={n => set('spacing', n)} />
        <Slider label="Rotation (max °)" v={s.rotation} min={0} max={180} on={n => set('rotation', n)} />
        <Slider label="Randomness" v={s.randomness} min={0} max={100} on={n => set('randomness', n)} />
        </>}
        {s.elementSpec && (
          <div className="space-y-2 rounded-lg border p-2 dark:border-slate-700">
            <div className="text-xs font-semibold">Motifs (size and how often)</div>
            {(s.elements ?? []).filter(id => s.elementSpec![id]).map(id => (
              <div key={id} className="space-y-1">
                <div className="flex items-center justify-between text-xs"><span>{ELEMENTS_BY_ID[id]?.name ?? id}</span>
                  <span className="flex items-center gap-1">x
                    <select className="rounded border bg-transparent px-1 dark:border-slate-700" value={s.elementSpec![id].weight} onChange={e => setS(o => ({ ...o, elementSpec: { ...o.elementSpec!, [id]: { ...o.elementSpec![id], weight: +e.target.value } } }))}>{[1, 2, 3, 4].map(n => <option key={n}>{n}</option>)}</select>
                    {(s.elements ?? []).length > 1 && <button className="ml-1 underline" onClick={() => setS(o => { const sp = { ...o.elementSpec! }; delete sp[id]; return { ...o, elements: (o.elements ?? []).filter(x => x !== id), elementSpec: sp }; })}>remove</button>}
                  </span></div>
                <Slider label={`Size ${s.elementSpec![id].size}%`} v={s.elementSpec![id].size} min={2} max={46} on={n => setS(o => ({ ...o, elementSpec: { ...o.elementSpec!, [id]: { ...o.elementSpec![id], size: n } } }))} />
              </div>
            ))}
          </div>
        )}
        <BgPanel value={bgp} onChange={setBgp} base={palette.colors[0]} />
        <div className="grid grid-cols-3 gap-2 text-xs">
          <label>Tile W{num('w', 200, 4000)}</label><label>Tile H{num('h', 200, 4000)}</label><label>Seed{num('seed', 0, 4294967295)}</label>
        </div>
        <div className="flex gap-2">
          <button onClick={() => { set('seed', Math.floor(Math.random() * 1e9)); bump('generated'); }} className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-brand-500 px-3 py-2 text-sm font-medium text-white hover:bg-brand-600"><Dices size={16} /> New seed</button>
          <button onClick={download} disabled={!svg} className="flex flex-1 items-center justify-center gap-2 rounded-lg border px-3 py-2 text-sm disabled:opacity-40 dark:border-slate-700"><Download size={16} /> SVG</button>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={save} className="flex-1 rounded-lg border px-3 py-2 text-sm dark:border-slate-700">Save project</button>
          {saved && <span className="text-xs text-slate-500">{saved}</span>}
        </div>
        {(err || error) && <p role="alert" className="text-sm text-red-500">{err || error}</p>}
      </div>
      <div className="space-y-2">
        <div className="flex flex-wrap items-center gap-2 text-sm">
          {[1, 3, 5, 7].map(n => (
            <button key={n} onClick={() => setRepeat(n)} className={`rounded-lg border px-3 py-1 dark:border-slate-700 ${repeat === n ? 'bg-brand-500 text-white' : ''}`}>{n}×{n}</button>
          ))}
          <label className="ml-2 flex items-center gap-1 text-xs"><input type="checkbox" checked={seams} onChange={e => setSeams(e.target.checked)} /> Tile lines</label>
        </div>
        <div className="mx-auto w-full overflow-hidden rounded-xl border bg-white dark:border-slate-700" style={{ aspectRatio: `${s.w} / ${s.h}`, maxWidth: `min(100%, ${(78 * s.w) / s.h}vh)` }}
          dangerouslySetInnerHTML={{ __html: shown }} />
        <ValidationPanel report={report} />
        <p className="text-xs text-slate-500">{layout ? `${procOnly ? 'procedural pattern' : layout.instances.length + ' elements'} · seed ${s.seed} · same seed + settings = same pattern. Colour changes keep the layout.` : ''}</p>
      </div>
    </div>
  );
}
