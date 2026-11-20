import { useRef, useState } from 'react';
import { deleteProject, loadProjects, newId, parseProjects, renderSvg, upsertProject, type Project } from '../../engines/project/store';
import { downloadBlob } from '../../engines/export/png';
import { btn, card, input, Thumb } from '../shared';

export default function ProjectsPage({ onOpen }: { onOpen: (p: Project) => void }) {
  const [list, setList] = useState(loadProjects);
  const [msg, setMsg] = useState('');
  const file = useRef<HTMLInputElement>(null);
  const refresh = () => setList(loadProjects());
  const thumb = (p: Project) => { try { return renderSvg(p); } catch { return ''; } };
  const rename = (p: Project, name: string) => { upsertProject({ ...p, name }); refresh(); };
  const importFile = async (f?: File) => {
    if (!f) return;
    try {
      const ps = parseProjects(await f.text());
      if (!ps.length) throw new Error('no projects in file');
      ps.forEach(p => upsertProject({ ...p, id: newId() })); refresh(); setMsg(`Imported ${ps.length}.`);
    } catch (e) { setMsg(`Import failed: ${(e as Error).message}`); }
  };
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <button className={btn} onClick={() => file.current?.click()}>Import JSON</button>
        <button className={btn} disabled={!list.length} onClick={() => downloadBlob(new Blob([JSON.stringify(list, null, 2)], { type: 'application/json' }), 'robi-projects.json')}>Export all</button>
        <input ref={file} type="file" accept="application/json" hidden onChange={e => { importFile(e.target.files?.[0]); e.target.value = ''; }} />
        {msg && <span className="text-sm text-slate-500">{msg}</span>}
      </div>
      {list.length === 0 ? <p className="text-sm text-slate-500">No saved projects. Save one from Pattern Generator.</p> : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {list.map(p => (
            <div key={p.id} className={`${card} space-y-2`}>
              <Thumb svg={thumb(p)} className="aspect-square w-full" />
              <input defaultValue={p.name} onBlur={e => e.target.value !== p.name && rename(p, e.target.value || p.name)} className={input} aria-label="Project name" />
              <div className="text-xs text-slate-500">{new Date(p.createdAt).toLocaleDateString()}{p.instances ? ' · edited' : ''}</div>
              <div className="flex gap-1">
                <button className={btn} onClick={() => onOpen(p)}>Open</button>
                <button className={btn} onClick={() => { upsertProject({ ...p, id: newId(), name: `${p.name} copy`, createdAt: Date.now() }); refresh(); }}>Copy</button>
                <button className={btn} onClick={() => { deleteProject(p.id); refresh(); }}>Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
