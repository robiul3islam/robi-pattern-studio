import type { CategoryConfig } from '../types';
const C = (elements: string[], palette: string, mode: CategoryConfig['mode'], o: Partial<CategoryConfig> = {}): CategoryConfig =>
  ({ elements, palette, mode, size: 90, count: 40, density: 50, spacing: 1, rotation: 45, randomness: 40, ...o });

export const CATEGORY_CONFIG: Record<string, CategoryConfig> = {
  'botanical-floral': C(['leaf', 'fern', 'flower5', 'daisy', 'tulip', 'bud', 'branch'], 'forest-1', 'organic', { rotation: 180 }),
  'geometric': C(['circle', 'ring', 'triangle', 'hexagon', 'diamond', 'rsquare', 'star4', 'halfcircle', 'arcs', 'cross'], 'vibrant-1', 'structured', { size: 70, count: 36, rotation: 0 }),
  'abstract-organic': C(['blob1', 'blob2', 'drop', 'pebble', 'wave', 'moon'], 'earthy-1', 'organic', { size: 140, count: 24, rotation: 180 }),
  'retro-groovy': C(['sunburst', 'rainbow', 'wave', 'flower5', 'daisy', 'circle', 'ring'], 'retro-1', 'brick', { count: 24, rotation: 20 }),
  'animals-wildlife': C(['paw', 'bear', 'feather', 'leaf', 'branch', 'dot'], 'earthy-1', 'scattered', { rotation: 60 }),
  'birds': C(['bird', 'feather', 'branch', 'leaf', 'bud'], 'indigo-1', 'scattered', { count: 22, rotation: 25 }),
  'insects': C(['butterfly', 'ladybug', 'bee', 'daisy', 'leaf', 'flower5'], 'pastel-1', 'scattered', { count: 24, rotation: 90 }),
  'food-fruits': C(['apple', 'cherry', 'lemon', 'orange', 'strawberry', 'melon', 'leaf'], 'tropical-1', 'halfdrop', { count: 24, rotation: 30 }),
  'ethnic-boho': C(['sunburst', 'moon', 'arrow', 'feather', 'seigaiha', 'paisley', 'zigzag', 'dots'], 'retro-1', 'structured', { rotation: 15 }),
  'terrazzo': C(['chip1', 'chip2', 'chip3', 'chip4', 'pebble', 'dot'], 'pastel-1', 'dense', { size: 70, count: 70, rotation: 180, randomness: 70 }),
  'kids-nursery': C(['cloud', 'heart', 'balloon', 'star5', 'moon', 'rainbow', 'bear'], 'baby-1', 'scattered', { count: 22, rotation: 20 }),
  'luxury-damask': C(['fleur', 'ornament', 'scroll', 'diamond', 'star8'], 'lux-1', 'halfdrop', { size: 100, count: 24, rotation: 0, randomness: 10 }),
  'islamic-geometric': C(['star8', 'star12', 'octstar', 'hexagon', 'ornament'], 'indigo-1', 'grid', { size: 95, count: 16, rotation: 0, randomness: 0 }),
  'japanese-oriental': C(['seigaiha', 'sakura', 'waverings', 'bamboo', 'wave', 'circle'], 'indigo-1', 'brick', { count: 24, rotation: 10 }),
  'doodle-hand-drawn': C(['spiral', 'dstar', 'dheart', 'squiggle', 'arrow', 'ring', 'zigzag'], 'mono-1', 'scattered', { size: 80, rotation: 90 }),
  'seasonal-holiday': C(['snowflake', 'pine', 'pumpkin', 'holly', 'star5', 'heart'], 'xmas-1', 'scattered', { count: 26, rotation: 30 }),
  'fashion-textile': C(['paisley', 'stripe', 'polka', 'leaf', 'flower5', 'dot'], 'lux-1', 'halfdrop', { count: 20, rotation: 60 }),
  'memphis': C(['squiggle', 'zigzag', 'dots', 'triangle', 'cross', 'halfcircle', 'ring', 'circle'], 'vibrant-1', 'scattered', { size: 75, count: 34, rotation: 180 }),
  'tropical': C(['monstera', 'palm', 'hibiscus', 'butterfly', 'flower5', 'leaf', 'fern'], 'tropical-1', 'organic', { size: 110, count: 28, rotation: 180 }),
  'minimal-scandinavian': C(['branch', 'dot', 'sun', 'arch', 'leaf', 'moon'], 'scandi-1', 'minimal', { size: 80, count: 34, rotation: 20, randomness: 25 }),
};
