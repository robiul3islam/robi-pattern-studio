import { CheckCircle2, XCircle, AlertTriangle } from 'lucide-react';
import type { SeamlessReport } from '../../engines/seamless/validate';

export default function ValidationPanel({ report }: { report: SeamlessReport | null }) {
  if (!report) return null;
  const { ok, errors, warnings } = report;
  return (
    <div role="status" className={`rounded-xl border p-3 text-sm ${ok ? 'border-green-500/40 bg-green-500/10' : 'border-red-500/50 bg-red-500/10'}`}>
      <div className="flex items-center gap-2 font-semibold">
        {ok ? <CheckCircle2 size={18} className="text-green-500" /> : <XCircle size={18} className="text-red-500" />}
        {ok ? 'Seamless check passed' : `Seamless check FAILED (${errors.length} error${errors.length > 1 ? 's' : ''})`}
      </div>
      <p className="mt-1 text-xs text-slate-500">
        {report.groups} objects in tile · {report.edgeGroups} cross a tile edge · {report.checkedCopies} wrapped copies verified by geometry and transform.
      </p>
      {errors.slice(0, 8).map((e, i) => <p key={i} className="mt-1 text-xs text-red-500">{e}</p>)}
      {errors.length > 8 && <p className="mt-1 text-xs text-red-500">…and {errors.length - 8} more.</p>}
      {warnings.length > 0 && <p className="mt-1 flex items-center gap-1 text-xs text-amber-500"><AlertTriangle size={12} />{warnings.length} warning(s): {warnings[0]}</p>}
    </div>
  );
}
