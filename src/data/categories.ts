import type { Category } from '../types';
const names = ['Botanical & Floral','Geometric','Abstract Organic','Retro & Groovy','Animals & Wildlife','Birds','Insects','Food & Fruits','Ethnic & Boho','Terrazzo','Kids & Nursery','Luxury & Damask','Islamic Geometric','Japanese & Oriental','Doodle & Hand Drawn','Seasonal & Holiday','Fashion & Textile','Memphis','Tropical','Minimal Scandinavian','Line Art','Art Deco & Luxury','Typography'];
export const CATEGORIES: Category[] = names.map((name, i) => ({
  id: name.toLowerCase().replace(/[^a-z]+/g, '-').replace(/^-|-$/g, ''),
  name,
  accent: `hsl(${(i * 18) % 360} 70% 55%)`,
}));
