import { useState, useEffect } from 'react';
import { User, Camera, Loader2, Check } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useToast } from '@/components/ui/use-toast';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import SettingsCard from './SettingsCard';

/**
 * Profile management: avatar upload, editable full name + email.
 * Persists via base44.auth.updateMe; reports patches up via onUpdated.
 */
export default function ProfileHeader({ user, loading, onUpdated }) {
  const { toast } = useToast();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (user) {
      setFullName(user.full_name || '');
      setEmail(user.email || '');
    }
  }, [user]);

  const handleAvatar = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      await base44.auth.updateMe({ avatar_url: file_url });
      onUpdated?.({ avatar_url: file_url });
      toast({ title: 'Avatar updated' });
    } catch {
      toast({ title: 'Avatar upload failed', variant: 'destructive' });
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await base44.auth.updateMe({ full_name: fullName, email });
      onUpdated?.({ full_name: fullName, email });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
      toast({ title: 'Profile saved' });
    } catch {
      toast({ title: 'Could not save profile', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <SettingsCard icon={User} title="Profile" description="Your personal account details">
        <div className="flex items-center gap-4">
          <div className="w-20 h-20 rounded-full shimmer-bg animate-shimmer" />
          <div className="flex-1 space-y-2">
            <div className="h-4 w-1/2 rounded shimmer-bg animate-shimmer" />
            <div className="h-3 w-1/3 rounded shimmer-bg animate-shimmer" />
          </div>
        </div>
        <div className="mt-5 space-y-3">
          <div className="h-9 rounded-lg shimmer-bg animate-shimmer" />
          <div className="h-9 rounded-lg shimmer-bg animate-shimmer" />
        </div>
      </SettingsCard>
    );
  }

  const initial = (user?.full_name || user?.email || 'U').charAt(0).toUpperCase();

  return (
    <SettingsCard icon={User} title="Profile" description="Your personal account details">
      <div className="flex items-center gap-4">
        <div className="relative group/avatar flex-shrink-0">
          <div
            className="w-20 h-20 rounded-full overflow-hidden flex items-center justify-center border border-white/10"
            style={{ background: 'linear-gradient(135deg, rgba(30,215,96,0.25), rgba(37,99,235,0.10))' }}
          >
            {user?.avatar_url ? (
              <img src={user.avatar_url} alt="avatar" className="w-full h-full object-cover" />
            ) : (
              <span className="text-2xl font-bold text-blue-300">{initial}</span>
            )}
          </div>
          <label className="absolute inset-0 rounded-full flex items-center justify-center bg-black/55 opacity-0 group-hover/avatar:opacity-100 cursor-pointer transition-opacity">
            {uploading ? <Loader2 className="w-5 h-5 text-white animate-spin" /> : <Camera className="w-5 h-5 text-white" />}
            <input type="file" accept="image/*" className="hidden" onChange={handleAvatar} disabled={uploading} />
          </label>
        </div>
        <div className="min-w-0">
          <p className="font-display font-semibold text-white truncate">{user?.full_name || 'User'}</p>
          <p className="text-sm text-white/40 truncate">{user?.email || '—'}</p>
          <p className="text-[10px] uppercase tracking-wider text-blue-400/70 mt-1.5">{user?.role || 'user'}</p>
        </div>
      </div>

      <div className="mt-5 space-y-3">
        <div>
          <Label className="text-xs text-white/40 mb-1.5 block">Full Name</Label>
          <Input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Your name" className="bg-white/[0.03] border-white/[0.06]" />
        </div>
        <div>
          <Label className="text-xs text-white/40 mb-1.5 block">Email</Label>
          <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" className="bg-white/[0.03] border-white/[0.06]" />
        </div>
      </div>

      <Button onClick={handleSave} disabled={saving} className="w-full mt-4 bg-primary hover:bg-primary/90 active:scale-[0.98]">
        {saved ? <><Check className="w-4 h-4 mr-1.5" /> Saved</> : saving ? 'Saving...' : 'Save Changes'}
      </Button>
    </SettingsCard>
  );
}