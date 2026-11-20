import { useMemo } from 'react';
import { AlertTriangle, CheckCircle2, XCircle } from 'lucide-react';
import { checkQuality } from '../../engines/quality/check';
import { renderSvg, type Project } from '../../engines/project/store';
import { card } from '../shared';

export default function QualityPage({ work }: { work: Project }) {
  const rep = useMemo(() => { try { return checkQuality(renderSvg(work), work.settings.w, work.settings.h); } catch { return null; } }, [work]);
  if (!rep) return <p role="alert" className="text-red-500">Could not render this pattern.</p>;
  const Icon = { pass: CheckCircle2, warn: AlertTriangle, fail: XCircle };
  const col = { pass: 'text-green-500', warn: 'text-amber-500', fail: 'text-red-500' };
  return (
    <div className="max-w-2xl space-y-4">
      <div className={`${card} flex items-center justify-between`}>
        <div><div className="text-sm text-slate-500">Stock readiness for</div><div className="font-semibold">{work.name}</div></div>
        <div className="text-3xl font-extrabold">{rep.score}<span className="text-base font-normal text-slate-500">/100</span></div>
      </div>
      <div className={`${card} divide-y dark:divide-slate-800`}>
        {rep.checks.map(c => { const I = Icon[c.status]; return (
          <div key={c.id} className="flex gap-3 py-2 text-sm"><I size={18} className={`mt-0.5 shrink-0 ${col[c.status]}`} />
            <div><div className="font-medium">{c.label}</div><div className="text-slate-500">{c.detail}</div></div></div>); })}
      </div>
      <p className="text-xs text-slate-500">Automatic checks only. Each stock site has its own rules: read them before upload.</p>
    </div>
  );
}
