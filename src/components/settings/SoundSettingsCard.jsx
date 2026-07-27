import { useState } from 'react';
import { Bell, Volume2, VolumeX } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { playBell } from '@/components/dashboard/EdgeQuickRail';

export default function SoundSettingsCard() {
  const [enabled, setEnabled] = useState(() => {
    try { const v = localStorage.getItem('qa_sound_enabled'); return v === null ? true : v === '1'; } catch { return true; }
  });
  const [volume, setVolume] = useState(() => {
    try { const v = localStorage.getItem('qa_sound_volume'); return v === null ? 50 : Number(v); } catch { return 50; }
  });

  const persistEnabled = (v) => {
    setEnabled(v);
    try { localStorage.setItem('qa_sound_enabled', v ? '1' : '0'); } catch {}
    if (v) { playBell(); }
  };
  const persistVolume = (v) => {
    setVolume(v);
    try { localStorage.setItem('qa_sound_volume', String(v)); } catch {}
  };

  return (
    <div className="glass-card p-6 animate-enter-up">
      <div className="flex items-center gap-3 mb-5">
        <span className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(var(--panel-accent-rgb),0.14)', border: '1px solid rgba(var(--panel-accent-rgb),0.3)' }}>
          <Bell className="w-5 h-5 text-primary" />
        </span>
        <div>
          <h2 className="text-lg font-display font-semibold tracking-tight">Quick Apps Sound</h2>
          <p className="text-sm text-white/40">Bell feedback when you hover the edge Quick Apps</p>
        </div>
      </div>

      <div className="flex items-center justify-between py-3 border-t border-white/[0.06]">
        <div className="flex items-center gap-2.5">
          {enabled ? <Volume2 className="w-4 h-4 text-primary" /> : <VolumeX className="w-4 h-4 text-white/30" />}
          <span className="text-sm font-medium">Enable hover sound</span>
        </div>
        <Switch checked={enabled} onCheckedChange={persistEnabled} />
      </div>

      <div className={`py-4 border-t border-white/[0.06] transition-opacity ${enabled ? 'opacity-100' : 'opacity-40 pointer-events-none'}`}>
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-medium">Volume</span>
          <span className="text-xs font-mono text-white/50 tabular-nums">{volume}%</span>
        </div>
        <Slider value={[volume]} min={0} max={100} step={5} onValueChange={persistVolume} className="w-full" />
        <div className="mt-4">
          <Button variant="outline" size="sm" onClick={() => playBell()} className="h-9">
            <Bell className="w-3.5 h-3.5 mr-1.5" /> Test sound
          </Button>
        </div>
      </div>
    </div>
  );
}