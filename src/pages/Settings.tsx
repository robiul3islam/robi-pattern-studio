export default function Settings({ dark, setDark }: { dark: boolean; setDark: (d: boolean) => void }) {
  return (
    <div className="max-w-md space-y-4 rounded-xl border bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
      <label className="flex items-center justify-between">
        <span>Dark theme</span>
        <input type="checkbox" checked={dark} onChange={e => setDark(e.target.checked)} className="h-5 w-5" />
      </label>
    </div>
  );
}
