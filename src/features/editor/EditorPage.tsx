import { useEffect, useMemo, useRef, useState } from 'react';
import { Copy, Trash2, Undo2 } from 'lucide-react';
import { ELEMENTS } from '../../data/elements';
import { layoutOf, renderSvg, type Project } from '../../engines/project/store';
import type { Instance } from '../../types';
import { btn, btnPrimary, card, Field, input, Thumb } from '../shared';

export default function EditorPage({ work, setWork }: { work: Project; setWork: (p: Project) => void }) {
  const [sel, setSel] = useState<number | null>(null);
  const [addEl, setAddEl] = useState(ELEMENTS[0].id);
  const hist = useRef<(Instance[] | undefined)[]>([]);
  const [, force] = useState(0);
  const layout = useMemo(() => layoutOf(work), [work]);
  const svg = useMemo(() => renderSvg(work), [work]);
  const { w, h } = layout;
  const cur = layout.instances.find(i => i.n === sel) ?? null;

  const commit = (instances: Instance[] | undefined) => {
    hist.current.push(work.instances); if (hist.current.length > 50) hist.current.shift();
    setWork({ ...work, instances }); force(x => x + 1);
  };
  const patch = (n: number, p: Partial<Instance>) => commit(layout.instances.map(i => (i.n === n ? { ...i, ...p } : i)));
  const wrap = (v: number, m: number) => ((v % m) + m) % m;
  const undo = () => { if (!hist.current.length) return; setWork({ ...work, instances: hist.current.pop() }); force(x => x + 1); };

  useEffect(() => {
    document.querySelectorAll<SVGGElement>('#editor-canvas g[id^="e"]').forEach(g => { g.style.filter = ''; });
    if (sel === null) return;
    document.querySelectorAll<SVGGElement>(`#editor-canvas g[id="e${sel}"], #editor-canvas g[id^="e${sel}_"]`)
      .forEach(g => { g.style.filter = 'drop-shadow(0 0 8px #6d5efc)'; });
  }, [sel, svg]);

  const pick = (e: React.MouseEvent) => {
    const g = (e.target as Element).closest('g[id^="e"]');
    const m = g?.id.match(/^e(\d+)/);
    setSel(m ? +m[1] : null);
  };
  const del = () => { if (cur) { commit(layout.instances.filter(i => i.n !== cur.n)); setSel(null); } };
  const dup = () => {
    if (!cur) return; const n = Math.max(-1, ...layout.instances.map(i => i.n)) + 1;
    commit([...layout.instances, { ...cur, n, x: wrap(cur.x + 60, w), y: wrap(cur.y + 60, h) }]); setSel(n);
  };
  const add = () => {
    const n = Math.max(-1, ...layout.instances.map(i => i.n)) + 1;
    commit([...layout.instances, { n, el: addEl, x: w / 2, y: h / 2, s: 1, r: 0, flip: false, c: [0, 1, 2] }]); setSel(n);
  };
  const colorOpts = work.colors.slice(0, 4);

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_300px]">
      <div className="space-y-2">
        <div id="editor-canvas" onClick={pick} className="mx-auto cursor-pointer overflow-hidden rounded-xl border bg-white dark:border-slate-700 [&>svg]:h-full [&>svg]:w-full"
          style={{ aspectRatio: `${w} / ${h}`, maxWidth: `min(100%, ${(78 * w) / h}vh)` }} dangerouslySetInnerHTML={{ __html: svg }} />
        <p className="text-xs text-slate-500">Click an element to edit it. Edits keep the tile seamless. Changing settings in Pattern Generator resets edits.</p>
      </div>
      <div className={`${card} space-y-3`}>
        <div className="flex gap-2">
          <button className={btn} onClick={undo} disabled={!hist.current.length}><Undo2 size={14} className="inline" /> Undo</button>
          <button className={btn} onClick={() => commit(undefined)} disabled={!work.instances}>Reset edits</button>
        </div>
        <div className="flex gap-2">
          <select value={addEl} onChange={e => setAddEl(e.target.value)} className={input}>{ELEMENTS.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}</select>
          <button className={btnPrimary} onClick={add}>Add</button>
        </div>
        {cur ? (
          <div className="space-y-2">
            <div className="text-sm font-semibold">#{cur.n} · {cur.el}</div>
            <Field label={`X ${Math.round(cur.x)}`}><input type="range" min={0} max={w} value={cur.x} onChange={e => patch(cur.n, { x: wrap(+e.target.value, w) })} className="w-full" /></Field>
            <Field label={`Y ${Math.round(cur.y)}`}><input type="range" min={0} max={h} value={cur.y} onChange={e => patch(cur.n, { y: wrap(+e.target.value, h) })} className="w-full" /></Field>
            <Field label={`Scale ${cur.s}`}><input type="range" min={0.1} max={3} step={0.05} value={cur.s} onChange={e => patch(cur.n, { s: +e.target.value })} className="w-full" /></Field>
            <Field label={`Rotation ${cur.r}°`}><input type="range" min={-180} max={180} value={cur.r} onChange={e => patch(cur.n, { r: +e.target.value })} className="w-full" /></Field>
            <label className="flex items-center gap-2 text-xs"><input type="checkbox" checked={cur.flip} onChange={e => patch(cur.n, { flip: e.target.checked })} /> Flip</label>
            <div className="grid grid-cols-3 gap-2">
              {[0, 1, 2].map(k => (
                <Field key={k} label={['Main', 'Second', 'Third'][k]}>
                  <select value={cur.c[k]} className={input} onChange={e => { const c = [...cur.c] as Instance['c']; c[k] = +e.target.value; patch(cur.n, { c }); }}>
                    {colorOpts.map((col, idx) => <option key={idx} value={idx}>{idx + 1} {col}</option>)}
                  </select>
                </Field>
              ))}
            </div>
            <div className="flex gap-2">
              <button className={btn} onClick={dup}><Copy size={14} className="inline" /> Duplicate</button>
              <button className={btn} onClick={del}><Trash2 size={14} className="inline" /> Delete</button>
            </div>
          </div>
        ) : <p className="text-sm text-slate-500">No element selected.</p>}
        <Thumb svg={svg} className="h-24 w-24" />
      </div>
    </div>
  );
}
