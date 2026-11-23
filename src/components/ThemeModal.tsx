import React from 'react';
import { Check, X, Palette } from 'lucide-react';
import {
  SurfaceFinish,
  useWorkshopTheme,
  WORKSHOP_THEMES,
} from '../context/ThemeContext';

interface ThemeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const FINISH_OPTIONS: { id: SurfaceFinish; label: string; desc: string }[] = [
  { id: 'gloss', label: 'Acrylic Gloss', desc: 'Translucent blur with subtle top specular rim' },
  { id: 'specular', label: 'High Specular', desc: 'Double-edge glass reflection and deeper blur' },
  { id: 'matte', label: 'Satin Matte', desc: 'Flat architectural panels with zero drop shadow' },
];

export default function ThemeModal({ isOpen, onClose }: ThemeModalProps) {
  const { themeId, setThemeId, finish, setFinish } = useWorkshopTheme();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Design System Theme Templates"
        className="tb-surface-solid rounded-xl w-full max-w-2xl p-6 space-y-6"
      >
        <div
          className="flex items-center justify-between pb-4 border-b"
          style={{ borderColor: 'var(--tb-border)' }}
        >
          <div className="flex items-center gap-2.5">
            <Palette className="w-4 h-4" style={{ color: 'var(--tb-accent)' }} />
            <div>
              <h2 className="text-base font-display font-bold">
                Theme Templates &amp; Color Combinations
              </h2>
              <p className="text-xs" style={{ color: 'var(--tb-text-muted)' }}>
                Switch calibrated light/dark palettes and glossy surface finishes across the entire workshop
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-md hover:opacity-75"
            aria-label="Close theme studio"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-3">
          <p className="text-xs font-medium" style={{ color: 'var(--tb-text-secondary)' }}>
            Color Combination Presets
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {WORKSHOP_THEMES.map((preset) => {
              const active = preset.id === themeId;
              return (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => setThemeId(preset.id)}
                  className="text-left p-4 rounded-xl border transition-all"
                  style={{
                    backgroundColor: active
                      ? 'var(--tb-accent-soft)'
                      : 'var(--tb-surface-muted)',
                    borderColor: active
                      ? 'var(--tb-accent)'
                      : 'var(--tb-border)',
                  }}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-semibold">{preset.name}</span>
                    {active && (
                      <Check
                        className="w-4 h-4 shrink-0"
                        style={{ color: 'var(--tb-accent)' }}
                      />
                    )}
                  </div>
                  <p
                    className="text-xs mt-1"
                    style={{ color: 'var(--tb-text-muted)' }}
                  >
                    {preset.mode} · {preset.description}
                  </p>
                  <div className="mt-3 flex items-center gap-1.5">
                    {preset.swatches.map((hex, i) => (
                      <span
                        key={i}
                        className="w-6 h-3 rounded-sm border border-black/10"
                        style={{ backgroundColor: hex }}
                        title={hex}
                      />
                    ))}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="space-y-3 pt-2 border-t" style={{ borderColor: 'var(--tb-border)' }}>
          <p className="text-xs font-medium" style={{ color: 'var(--tb-text-secondary)' }}>
            Surface Gloss Finish
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {FINISH_OPTIONS.map((opt) => {
              const active = finish === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setFinish(opt.id)}
                  className="text-left p-3 rounded-lg border transition-colors"
                  style={{
                    backgroundColor: active
                      ? 'var(--tb-accent-soft)'
                      : 'var(--tb-surface-muted)',
                    borderColor: active
                      ? 'var(--tb-accent)'
                      : 'var(--tb-border)',
                  }}
                >
                  <div className="text-xs font-semibold">{opt.label}</div>
                  <div
                    className="text-[11px] mt-0.5"
                    style={{ color: 'var(--tb-text-muted)' }}
                  >
                    {opt.desc}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
