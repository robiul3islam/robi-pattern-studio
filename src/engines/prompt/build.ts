import { CATEGORIES } from '../../data/categories';
import { CATEGORY_CONFIG } from '../../data/categoryConfig';

export type Platform = 'generic' | 'midjourney' | 'dalle' | 'stable';
export const PLATFORMS: Platform[] = ['generic', 'midjourney', 'dalle', 'stable'];
export const STYLES = ['flat vector', 'watercolor', 'hand-drawn ink', 'paper cut', 'line art', 'gouache'] as const;
export const MOODS = ['playful', 'elegant', 'calm', 'bold', 'vintage', 'modern'] as const;

export interface PromptInput {
  categoryId: string; platform: Platform; style: string; mood: string;
  colors: string[]; elements: string[]; extra: string; seamless: boolean; commercial: boolean;
}

export interface PromptOutput { prompt: string; negative: string; }

const NEGATIVE = 'text, watermark, signature, logo, border, frame, mockup, photo, 3d render, gradient noise, blurry, cut-off elements, seam lines';

export function defaultInput(categoryId: string): PromptInput {
  const c = CATEGORY_CONFIG[categoryId];
  return { categoryId, platform: 'generic', style: STYLES[0], mood: MOODS[0], colors: [], elements: c.elements.slice(0, 5), extra: '', seamless: true, commercial: true };
}

export function buildPrompt(i: PromptInput): PromptOutput {
  const cat = CATEGORIES.find(c => c.id === i.categoryId)?.name ?? i.categoryId;
  const parts = [
    `${i.style} ${cat.toLowerCase()} pattern`,
    i.elements.length ? `featuring ${i.elements.join(', ')}` : '',
    `${i.mood} mood`,
    i.colors.length ? `color palette ${i.colors.join(' ')}` : '',
    i.seamless ? 'seamless repeating tile, elements balanced across edges' : '',
    i.commercial ? 'clean shapes, flat solid background, print-ready, stock-illustration quality' : '',
    i.extra.trim(),
  ].filter(Boolean);
  let prompt = parts.join(', ');
  let negative = NEGATIVE;
  if (i.platform === 'midjourney') prompt += ` --tile --ar 1:1 --v 6 --no ${NEGATIVE.replace(/, /g, ', ')}`, negative = '';
  else if (i.platform === 'dalle') prompt = `Create a ${prompt}. Square format. Do not include text, borders or watermarks.`, negative = '';
  else if (i.platform === 'stable') prompt = `(${prompt}:1.2), vector art, masterpiece`;
  return { prompt, negative };
}
