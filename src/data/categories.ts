import type { Category } from '../types';
const names = ['Botanical & Floral','Geometric','Abstract Organic','Retro & Groovy','Animals & Wildlife','Birds','Insects','Food & Fruits','Ethnic & Boho','Terrazzo','Kids & Nursery','Luxury & Damask','Islamic Geometric','Japanese & Oriental','Doodle & Hand Drawn','Seasonal & Holiday','Fashion & Textile','Memphis','Tropical','Minimal Scandinavian','Line Art','Art Deco & Luxury','Typography','Damask Classic','Halftone & Gradient','Line Waves & Weaves','Groovy Swirl & Warp','Nordic Knit & Fair Isle','Abstract Shape Set','Christmas Holly','Christmas Pine Forest','Christmas Gold Line','Chinese New Year Goat','Geometric Holiday Mosaic'];
export const CATEGORIES: Category[] = names.map((name, i) => ({
  id: name.toLowerCase().replace(/[^a-z]+/g, '-').replace(/^-|-$/g, ''),
  name,
  accent: `hsl(${(i * 18) % 360} 70% 55%)`,
}));
