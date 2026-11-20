import { useState } from 'react';
import { pngSize, svgToPng, downloadBlob, fileSafe } from '../../engines/export/png';
import { loadExports, logExport, renderSvg, type Project } from '../../engines/project/store';
import { btnPrimary, card, Field, input } from '../shared';

export default function ExportPage({ work }: { work: Project }) {
  const [fmt, setFmt] = useState({ svg: true, png: false, json: false });
  const [scale, setScale] = useState(2);
  const [transparent, setTransparent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');
  const [log, setLog] = useState(loadExports);
  const { w, h } = work.settings;
  const px = pngSize(w, h, scale);
  const base = fileSafe(work.name);

  const run = async () => {
    setBusy(true); setMsg('');
    try {
      const svg = renderSvg(work, transparent);
      if (fmt.svg) { downloadBlob(new Blob([svg], { type: 'image/svg+xml' }), `${base}.svg`); logExport(`${base}.svg`, 'SVG'); }
      if (fmt.png) { downloadBlob(await svgToPng(svg, w, h, scale), `${base}_${px.w}px.png`); logExport(`${base}.png`, 'PNG'); }
      if (fmt.json) { downloadBlob(new Blob([JSON.stringify(work, null, 2)], { type: 'application/json' }), `${base}.json`); logExport(`${base}.json`, 'JSON'); }
      setLog(loadExports());
    } catch (e) { setMsg(`Export failed: ${(e as Error).message}`); }
    setBusy(false);
  };
  return (
    <div className="grid max-w-3xl gap-4 md:grid-cols-2">
      <section className={`${card} space-y-3`}>
        <div className="text-sm font-semibold">{work.name}</div>
        {(['svg', 'png', 'json'] as const).map(k => (
          <label key={k} className="flex items-center gap-2 text-sm"><input type="checkbox" checked={fmt[k]} onChange={e => setFmt({ ...fmt, [k]: e.target.checked })} /> {k.toUpperCase()}{k === 'json' && ' (project file)'}</label>
        ))}
        <Field label={`PNG scale (${px.w} x ${px.h}px, max 8000)`}>
          <select className={input} value={scale} onChange={e => setScale(+e.target.value)}>{[1, 2, 3, 4, 8].map(s => <option key={s} value={s}>{s}x</option>)}</select>
        </Field>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={transparent} onChange={e => setTransparent(e.target.checked)} /> Transparent background (SVG, PNG)</label>
        <button className={btnPrimary} disabled={busy || !(fmt.svg || fmt.png || fmt.json)} onClick={run}>{busy ? 'Exporting...' : 'Export'}</button>
        {msg && <p role="alert" className="text-sm text-red-500">{msg}</p>}
      </section>
      <section className={card}>
        <h3 className="mb-2 font-semibold">Recent exports</h3>
        {log.length === 0 ? <p className="text-sm text-slate-500">No exports yet.</p> : log.map((l, i) => <div key={i} className="flex justify-between text-sm"><span>{l.name}</span><span className="text-slate-500">{new Date(l.at).toLocaleTimeString()}</span></div>)}
      </section>
    </div>
  );
}
