import { TRENDS } from '../../data/trends';
import { QUICK_PALETTES } from '../../data/palettes';
import { btnPrimary, card } from '../shared';

export default function TrendPage({ onUse }: { onUse: (categoryId: string, paletteId: string) => void }) {
  return (
    <div className="space-y-3">
      <p className="text-sm text-slate-500">Curated starting points by season and style. Editorial presets, not live market data.</p>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {TRENDS.map(t => (
          <div key={t.id} className={`${card} space-y-2`}>
            <div className="flex justify-between"><h3 className="font-semibold">{t.name}</h3><span className="text-xs text-slate-500">{t.season}</span></div>
            <p className="text-sm text-slate-500">{t.note}</p>
            <div className="flex overflow-hidden rounded border dark:border-slate-700">{QUICK_PALETTES.find(p => p.id === t.paletteId)?.colors.map(c => <span key={c} style={{ background: c }} className="h-6 flex-1" />)}</div>
            <button className={btnPrimary} onClick={() => onUse(t.categoryId, t.paletteId)}>Use in generator</button>
          </div>
        ))}
      </div>
    </div>
  );
}
