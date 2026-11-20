export const MAX_PX = 8000;
export function pngSize(w: number, h: number, scale: number): { w: number; h: number } {
  const k = Math.min(scale, MAX_PX / Math.max(w, h));
  return { w: Math.round(w * k), h: Math.round(h * k) };
}
export function svgToPng(svg: string, w: number, h: number, scale: number): Promise<Blob> {
  const size = pngSize(w, h, scale);
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const c = document.createElement('canvas'); c.width = size.w; c.height = size.h;
      const ctx = c.getContext('2d');
      if (!ctx) return reject(new Error('Canvas not available'));
      ctx.drawImage(img, 0, 0, size.w, size.h);
      c.toBlob(b => (b ? resolve(b) : reject(new Error('PNG encode failed'))), 'image/png');
    };
    img.onerror = () => reject(new Error('SVG could not be rendered'));
    img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
  });
}
export function downloadBlob(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = name; a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
export const fileSafe = (s: string) => s.replace(/[^a-zA-Z0-9_-]+/g, '_').replace(/^_|_$/g, '') || 'pattern';
