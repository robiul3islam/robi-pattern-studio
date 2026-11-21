import { CATEGORIES } from '../../data/categories';
import { CATEGORY_CONFIG } from '../../data/categoryConfig';
import { ELEMENTS_BY_ID } from '../../data/elements';
import { QUICK_PALETTES } from '../../data/palettes';
import { buildSvg, elementThumb } from '../../engines/vector/buildSvg';
import { generateLayout } from '../../engines/pattern/generate';
import { defaultSettings, paletteFor } from '../../engines/project/store';
import { PROCS, procDefaults } from '../../engines/procedural';

const procThumb = (cat: string, proc: string) => {
  const pal = QUICK_PALETTES.find(p => p.id === paletteFor(cat, proc))!;
  const st = { ...defaultSettings(cat), proc, pv: procDefaults(proc), w: 400, h: 400 };
  return buildSvg(generateLayout(st), { colors: pal.colors, bg: pal.colors[4], outline: '#222222' }).replace(/width="\d+" height="\d+" viewBox/, 'width="100%" height="100%" viewBox');
};

export default function CategoriesPage({ onUse }: { onUse: (id: string) => void }) {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {CATEGORIES.map(c => {
        const cfg = CATEGORY_CONFIG[c.id];
        const pal = QUICK_PALETTES.find(p => p.id === cfg.palette)!;
        return (
          <section key={c.id} className="rounded-xl border bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
            <div className="mb-2 flex items-center justify-between">
              <h3 className="font-semibold">{c.name}</h3>
              <span className="text-xs text-slate-500">{cfg.procs ? `${cfg.procs.length} styles` : `${cfg.elements.length} elements · ${cfg.mode}`}</span>
            </div>
            {cfg.procs && <div className="mb-3 flex flex-wrap gap-2">{cfg.procs.map(id => <div key={id} title={PROCS[id].name} className="h-24 w-24 overflow-hidden rounded border dark:border-slate-700" dangerouslySetInnerHTML={{ __html: procThumb(c.id, id) }} />)}</div>}
            <div className="mb-3 flex flex-wrap gap-1">
              {cfg.elements.map(id => (
                <div key={id} title={ELEMENTS_BY_ID[id].name} className="h-12 w-12 rounded p-1" style={{ background: pal.colors[4] }}
                  dangerouslySetInnerHTML={{ __html: elementThumb(id, pal.colors, pal.colors[4].startsWith('#f') || pal.colors[4] === '#ecfccb' ? '#222222' : '#ffffff') }} />
              ))}
            </div>
            <button onClick={() => onUse(c.id)} className="rounded-lg bg-brand-500 px-3 py-1.5 text-sm text-white hover:bg-brand-600">Use in generator</button>
          </section>
        );
      })}
    </div>
  );
}
