import { Moon, Sun, Maximize, Minimize } from 'lucide-react';
import { useTheme } from '@/lib/theme';

const ACCENT_SWATCHES = [
  { key: 'blue', color: '#3b82f6' },
  { key: 'green', color: '#10b981' },
  { key: 'purple', color: '#a855f7' },
  { key: 'amber', color: '#f59e0b' },
  { key: 'rose', color: '#f43f5e' },
];

export default function DisplaySettingsCard() {
  const { theme, setTheme, accent, setAccent, isFullscreen, toggleFullscreen } = useTheme();

  return (
    <div className="glass-card p-5 md:p-6">
      <div className="flex items-start gap-3 mb-5">
        <div className="hud-icon-tile w-10 h-10 flex-shrink-0">
          <Sun className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-display font-semibold text-lg">Display</h3>
          <p className="text-sm text-white/50 mt-0.5">Choose your theme, accent color and full-screen mode.</p>
        </div>
      </div>

      <p className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Mode</p>
      <div className="grid grid-cols-2 gap-2 mb-5">
        <button
          onClick={() => setTheme('dark')}
          className={`flex items-center gap-2 px-4 py-3 rounded-xl border transition-all ${theme === 'dark' ? 'bg-primary/15 border-primary/40 text-foreground' : 'border-border text-muted-foreground hover:text-foreground hover:bg-white/[0.04]'}`}
        >
          <Moon className="w-4 h-4" /> Dark
        </button>
        <button
          onClick={() => setTheme('light')}
          className={`flex items-center gap-2 px-4 py-3 rounded-xl border transition-all ${theme === 'light' ? 'bg-primary/15 border-primary/40 text-foreground' : 'border-border text-muted-foreground hover:text-foreground hover:bg-white/[0.04]'}`}
        >
          <Sun className="w-4 h-4" /> Light
        </button>
      </div>

      <p className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Accent color</p>
      <div className="flex items-center gap-2.5 mb-5">
        {ACCENT_SWATCHES.map((s) => (
          <button
            key={s.key}
            onClick={() => setAccent(s.key)}
            aria-label={s.key}
            className="relative w-9 h-9 rounded-full transition-all hover:scale-110"
            style={{ background: s.color, boxShadow: accent === s.key ? `0 0 0 2px var(--app-bg, #06080f), 0 0 0 4px ${s.color}` : '0 2px 8px rgba(0,0,0,0.3)' }}
          />
        ))}
      </div>

      <p className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Full screen</p>
      <button onClick={toggleFullscreen} className="clay-btn-ghost inline-flex items-center gap-2">
        {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
        {isFullscreen ? 'Exit Full Screen' : 'Enter Full Screen'}
      </button>
    </div>
  );
}