import type { NavItem } from '../types';
export const NAV: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', phase: 1 },
  { id: 'generator', label: 'Pattern Generator', phase: 2 },
  { id: 'prompt', label: 'Prompt Generator', phase: 4 },
  { id: 'categories', label: 'Pattern Categories', phase: 2 },
  { id: 'color', label: 'Color Studio', phase: 4 },
  { id: 'editor', label: 'Pattern Editor', phase: 5 },
  { id: 'projects', label: 'My Projects', phase: 8 },
  { id: 'trend', label: 'Trend Studio', phase: 8 },
  { id: 'quality', label: 'Stock Quality Checker', phase: 7 },
  { id: 'metadata', label: 'Metadata Generator', phase: 7 },
  { id: 'batch', label: 'Batch Export', phase: 8 },
  { id: 'export', label: 'Export', phase: 6 },
  { id: 'settings', label: 'Settings', phase: 1 },
];
