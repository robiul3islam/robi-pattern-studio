import { useState } from 'react';
import { Plus } from 'lucide-react';
import { CATEGORIES } from '../data/categories';
import { QUICK_PALETTES } from '../data/palettes';
import type { PageId } from '../types';
import { loadExports, loadProjects, loadStats, renderSvg, type Project } from '../engines/project/store';
import { Thumb } from '../features/shared';

export default function Dashboard({ go, onOpen }: { go: (p: PageId) => void; onOpen: (p: Project) => void }) {
  const projects = loadProjects().slice(0, 3), stats = loadStats(), exps = loadExports().slice(0, 3);
  const svgOf = (p: Project) => { try { return renderSvg(p); } catch { return ''; } };
  const [copied, setCopied] = useState('');
  const copy = async (hex: string) => {
    try { await navigator.clipboard.writeText(hex); setCopied(hex); setTimeout(() => setCopied(''), 1200); } catch { setCopied('copy failed'); }
  };
  const card = 'rounded-xl border bg-white p-4 dark:border-slate-800 dark:bg-slate-900';
  const empty = 'text-sm text-slate-500';
  return (
    <div className="space-y-6">
      <button onClick={() => go('generator')} className="flex items-center gap-2 rounded-lg bg-brand-500 px-4 py-2 font-medium text-white hover:bg-brand-600">
        <Plus size={18} /> New Pattern
      </button>
      <div className="grid gap-4 md:grid-cols-3">
        <section className={card}><h3 className="mb-2 font-semibold">Recent Projects</h3>{projects.length === 0 ? <p className={empty}>No saved projects yet.</p> : <div className="flex gap-2">{projects.map(p => <button key={p.id} title={p.name} onClick={() => onOpen(p)} className="h-16 w-16"><Thumb svg={svgOf(p)} className="h-16 w-16" /></button>)}</div>}</section>
        <section className={card}><h3 className="mb-2 font-semibold">Favorite Patterns</h3><p className={empty}>No favorites yet.</p></section>
        <section className={card}><h3 className="mb-2 font-semibold">Generation Statistics</h3><p className={empty}>Patterns generated: {stats.generated}<br />Exports: {stats.exports}</p></section>
      </div>
      <section className={card}>
        <h3 className="mb-3 font-semibold">Quick Color Palettes <span className="text-xs font-normal text-slate-500">(click swatch to copy HEX{copied && ` — ${copied}`})</span></h3>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {QUICK_PALETTES.map(p => (
            <div key={p.id}>
              <div className="mb-1 text-xs text-slate-500">{p.name} · {p.group}</div>
              <div className="flex overflow-hidden rounded-lg border dark:border-slate-700">
                {p.colors.map(c => <button key={c} title={c} aria-label={`Copy ${c}`} onClick={() => copy(c)} style={{ background: c }} className="h-9 flex-1" />)}
              </div>
            </div>
          ))}
        </div>
      </section>
      <section className={card}>
        <h3 className="mb-3 font-semibold">Pattern Categories ({CATEGORIES.length})</h3>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {CATEGORIES.map(c => (
            <div key={c.id} className="flex items-center gap-2 rounded-lg border px-3 py-2 text-sm dark:border-slate-700">
              <span className="h-3 w-3 rounded-full" style={{ background: c.accent }} />{c.name}
            </div>
          ))}
        </div>
      </section>
      <section className={card}><h3 className="mb-2 font-semibold">Recently Exported Files</h3>{exps.length === 0 ? <p className={empty}>No exports yet.</p> : exps.map((e, i) => <div key={i} className="text-sm">{e.name} <span className="text-slate-500">· {e.fmt}</span></div>)}</section>
    </div>
  );
}
