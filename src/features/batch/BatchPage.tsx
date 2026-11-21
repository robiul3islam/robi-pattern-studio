import { useState } from 'react';
import JSZip from 'jszip';
import { CATEGORIES } from '../../data/categories';
import { downloadBlob, fileSafe, svgToPng } from '../../engines/export/png';
import { allCategories, bump, loadProjects, renderSvg, variations, type Project } from '../../engines/project/store';
import { btnPrimary, card, Field, input } from '../shared';

type Source = 'variations' | 'saved' | 'categories';
export default function BatchPage({ work }: { work: Project }) {
  const [source, setSource] = useState<Source>('variations');
  const [n, setN] = useState(10);
  const [svg, setSvg] = useState(true);
  const [png, setPng] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');

  const items = (): Project[] => source === 'variations' ? variations(work, n) : source === 'saved' ? loadProjects() : allCategories(CATEGORIES.map(c => c.id), work.settings.seed);
  const run = async () => {
    setBusy(true); setMsg('');
    try {
      const list = items();
      if (!list.length) throw new Error('nothing to export');
      const zip = new JSZip(); const used = new Set<string>();
      for (let i = 0; i < list.length; i++) {
        const p = list[i]; setMsg(`Rendering ${i + 1}/${list.length}...`);
        let name = fileSafe(p.name); while (used.has(name)) name += '_';
        used.add(name);
        const s = renderSvg(p);
        if (svg) zip.file(`${name}.svg`, s);
        if (png) zip.file(`${name}.png`, await svgToPng(s, p.settings.w, p.settings.h, 2));
      }
      downloadBlob(await zip.generateAsync({ type: 'blob' }), 'robi-batch.zip');
      bump('exports', list.length); setMsg(`Done: ${list.length} patterns in robi-batch.zip.`);
    } catch (e) { setMsg(`Batch failed: ${(e as Error).message}`); }
    setBusy(false);
  };
  return (
    <div className={`${card} max-w-xl space-y-3`}>
      <Field label="Source">
        <select className={input} value={source} onChange={e => setSource(e.target.value as Source)}>
          <option value="variations">New seeds of the current pattern</option>
          <option value="saved">All saved projects</option>
          <option value="categories">One pattern per category ({CATEGORIES.length})</option>
        </select>
      </Field>
      {source === 'variations' && <Field label={`Variations: ${n}`}><input type="range" min={1} max={50} value={n} onChange={e => setN(+e.target.value)} className="w-full" /></Field>}
      <div className="flex gap-4 text-sm">
        <label className="flex items-center gap-2"><input type="checkbox" checked={svg} onChange={e => setSvg(e.target.checked)} /> SVG</label>
        <label className="flex items-center gap-2"><input type="checkbox" checked={png} onChange={e => setPng(e.target.checked)} /> PNG (2x)</label>
      </div>
      <button className={btnPrimary} disabled={busy || !(svg || png)} onClick={run}>{busy ? 'Working...' : 'Export ZIP'}</button>
      {msg && <p className="text-sm text-slate-500" role="status">{msg}</p>}
    </div>
  );
}
