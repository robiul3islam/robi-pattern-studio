export default function Placeholder({ title, phase }: { title: string; phase: number }) {
  return (
    <div className="rounded-xl border border-dashed p-10 text-center dark:border-slate-700">
      <h3 className="text-lg font-semibold">{title}</h3>
      <p className="mt-2 text-sm text-slate-500">Not built yet. Scheduled for Phase {phase}.</p>
    </div>
  );
}
