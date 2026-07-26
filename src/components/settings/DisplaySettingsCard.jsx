import { Palette, Maximize, Minimize } from 'lucide-react';
import { useTheme } from '@/lib/theme';

const THEMES = [
  { key: 'crimson', label: 'Crimson', swatch: '#D62828' },
  { key: 'navy', label: 'Navy', swatch: '#3E92CC' },
];

export default function DisplaySettingsCard() {
  const { theme, setTheme, isFullscreen, toggleFullscreen } = useTheme();

  return (
    <div className="glass-card p-5 md:p-6">
      <div className="flex items-start gap-3 mb-5">
        <div className="hud-icon-tile w-10 h-10 flex-shrink-0">
          <Palette className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-display font-semibold text-lg">Display</h3>
          <p className="text-sm text-white/50 mt-0.5">Choose your theme and full-screen mode.</p>
        </div>
      </div>

      <p className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Theme</p>
      <div className="grid grid-cols-2 gap-2 mb-5">
        {THEMES.map((th) => (
          <button
            key={th.key}
            onClick={() => setTheme(th.key)}
            className={`flex items-center gap-2 px-4 py-3 rounded-xl border transition-all ${theme === th.key ? 'bg-primary/15 border-primary/40 text-foreground' : 'border-border text-muted-foreground hover:text-foreground hover:bg-white/[0.04]'}`}
          >
            <span className="w-3 h-3 rounded-full" style={{ background: th.swatch, boxShadow: `0 0 8px ${th.swatch}` }} />
            {th.label}
          </button>
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