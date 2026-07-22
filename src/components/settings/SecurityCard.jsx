import { useState } from 'react';
import { Shield, ShieldCheck, Monitor, Smartphone, LogOut } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/components/ui/use-toast';
import SettingsCard from './SettingsCard';

const SESSIONS = [
  { device: 'Chrome — macOS', location: 'Dubai, UAE', current: true, icon: Monitor },
  { device: 'Safari — iPhone', location: 'Abu Dhabi, UAE', current: false, icon: Smartphone },
];

/**
 * Security section: placeholder 2FA toggle + active sessions list.
 * These are UI placeholders — toggles surface a "coming soon" toast.
 */
export default function SecurityCard() {
  const { toast } = useToast();
  const [twoFA, setTwoFA] = useState(false);

  const handle2FA = (checked) => {
    setTwoFA(checked);
    toast({ title: 'Two-factor authentication is coming soon' });
    // placeholder only — reset after a brief moment
    setTimeout(() => setTwoFA(false), 500);
  };

  return (
    <SettingsCard icon={Shield} title="Security" description="Authentication and active sessions">
      <div className="flex items-center justify-between gap-3 p-3 rounded-xl border border-white/[0.06] bg-white/[0.02]">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-blue-500/10 border border-blue-500/20 flex-shrink-0">
            <ShieldCheck className="w-4 h-4 text-blue-400" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-white/90">Two-Factor Authentication</p>
            <p className="text-xs text-white/40">Add an extra layer of security <span className="text-blue-400/60">(coming soon)</span></p>
          </div>
        </div>
        <Switch checked={twoFA} onCheckedChange={handle2FA} />
      </div>

      <div className="mt-4">
        <p className="text-[10px] uppercase tracking-wider text-white/30 mb-2">Active Sessions</p>
        <div className="space-y-2">
          {SESSIONS.map((s, i) => (
            <div key={i} className="flex items-center gap-3 p-3 rounded-xl border border-white/[0.06] bg-white/[0.02]">
              <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-white/5 border border-white/10 flex-shrink-0">
                <s.icon className="w-4 h-4 text-white/60" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white/90 truncate">{s.device}</p>
                <p className="text-xs text-white/40 truncate">{s.location}</p>
              </div>
              {s.current ? (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex-shrink-0">Current</span>
              ) : (
                <button
                  onClick={() => toast({ title: 'Session revoke is coming soon' })}
                  className="text-xs text-white/40 hover:text-rose-400 transition-colors flex items-center gap-1 flex-shrink-0"
                >
                  <LogOut className="w-3.5 h-3.5" /> Revoke
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </SettingsCard>
  );
}