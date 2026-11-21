import { useMemo, useState } from 'react';
import { QUICK_PALETTES } from '../../data/palettes';
import { typographyProject, type TypoOpts } from '../../engines/typography/build';
import { GLYPH_CHARS } from '../../engines/typography/glyphs';
import { bump, layoutOf, newId, renderOpts, upsertProject, type Project } from '../../engines/project/store';
import { buildTiledPreview } from '../../engines/vector/buildSvg';
import type { PageId } from '../../types';
import BgPanel from '../bgpanel';
import { btn, btnPrimary, card, Field, input } from '../shared';

export default function TypoPage({ work, setWork, go }: { work: Project; setWork: (p: Project) => void; go: (p: PageId) => void }) {
  const [o, setO] = useState<TypoOpts>({ text: 'LUXE ATELIER', mode: 'words', weight: 1.4, size: 30, layout: 'halfdrop', paletteId: 'gold-1', filler: true });
  const [err, setErr] = useState('');
  const [msg, setMsg] = useState('');
  const isTypo = work.settings.categoryId === 'typography';
  const preview = useMemo(() => { try { return isTypo ? buildTiledPreview(layoutOf(work), renderOpts(work), 2, false) : ''; } catch { return ''; } }, [work, isTypo]);
  const set = (p: Partial<TypoOpts>) => setO(v => ({ ...v, ...p }));
  const make = (seed = Math.floor(Math.random() * 1e9)) => {
    try { const p = typographyProject(o, seed); setWork({ ...p, id: newId(), bgPattern: isTypo ? work.bgPattern : undefined }); bump('generated'); setErr(''); }
    catch (e) { setErr((e as Error).message); }
  };
  return (
    <div className="grid gap-4 lg:grid-cols-[340px_1fr]">
      <section className={`${card} space-y-3`}>
        <Field label="Text (words separated by space)"><textarea rows={3} value={o.text} onChange={e => set({ text: e.target.value })} className={input} /></Field>
        <p className="text-xs text-slate-500">Letters: {GLYPH_CHARS.replace('♥', '')} ♥ (max 6 words)</p>
        <div className="grid grid-cols-2 gap-2">
          <Field label="Style"><select className={input} value={o.mode} onChange={e => set({ mode: e.target.value as TypoOpts['mode'] })}><option value="words">whole words</option><option value="letters">single letters</option></select></Field>
          <Field label="Layout"><select className={input} value={o.layout} onChange={e => set({ layout: e.target.value as TypoOpts['layout'] })}><option>halfdrop</option><option>brick</option><option>grid</option></select></Field>
        </div>
        <Field label="Palette"><select className={input} value={o.paletteId} onChange={e => set({ paletteId: e.target.value })}>{QUICK_PALETTES.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select></Field>
        <Field label={`Letter size ${o.size}%`}><input type="range" min={14} max={46} value={o.size} onChange={e => set({ size: +e.target.value })} className="w-full" /></Field>
        <Field label={`Line weight ${o.weight}`}><input type="range" min={0.5} max={3} step={0.1} value={o.weight} onChange={e => set({ weight: +e.target.value })} className="w-full" /></Field>
        <label className="flex items-center gap-2 text-xs"><input type="checkbox" checked={o.filler} onChange={e => set({ filler: e.target.checked })} /> Add sparkles between</label>
        <button className={`${btnPrimary} w-full`} onClick={() => make()}>Generate</button>
        {err && <p role="alert" className="text-sm text-red-500">{err}</p>}
        {isTypo && <BgPanel value={work.bgPattern} onChange={bgPattern => setWork({ ...work, bgPattern })} base={work.colors[0]} />}
      </section>
      <div className="space-y-2">
        {isTypo ? <>
          <div className="mx-auto w-full max-w-xl overflow-hidden rounded-xl border bg-white dark:border-slate-700" style={{ aspectRatio: `${work.settings.w} / ${work.settings.h}` }} dangerouslySetInnerHTML={{ __html: preview }} />
          <div className="flex flex-wrap gap-2">
            <button className={btn} onClick={() => make()}>New variation</button>
            <button className={btn} onClick={() => go('generator')}>Open in Generator</button>
            <button className={btn} onClick={() => go('editor')}>Edit</button>
            <button className={btn} onClick={() => go('export')}>Export</button>
            <button className={btn} onClick={() => setMsg(upsertProject(work) ? 'Saved to My Projects.' : 'Save failed: storage unavailable.')}>Save project</button>
          </div>
          {msg && <p className="text-xs text-slate-500" role="status">{msg}</p>}
        </> : <p className="text-sm text-slate-500">Type your text and press Generate.</p>}
      </div>
    </div>
  );
}
