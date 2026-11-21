import { CATEGORIES } from '../../data/categories';
import { ELEMENTS_BY_ID } from '../../data/elements';
import { hexToHsl } from '../color/harmony';

export type Site = 'adobe' | 'shutterstock' | 'generic';
export const SITES: Record<Site, { title: number; desc: number; kw: number }> = {
  adobe: { title: 200, desc: 200, kw: 49 }, shutterstock: { title: 200, desc: 200, kw: 50 }, generic: { title: 100, desc: 200, kw: 30 },
};
export interface Meta { title: string; description: string; keywords: string[]; }

export function colorName(hex: string): string {
  const [h, s, l] = hexToHsl(hex);
  if (l > 92) return 'white';
  if (l < 12) return 'black';
  if (s < 12) return l > 65 ? 'light gray' : l > 35 ? 'gray' : 'charcoal';
  const hue = h < 15 || h >= 345 ? 'red' : h < 40 ? 'orange' : h < 65 ? 'yellow' : h < 160 ? 'green' : h < 195 ? 'teal' : h < 255 ? 'blue' : h < 290 ? 'purple' : 'pink';
  if (hue === 'red' && l > 75) return 'pink';
  if (hue === 'orange' && l < 40) return 'brown';
  return l > 80 ? `pastel ${hue}` : l < 28 ? `dark ${hue}` : hue;
}

export const CAT_KW: Record<string, string[]> = {
  'botanical-floral': ['floral', 'flowers', 'leaves', 'botanical', 'nature', 'garden'],
  'geometric': ['geometric', 'shapes', 'abstract', 'modern', 'minimal', 'graphic'],
  'abstract-organic': ['abstract', 'organic', 'blob', 'fluid', 'contemporary'],
  'retro-groovy': ['retro', 'groovy', 'vintage', '70s', 'seventies', 'hippie'],
  'animals-wildlife': ['animals', 'wildlife', 'paw', 'forest', 'nature'],
  'birds': ['birds', 'feathers', 'avian', 'nature', 'branches'],
  'insects': ['insects', 'butterfly', 'bee', 'ladybug', 'garden', 'nature'],
  'food-fruits': ['fruit', 'food', 'summer', 'kitchen', 'fresh', 'healthy'],
  'ethnic-boho': ['boho', 'ethnic', 'tribal', 'bohemian', 'folk'],
  'terrazzo': ['terrazzo', 'speckle', 'stone', 'chips', 'modern', 'interior'],
  'kids-nursery': ['kids', 'nursery', 'baby', 'cute', 'children', 'childish'],
  'luxury-damask': ['damask', 'luxury', 'ornamental', 'baroque', 'classic', 'elegant'],
  'islamic-geometric': ['islamic', 'arabic', 'arabesque', 'ornament', 'star', 'tile'],
  'japanese-oriental': ['japanese', 'oriental', 'asian', 'traditional', 'wave'],
  'doodle-hand-drawn': ['doodle', 'hand drawn', 'sketch', 'playful', 'scribble'],
  'seasonal-holiday': ['christmas', 'holiday', 'winter', 'seasonal', 'festive'],
  'fashion-textile': ['fashion', 'textile', 'fabric', 'paisley', 'apparel'],
  'memphis': ['memphis', 'eighties', '80s', 'retro', 'colorful', 'trendy'],
  'line-art': ['line art', 'outline', 'monoline', 'linear', 'minimal', 'continuous line'],
  'art-deco-luxury': ['art deco', 'luxury', 'gold', 'elegant', 'gatsby', 'ornamental'],
  'typography': ['typography', 'letters', 'monogram', 'lettering', 'alphabet', 'text'],
  'damask-classic': ['damask', 'classic', 'ornamental', 'baroque', 'victorian', 'wallpaper'],
  'halftone-gradient': ['halftone', 'gradient', 'geometric', 'triangles', 'dots', 'fade', 'modern'],
  'line-waves-weaves': ['wave lines', 'line art', 'flowing lines', 'geometric lines', 'cube', 'weave', 'abstract'],
  'groovy-swirl-warp': ['groovy', 'swirl', 'psychedelic', 'retro', '70s', 'warp', 'sunburst'],
  'nordic-knit-fair-isle': ['nordic', 'fair isle', 'knit', 'sweater', 'reindeer', 'christmas', 'winter'],
  'abstract-shape-set': ['abstract shapes', 'bauhaus', 'geometric elements', 'memphis', 'design elements', 'modern'],
  'christmas-holly': ['christmas', 'holly', 'berries', 'snowflakes', 'winter', 'festive'],
  'christmas-pine-forest': ['christmas trees', 'pine', 'forest', 'winter', 'snowflakes', 'holiday'],
  'christmas-gold-line': ['gold line', 'christmas', 'festive', 'snowflakes', 'holly', 'elegant'],
  'chinese-new-year-goat': ['chinese new year', 'year of the goat', '2027', 'lunar new year', 'sheep', 'lantern', 'red and gold'],
  'geometric-holiday-mosaic': ['geometric', 'christmas', 'new year', 'bauhaus', 'mosaic', 'holiday'],
  'tropical': ['tropical', 'jungle', 'exotic', 'summer', 'palm', 'monstera'],
  'minimal-scandinavian': ['scandinavian', 'nordic', 'minimal', 'simple', 'neutral', 'calm'],
};
const BASE = ['seamless pattern', 'seamless', 'pattern', 'repeat', 'tile', 'vector', 'background', 'wallpaper', 'textile', 'fabric', 'wrapping paper', 'surface design', 'print', 'texture', 'design', 'decorative', 'backdrop', 'repeating'];
const cap = (s: string) => s.replace(/\b\w/g, c => c.toUpperCase());
const clip = (s: string, n: number) => (s.length <= n ? s : s.slice(0, n - 1).replace(/[ ,]+\S*$/, '').trim());

export function buildMetadata(i: { categoryId: string; elementIds: string[]; colors: string[]; style?: string }, site: Site): Meta {
  const lim = SITES[site];
  const cat = CATEGORIES.find(c => c.id === i.categoryId)?.name ?? i.categoryId;
  const catWord = cat.split(/\s*&\s*/)[0].toLowerCase();
  let names = [...new Set(i.elementIds.map(e => (ELEMENTS_BY_ID[e]?.name ?? e).toLowerCase()))];
  if (!names.length) names = (CAT_KW[i.categoryId] ?? ['geometric']).slice(0, 4);
  const cols = [...new Set(i.colors.slice(0, 4).map(colorName))];
  const style = i.style ?? 'flat vector';
  const title = clip(`${cap(cols.slice(0, 2).join(' and '))} seamless ${catWord} pattern with ${names.slice(0, 3).join(', ')}`, lim.title);
  const description = clip(`Seamless repeating ${style} ${catWord} pattern featuring ${names.slice(0, 5).join(', ')} in ${cols.join(', ')}. Tileable vector design for fabric, wallpaper, packaging and print.`, lim.desc);
  const kw = [...(CAT_KW[i.categoryId] ?? [catWord]), catWord, ...names, ...cols, ...cols.map(c => `${c} pattern`), style, ...BASE]
    .map(k => k.toLowerCase().trim()).filter(Boolean);
  return { title, description, keywords: [...new Set(kw)].slice(0, lim.kw) };
}
