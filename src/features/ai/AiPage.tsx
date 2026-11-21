import { useMemo, useRef, useState } from 'react';
import { askGemini, localSpec, MODELS, specToProject, type Spec, type Turn } from '../../engines/ai/gemini';
import { bump, layoutOf, newId, renderSvg, safeGet, safeSet, upsertProject, type Project } from '../../engines/project/store';
import { buildTiledPreview, elementThumb } from '../../engines/vector/buildSvg';
import type { PageId } from '../../types';
import { btn, btnPrimary, card, Field, input, Thumb } from '../shared';

const KEY = 'robi.gemini.key', MODEL = 'robi.gemini.model';

export default function AiPage({ work, setWork, go, initialPrompt }: { work: Project; setWork: (p: Project) => void; go: (p: PageId) => void; initialPrompt: string }) {
  const [prompt, setPrompt] = useState(initialPrompt);
  const [refine, setRefine] = useState('');
  const [key, setKey] = useState(() => safeGet(KEY) ?? '');
  const [model, setModel] = useState(() => safeGet(MODEL) ?? MODELS[0]);
  const [useAi, setUseAi] = useState(true);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');
  const [spec, setSpec] = useState<Spec | null>(null);
  const [hist, setHist] = useState<Turn[]>([]);
  const [img, setImg] = useState<{ mime: string; data: string; url: string } | null>(null);
  const [rep, setRep] = useState(2);
  const fileRef = useRef<HTMLInputElement>(null);
  const loadImg = (f?: File) => {
    if (!f) return;
    const url = URL.createObjectURL(f), im = new Image();
    im.onload = () => {
      const k = Math.min(1, 1024 / Math.max(im.width, im.height)), c = document.createElement('canvas');
      c.width = Math.round(im.width * k); c.height = Math.round(im.height * k);
      c.getContext('2d')!.drawImage(im, 0, 0, c.width, c.height);
      const data = c.toDataURL('image/jpeg', 0.85);
      setImg({ mime: 'image/jpeg', data: data.split(',')[1], url: data });
      URL.revokeObjectURL(url);
    };
    im.onerror = () => setErr('Could not read that image.');
    im.src = url;
  };
  const preview = useMemo(() => {
    try { return buildTiledPreview(layoutOf(work), { colors: work.colors, bg: work.bg, outline: work.outline }, rep, false); } catch { return ''; }
  }, [work, rep]);

  const run = async (text: string, history: Turn[]) => {
    if (!text.trim()) { setErr('Write or paste a prompt first.'); return; }
    setBusy(true); setErr(''); setMsg('');
    try {
      const wantAi = useAi && key.trim();
      let sp: Spec, used = '';
      if (wantAi) {
        const r = await askGemini(key.trim(), model, text, history, history.length ? undefined : img ? { mime: img.mime, data: img.data } : undefined); sp = r.spec; used = r.model;
        setHist([...history, { role: 'user', text, image: history.length ? undefined : img ? { mime: img.mime, data: img.data } : undefined }, { role: 'model', text: r.raw }]);
      } else { sp = localSpec(prompt); setHist([]); }
      const p = specToProject(sp, Math.floor(Math.random() * 1e9), `ai-${sp.categoryId}`);
      renderSvg(p); // fail early if it cannot render
      setSpec(sp); setWork({ ...p, id: newId() }); bump('generated');
      setMsg(wantAi ? `Done with ${used}. ${sp.customElements.length} motifs drawn.` : 'No key: keyword match only, library shapes. Add a Gemini key for exact results.');
    } catch (e) { setErr((e as Error).message); }
    setBusy(false);
  };
  const saveKey = () => { safeSet(KEY, key.trim()); safeSet(MODEL, model); setMsg('Key saved in this browser only.'); };
  const clearKey = () => { safeSet(KEY, ''); setKey(''); setMsg('Key removed.'); };
  const variation = () => setWork({ ...work, instances: undefined, settings: { ...work.settings, seed: Math.floor(Math.random() * 1e9) } });
  const motifs = work.customElements ?? [];

  return (
    <div className="grid gap-4 lg:grid-cols-[380px_1fr]">
      <div className="space-y-3">
        <section className={`${card} space-y-3`}>
          <Field label="Prompt (paste from Prompt Generator or any AI)">
            <textarea rows={7} value={prompt} onChange={e => setPrompt(e.target.value)} className={input}
              placeholder="e.g. christmas pattern with snowflakes, pine trees and holly, red green gold on cream" />
          </Field>
          <div className="space-y-1">
            <div className="text-xs">Reference image (optional): the AI copies its look</div>
            <input ref={fileRef} type="file" accept="image/*" hidden onChange={e => { loadImg(e.target.files?.[0]); e.target.value = ''; }} />
            <div className="flex items-center gap-2">
              <button className={btn} onClick={() => fileRef.current?.click()}>{img ? 'Change image' : 'Add image'}</button>
              {img && <><img src={img.url} alt="Reference" className="h-12 w-12 rounded border object-cover" /><button className="text-xs underline" onClick={() => setImg(null)}>Remove</button></>}
            </div>
          </div>
          <label className="flex items-center gap-2 text-xs"><input type="checkbox" checked={useAi} onChange={e => setUseAi(e.target.checked)} /> Use Gemini AI (draws your exact subjects)</label>
          <button className={`${btnPrimary} w-full`} onClick={() => run(prompt, [])} disabled={busy}>{busy ? 'Drawing motifs, 20-90 seconds...' : 'Generate'}</button>
          {err && <p role="alert" className="text-sm text-red-500">{err}</p>}
          {msg && <p role="status" className="text-sm text-slate-500">{msg}</p>}
        </section>
        {hist.length > 0 && (
          <section className={`${card} space-y-2`}>
            <Field label="Not right? Tell the AI what to change">
              <input value={refine} onChange={e => setRefine(e.target.value)} placeholder="e.g. make the tiger orange, add more bamboo, bigger motifs" className={input} />
            </Field>
            <button className={btn} disabled={busy || !refine.trim()} onClick={() => { run(refine, hist); setRefine(''); }}>Refine</button>
          </section>
        )}
        <section className={`${card} space-y-2`}>
          <h3 className="text-sm font-semibold">Gemini setup (free)</h3>
          <ol className="list-decimal pl-4 text-xs text-slate-500">
            <li>Open <a className="underline" href="https://aistudio.google.com/apikey" target="_blank" rel="noreferrer">aistudio.google.com/apikey</a> and sign in.</li>
            <li>Click Create API key and copy it.</li>
            <li>Paste it below and press Save key.</li>
          </ol>
          <input type="password" autoComplete="off" value={key} onChange={e => setKey(e.target.value)} placeholder="Paste API key" className={input} aria-label="Gemini API key" />
          <select value={model} onChange={e => setModel(e.target.value)} className={input} aria-label="Model">{MODELS.map(m => <option key={m}>{m}</option>)}</select>
          <div className="flex gap-2"><button className={btn} onClick={saveKey} disabled={!key.trim()}>Save key</button><button className={btn} onClick={clearKey}>Remove</button></div>
          <p className="text-xs text-slate-500">Key stays in this browser only. Never put it in GitHub files. If a model is full or missing, the app tries the next one by itself.</p>
        </section>
      </div>
      <div className="space-y-3">
        <div className="mx-auto w-full max-w-xl overflow-hidden rounded-xl border bg-white dark:border-slate-700" style={{ aspectRatio: `${work.settings.w} / ${work.settings.h}` }} dangerouslySetInnerHTML={{ __html: preview }} />
        <div className="flex flex-wrap gap-2">
          <button className={btn} onClick={variation}>New variation</button>
          {[1, 2, 3].map(n => <button key={n} className={`${btn} ${rep === n ? 'bg-brand-500 text-white' : ''}`} onClick={() => setRep(n)}>{n}x{n}</button>)}
          <button className={btn} onClick={() => go('generator')}>Open in Generator</button>
          <button className={btn} onClick={() => go('editor')}>Edit</button>
          <button className={btn} onClick={() => go('export')}>Export</button>
          <button className={btn} onClick={() => setMsg(upsertProject(work) ? 'Saved to My Projects.' : 'Save failed: storage unavailable.')}>Save project</button>
        </div>
        {spec && (
          <section className={`${card} space-y-2 text-sm`}>
            <h3 className="font-semibold">What the AI understood</h3>
            {spec.summary && <p>{spec.summary}</p>}
            <div className="flex items-center gap-2">{work.colors.map((c, i) => <span key={i} title={c} style={{ background: c }} className="h-5 w-8 rounded border dark:border-slate-700" />)}<span className="text-xs text-slate-500">last = background</span></div>
            {motifs.length > 0 && <div className="flex flex-wrap gap-2">{motifs.map(m => <div key={m.id} className="text-center text-xs"><Thumb svg={elementThumb(m.id, work.colors, work.outline)} className="h-16 w-16" />{m.name}</div>)}</div>}
            <p className="text-xs text-slate-500">Layout: {spec.mode}, {spec.count} items. Tell Refine to change anything above.</p>
          </section>
        )}
      </div>
    </div>
  );
}
