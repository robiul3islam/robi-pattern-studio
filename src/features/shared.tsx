import type { ReactNode } from 'react';
export const card = 'rounded-xl border bg-white p-4 dark:border-slate-800 dark:bg-slate-900';
export const btn = 'rounded-lg border px-3 py-2 text-sm dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40';
export const btnPrimary = 'rounded-lg bg-brand-500 px-3 py-2 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-40';
export const input = 'w-full rounded border bg-transparent px-2 py-1 text-sm dark:border-slate-700';
export const Thumb = ({ svg, className = '' }: { svg: string; className?: string }) => (
  <div className={`overflow-hidden rounded-lg border bg-white dark:border-slate-700 [&>svg]:h-full [&>svg]:w-full ${className}`} dangerouslySetInnerHTML={{ __html: svg }} />
);
export const Field = ({ label, children }: { label: string; children: ReactNode }) => <label className="block text-xs">{label}{children}</label>;
export const copyText = async (t: string) => { try { await navigator.clipboard.writeText(t); return true; } catch { return false; } };
