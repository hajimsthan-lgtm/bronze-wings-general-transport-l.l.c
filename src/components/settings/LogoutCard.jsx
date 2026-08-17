import { useState } from 'react';
import { LogOut, Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useToast } from '@/components/ui/use-toast';

export default function LogoutCard() {
  const { toast } = useToast();
  const [busy, setBusy] = useState(false);

  const handleLogout = async () => {
    setBusy(true);
    try {
      await base44.auth.logout('/login');
    } catch {
      toast({ title: 'Could not log out', variant: 'destructive' });
      setBusy(false);
    }
  };

  return (
    <div className="p-6 rounded-2xl border border-white/10 bg-white/[0.03]">
      <div className="flex items-center gap-4">
        <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: 'linear-gradient(135deg, rgba(239,68,68,0.18), rgba(239,68,68,0.06))', border: '1px solid rgba(239,68,68,0.35)' }}>
          <LogOut className="w-5 h-5 text-red-400" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-base font-semibold text-foreground">Log out</h3>
          <p className="text-sm text-muted-foreground">Sign out of your account on this device</p>
        </div>
        <button
          onClick={handleLogout}
          disabled={busy}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-red-500/90 hover:bg-red-500 transition-all disabled:opacity-60">
          {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogOut className="w-4 h-4" />}
          <span className="hidden sm:inline">{busy ? 'Logging out…' : 'Log out'}</span>
          <span className="sm:hidden">{busy ? '…' : 'Log out'}</span>
        </button>
      </div>
    </div>
  );
}