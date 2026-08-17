import { useState, useEffect, useRef } from 'react';
import { Lock, ShieldAlert, KeyRound, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog';
import { base44 } from '@/api/base44Client';
import { useToast } from '@/components/ui/use-toast';

function hashPin(pin) {
  let hash = 5381;
  for (let i = 0; i < pin.length; i++) {
    hash = ((hash << 5) + hash) + pin.charCodeAt(i);
  }
  return `pin_${(hash >>> 0).toString(36)}`;
}

export function getStoredPin(user) {
  return user?.danger_zone_pin || null;
}

export async function savePin(pin) {
  await base44.auth.updateMe({ danger_zone_pin: hashPin(pin) });
}

export async function verifyPin(pin, user) {
  const stored = getStoredPin(user);
  if (!stored) return false;
  return hashPin(pin) === stored;
}

export default function PinGuardModal({ open, onOpenChange, onSuccess, user, actionLabel = 'Proceed' }) {
  const { toast } = useToast();
  const [mode, setMode] = useState('verify'); // 'verify' | 'setup'
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [show, setShow] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    if (open) {
      setMode(getStoredPin(user) ? 'verify' : 'setup');
      setPin('');
      setConfirmPin('');
      setError('');
      setShow(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open, user]);

  const handleSubmit = async () => {
    setError('');
    if (pin.length < 4) { setError('PIN must be at least 4 digits'); return; }

    if (mode === 'setup') {
      if (pin !== confirmPin) { setError('PINs do not match'); return; }
      setBusy(true);
      try {
        await savePin(pin);
        toast({ title: 'PIN created', description: 'Your Danger Zone PIN is now active.' });
        onOpenChange(false);
        onSuccess?.();
      } catch (e) {
        setError(e.message || 'Failed to save PIN');
      } finally {
        setBusy(false);
      }
      return;
    }

    // verify mode
    setBusy(true);
    try {
      const ok = await verifyPin(pin, user);
      if (!ok) { setError('Incorrect PIN'); setBusy(false); return; }
      onOpenChange(false);
      onSuccess?.();
    } catch (e) {
      setError(e.message || 'Verification failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm !p-0 overflow-hidden rounded-2xl border-destructive/30">
        <div className="absolute inset-0 pointer-events-none opacity-50" style={{
          background: 'radial-gradient(ellipse 80% 50% at 50% 0%, rgba(239,68,68,0.08), transparent 70%)',
        }} />
        <DialogHeader className="relative px-6 pt-6 pb-2">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-destructive/10 border border-destructive/20 mb-3">
            {mode === 'setup' ? <KeyRound className="w-6 h-6 text-destructive" /> : <ShieldAlert className="w-6 h-6 text-destructive" />}
          </div>
          <DialogTitle className="text-lg font-bold">
            {mode === 'setup' ? 'Create Danger Zone PIN' : 'Enter Your PIN'}
          </DialogTitle>
          <DialogDescription className="text-xs">
            {mode === 'setup'
              ? 'Set a 4–6 digit PIN to protect destructive actions. You\'ll be asked for this PIN before any Danger Zone operation.'
              : `Enter your Danger Zone PIN to ${actionLabel.toLowerCase()}.`}
          </DialogDescription>
        </DialogHeader>

        <div className="relative px-6 pb-6 space-y-3">
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              ref={inputRef}
              type={show ? 'text' : 'password'}
              inputMode="numeric"
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
              onKeyDown={(e) => { if (e.key === 'Enter' && mode === 'verify') handleSubmit(); }}
              placeholder="• • • •"
              className="pl-10 pr-10 text-center text-lg tracking-[0.5em] font-mono"
              autoFocus
            />
            <button
              onClick={() => setShow(s => !s)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            >
              {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>

          {mode === 'setup' && (
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type={show ? 'text' : 'password'}
                inputMode="numeric"
                value={confirmPin}
                onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
                onKeyDown={(e) => { if (e.key === 'Enter') handleSubmit(); }}
                placeholder="Confirm PIN"
                className="pl-10 text-center text-lg tracking-[0.5em] font-mono"
              />
            </div>
          )}

          {error && (
            <p className="text-xs text-destructive font-medium animate-fade-in">{error}</p>
          )}

          <div className="flex gap-2 pt-1">
            <Button variant="outline" className="flex-1" onClick={() => onOpenChange(false)} disabled={busy}>
              Cancel
            </Button>
            <Button
              className="flex-1 bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleSubmit}
              disabled={busy || pin.length < 4 || (mode === 'setup' && !confirmPin)}
            >
              {busy ? 'Verifying…' : mode === 'setup' ? 'Create PIN' : actionLabel}
            </Button>
          </div>

          {mode === 'setup' && (
            <p className="text-[10px] text-muted-foreground/60 text-center pt-1">
              <ShieldAlert className="w-3 h-3 inline mr-1" />
              This PIN protects Delete Account and Factory Reset operations.
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}