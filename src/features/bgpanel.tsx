import type { BgPattern, BgType } from '../types';
import { BG_TYPES } from '../engines/vector/bgPattern';
import { input } from './shared';

export default function BgPanel({ value, onChange, base }: { value?: BgPattern; onChange: (v?: BgPattern) => void; base: string }) {
  const v = value ?? { type: 'dots' as BgType, color: base, opacity: 0.15, scale: 10 };
  return (
    <div className="space-y-2 text-xs">
      <label className="block">Background texture
        <select className={input} value={value ? value.type : 'none'} onChange={e => onChange(e.target.value === 'none' ? undefined : { ...v, type: e.target.value as BgType })}>
          <option value="none">none</option>{BG_TYPES.map(t => <option key={t}>{t}</option>)}
        </select>
      </label>
      {value && <>
        <label className="block">Colour <input type="color" value={value.color} onChange={e => onChange({ ...value, color: e.target.value })} className="h-7 w-full cursor-pointer" /></label>
        <label className="block">Opacity {Math.round(value.opacity * 100)}% <input type="range" min={0.03} max={0.8} step={0.01} value={value.opacity} onChange={e => onChange({ ...value, opacity: +e.target.value })} className="w-full" /></label>
        <label className="block">Density {value.scale} <input type="range" min={2} max={40} value={value.scale} onChange={e => onChange({ ...value, scale: +e.target.value })} className="w-full" /></label>
      </>}
    </div>
  );
}
