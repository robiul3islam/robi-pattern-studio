import { useEffect, useState } from 'react';
import { Moon, Sun } from 'lucide-react';
import { NAV } from './app/nav';
import Dashboard from './pages/Dashboard';
import Placeholder from './pages/Placeholder';
import Settings from './pages/Settings';
import GeneratorPage from './features/generator/GeneratorPage';
import CategoriesPage from './features/categories/CategoriesPage';
import PromptPage from './features/prompt/PromptPage';
import ColorStudio from './features/color/ColorStudio';
import EditorPage from './features/editor/EditorPage';
import QualityPage from './features/quality/QualityPage';
import MetadataPage from './features/metadata/MetadataPage';
import ExportPage from './features/export/ExportPage';
import ProjectsPage from './features/projects/ProjectsPage';
import TrendPage from './features/trend/TrendPage';
import AiPage from './features/ai/AiPage';
import BatchPage from './features/batch/BatchPage';
import { defaultProject, safeGet, safeSet, setCustomPalette, type Project } from './engines/project/store';
import type { PageId } from './types';

export default function App() {
  const [page, setPage] = useState<PageId>('dashboard');
  const [cat, setCat] = useState('tropical');
  const [work, setWork] = useState<Project>(() => defaultProject('tropical'));
  const [dark, setDark] = useState(safeGet('theme') !== 'light');
  useEffect(() => { document.documentElement.classList.toggle('dark', dark); safeSet('theme', dark ? 'dark' : 'light'); }, [dark]);
  const item = NAV.find(n => n.id === page)!;

  const open = (p: Project) => { setWork(p); setCat(p.settings.categoryId); setPage(p.instances ? 'editor' : 'generator'); };
  const preset = (categoryId: string, paletteId: string) => open(defaultProject(categoryId, paletteId));
  const sendColors = (colors: string[]) => {
    setCustomPalette(colors);
    const pal = [...colors.slice(0, 4), colors[4] ?? '#ffffff'].map((c, i) => c ?? colors[i % colors.length]);
    setWork({ ...work, instances: undefined, colors: pal, bg: pal[4] }); setPage('generator');
  };

  const body = page === 'dashboard' ? <Dashboard go={setPage} onOpen={open} />
    : page === 'settings' ? <Settings dark={dark} setDark={setDark} />
    : page === 'generator' ? <GeneratorPage key={work.id + work.colors.join()} categoryId={cat} setCategoryId={setCat} work={work} onWork={setWork} />
    : page === 'categories' ? <CategoriesPage onUse={id => { setCat(id); setWork(defaultProject(id)); setPage('generator'); }} />
    : page === 'prompt' ? <PromptPage key={cat} categoryId={cat} setCategoryId={setCat} />
    : page === 'color' ? <ColorStudio onSend={sendColors} />
    : page === 'editor' ? <EditorPage work={work} setWork={setWork} />
    : page === 'quality' ? <QualityPage work={work} />
    : page === 'metadata' ? <MetadataPage work={work} />
    : page === 'export' ? <ExportPage work={work} />
    : page === 'projects' ? <ProjectsPage onOpen={open} />
    : page === 'trend' ? <TrendPage onUse={preset} />
    : page === 'ai' ? <AiPage work={work} setWork={setWork} go={setPage} />
    : page === 'batch' ? <BatchPage work={work} />
    : <Placeholder title={item.label} phase={item.phase} />;

  return (
    <div className="flex min-h-screen">
      <aside className="w-60 shrink-0 border-r bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
        <div className="mb-6">
          <div className="text-lg font-extrabold tracking-wide">ROBI PATTERN STUDIO</div>
          <div className="text-xs text-slate-500">Create. Repeat. Export.</div>
        </div>
        <nav className="space-y-1">
          {NAV.map(n => (
            <button key={n.id} onClick={() => setPage(n.id)}
              className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm ${page === n.id ? 'bg-brand-500 text-white' : 'hover:bg-slate-100 dark:hover:bg-slate-800'}`}>
              {n.label}
            </button>
          ))}
        </nav>
      </aside>
      <main className="flex-1 p-6">
        <header className="mb-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold">{item.label}</h2>
          <button aria-label="Toggle theme" onClick={() => setDark(!dark)} className="rounded-lg border p-2 dark:border-slate-700">
            {dark ? <Sun size={18} /> : <Moon size={18} />}
          </button>
        </header>
        {body}
      </main>
    </div>
  );
}
