import { useEffect, useMemo, useState } from 'react';
import { Copy } from 'lucide-react';
import { buildMetadata, SITES, type Site } from '../../engines/metadata/build';
import { layoutOf, type Project } from '../../engines/project/store';
import { STYLES } from '../../engines/prompt/build';
import { btn, card, copyText, Field, input } from '../shared';

export default function MetadataPage({ work }: { work: Project }) {
  const [site, setSite] = useState<Site>('adobe');
  const [style, setStyle] = useState<string>(STYLES[0]);
  const base = useMemo(() => {
    const ids = [...new Set(layoutOf(work).instances.map(i => i.el))];
    return buildMetadata({ categoryId: work.settings.categoryId, elementIds: ids, colors: work.colors, style }, site);
  }, [work, site, style]);
  const [title, setTitle] = useState(base.title);
  const [desc, setDesc] = useState(base.description);
  const [kw, setKw] = useState(base.keywords.join(', '));
  useEffect(() => { setTitle(base.title); setDesc(base.description); setKw(base.keywords.join(', ')); }, [base]);
  const lim = SITES[site];
  const n = kw.split(',').map(s => s.trim()).filter(Boolean).length;
  const Row = ({ label, value, set, max, rows = 1 }: { label: string; value: string; set: (v: string) => void; max: string; rows?: number }) => (
    <div>
      <div className="mb-1 flex justify-between text-xs"><span>{label} <span className="text-slate-500">{max}</span></span>
        <button className="flex items-center gap-1" onClick={() => copyText(value)}><Copy size={12} /> Copy</button></div>
      <textarea rows={rows} value={value} onChange={e => set(e.target.value)} className={input} aria-label={label} />
    </div>
  );
  return (
    <div className={`${card} max-w-2xl space-y-4`}>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Marketplace"><select className={input} value={site} onChange={e => setSite(e.target.value as Site)}>{Object.keys(SITES).map(s => <option key={s}>{s}</option>)}</select></Field>
        <Field label="Art style"><select className={input} value={style} onChange={e => setStyle(e.target.value)}>{STYLES.map(s => <option key={s}>{s}</option>)}</select></Field>
      </div>
      <Row label="Title" value={title} set={setTitle} max={`${title.length}/${lim.title}`} />
      <Row label="Description" value={desc} set={setDesc} max={`${desc.length}/${lim.desc}`} rows={3} />
      <Row label="Keywords" value={kw} set={setKw} max={`${n}/${lim.kw}`} rows={5} />
      {n > lim.kw && <p className="text-xs text-red-500">Too many keywords for {site}. Remove {n - lim.kw}.</p>}
      <button className={btn} onClick={() => copyText(`${title}\n${desc}\n${kw}`)}>Copy all</button>
    </div>
  );
}
