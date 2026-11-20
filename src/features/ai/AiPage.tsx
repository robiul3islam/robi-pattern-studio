import { useMemo, useState } from 'react';
import { askGemini, localSpec, MODELS, specToProject } from '../../engines/ai/gemini';
import { bump, newId, renderSvg, safeGet, safeSet, upsertProject, type Project } from '../../engines/project/store';
import { buildTiledPreview } from '../../engines/vector/buildSvg';
import { layoutOf } from '../../engines/project/store';
import type { PageId } from '../../types';
import { btn, btnPrimary, card, Field, input } from '../shared';

const KEY = 'robi.gemini.key', MODEL = 'robi.gemini.model';

export default function AiPage({ work, setWork, go }: { work: Project; setWork: (p: Project) => void; go: (p: PageId) => void }) {
  const [prompt, setPrompt] = useState('');
  const [key, setKey] = useState(() => safeGet(KEY) ?? '');
  const [model, setModel] = useState(() => safeGet(MODEL) ?? MODELS[0]);
  const [useAi, setUseAi] = useState(true);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');
  const preview = useMemo(() => {
    try { return buildTiledPreview(layoutOf(work), { colors: work.colors, bg: work.bg, outline: work.outline }, 3, false); } catch { return ''; }
  }, [work]);

  const generate = async () => {
    if (!prompt.trim()) { setErr('Write or paste a prompt first.'); return; }
    setBusy(true); setErr(''); setMsg('');
    try {
      const wantAi = useAi && key.trim();
      const spec = wantAi ? await askGemini(key.trim(), model, prompt) : localSpec(prompt);
      const p = specToProject(spec, Math.floor(Math.random() * 1e9), `ai-${spec.categoryId}`);
      renderSvg(p); // fail early if something is unrenderable
      setWork({ ...p, id: newId() }); bump('generated');
      setMsg(wantAi ? `Made with ${model}: ${spec.categoryId}, ${spec.elements.length} elements.` : 'Made without AI (keyword match). Add a Gemini key for smarter results.');
    } catch (e) { setErr((e as Error).message); }
    setBusy(false);
  };
  const saveKey = () => { safeSet(KEY, key.trim()); safeSet(MODEL, model); setMsg('Key saved in this browser only.'); };
  const clearKey = () => { safeSet(KEY, ''); setKey(''); setMsg('Key removed.'); };
  const variation = () => setWork({ ...work, instances: undefined, settings: { ...work.settings, seed: Math.floor(Math.random() * 1e9) } });

  return (
    <div className="grid gap-4 lg:grid-cols-[380px_1fr]">
      <div className="space-y-3">
        <section className={`${card} space-y-3`}>
          <Field label="Prompt (paste from Prompt Generator or any AI)">
            <textarea rows={7} value={prompt} onChange={e => setPrompt(e.target.value)} className={input}
              placeholder="e.g. christmas pattern with snowflakes, pine trees and holly, red green gold on cream" />
          </Field>
          <label className="flex items-center gap-2 text-xs"><input type="checkbox" checked={useAi} onChange={e => setUseAi(e.target.checked)} /> Use Gemini AI (needs key)</label>
          <button className={`${btnPrimary} w-full`} onClick={generate} disabled={busy}>{busy ? 'Generating...' : 'Generate'}</button>
          {err && <p role="alert" className="text-sm text-red-500">{err}</p>}
          {msg && <p role="status" className="text-sm text-slate-500">{msg}</p>}
        </section>
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
          <p className="text-xs text-slate-500">The key stays in this browser only. Never put it in GitHub files. Free tier has daily limits; if a model fails, pick another.</p>
        </section>
      </div>
      <div className="space-y-2">
        <div className="mx-auto w-full max-w-xl overflow-hidden rounded-xl border bg-white dark:border-slate-700" style={{ aspectRatio: `${work.settings.w} / ${work.settings.h}` }} dangerouslySetInnerHTML={{ __html: preview }} />
        <div className="flex flex-wrap gap-2">
          <button className={btn} onClick={variation}>New variation</button>
          <button className={btn} onClick={() => go('generator')}>Open in Generator</button>
          <button className={btn} onClick={() => go('editor')}>Edit</button>
          <button className={btn} onClick={() => go('export')}>Export</button>
          <button className={btn} onClick={() => { setMsg(upsertProject(work) ? 'Saved to My Projects.' : 'Save failed: storage unavailable.'); }}>Save project</button>
        </div>
        <p className="text-xs text-slate-500">Preview shows a 3 x 3 repeat. Elements used: {(work.settings.elements ?? []).join(', ') || 'category default'}.</p>
      </div>
    </div>
  );
}
