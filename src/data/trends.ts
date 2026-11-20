export interface Trend { id: string; name: string; season: string; note: string; categoryId: string; paletteId: string; }
/** Editorial starting points curated in-app. Not live market data. */
export const TRENDS: Trend[] = [
  { id: 't1', name: 'Summer Jungle', season: 'Summer', note: 'Big leaves, warm coral and teal.', categoryId: 'tropical', paletteId: 'tropical-1' },
  { id: 't2', name: 'Cozy Holiday', season: 'Winter', note: 'Classic red and green festive scatter.', categoryId: 'seasonal-holiday', paletteId: 'xmas-1' },
  { id: 't3', name: '70s Revival', season: 'All year', note: 'Warm brown and olive groovy motifs.', categoryId: 'retro-groovy', paletteId: 'retro-1' },
  { id: 't4', name: 'Quiet Luxury', season: 'All year', note: 'Gold on midnight, damask style.', categoryId: 'luxury-damask', paletteId: 'lux-1' },
  { id: 't5', name: 'Soft Nursery', season: 'All year', note: 'Pastel clouds, stars and hearts.', categoryId: 'kids-nursery', paletteId: 'baby-1' },
  { id: 't6', name: 'Neo Memphis', season: 'All year', note: 'Loud shapes and neon pop.', categoryId: 'memphis', paletteId: 'vibrant-1' },
  { id: 't7', name: 'Earthy Abstract', season: 'Autumn', note: 'Clay and moss organic blobs.', categoryId: 'abstract-organic', paletteId: 'earthy-1' },
  { id: 't8', name: 'Indigo Heritage', season: 'All year', note: 'Waves and sakura in indigo.', categoryId: 'japanese-oriental', paletteId: 'indigo-1' },
  { id: 't9', name: 'Spring Botanicals', season: 'Spring', note: 'Fresh greens and daisies.', categoryId: 'botanical-floral', paletteId: 'forest-1' },
  { id: 't10', name: 'Fruit Market', season: 'Summer', note: 'Half-drop fruit in bright colours.', categoryId: 'food-fruits', paletteId: 'tropical-1' },
];
