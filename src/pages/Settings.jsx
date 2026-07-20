import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader,
  AlertDialogTitle, AlertDialogTrigger
} from '@/components/ui/alert-dialog';
import { ArrowLeft, User, Trash2, AlertTriangle, Globe } from 'lucide-react';
import CompanySettingsSection from '@/components/settings/CompanySettingsSection';
import { useI18n } from '@/lib/i18n';

export default function Settings() {
  const { language, toggleLanguage } = useI18n();
  const [user, setUser] = useState(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => { base44.auth.me().then(setUser).catch(() => {}); }, []);

  const handleDelete = async () => {
    setDeleting(true);
    await base44.auth.logout('/login');
  };

  return (
    <div className="max-w-2xl mx-auto p-4 md:p-6 space-y-6">
      <div className="flex items-center gap-3">
        <Link to="/" className="p-2 -ml-2 rounded-lg hover:bg-white/[0.06] transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-2xl font-display font-semibold">Settings</h1>
      </div>

      {/* Company Settings */}
      <CompanySettingsSection />

      {/* Profile */}
      <div className="glass-card p-5">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-primary/15 flex items-center justify-center">
            <User className="w-6 h-6 text-primary" />
          </div>
          <div className="min-w-0">
            <p className="font-medium text-foreground truncate">{user?.full_name || user?.email || 'User'}</p>
            <p className="text-sm text-muted-foreground truncate">{user?.email || '—'}</p>
          </div>
        </div>
      </div>

      {/* Language */}
      <div className="glass-card p-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Globe className="w-5 h-5 text-muted-foreground" />
          <div>
            <p className="font-medium text-foreground">Language</p>
            <p className="text-sm text-muted-foreground">{language === 'en' ? 'English' : 'العربية'}</p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={toggleLanguage}>
          {language === 'en' ? 'العربية' : 'English'}
        </Button>
      </div>

      {/* Danger Zone */}
      <div className="glass-card p-5 space-y-4 border-destructive/20">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-destructive/10 flex items-center justify-center">
            <AlertTriangle className="w-5 h-5 text-destructive" />
          </div>
          <div>
            <p className="font-medium text-foreground">Danger Zone</p>
            <p className="text-sm text-muted-foreground">Irreversible actions</p>
          </div>
        </div>

        <div className="rounded-lg border border-destructive/20 bg-destructive/[0.04] p-4 space-y-3">
          <div className="flex items-start gap-3">
            <Trash2 className="w-4 h-4 text-destructive mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-foreground">Delete Account</p>
              <p className="text-xs text-muted-foreground mt-1">
                This will permanently remove your account and all associated data. This action cannot be undone.
              </p>
            </div>
          </div>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" size="sm" className="w-full">
                <Trash2 className="w-4 h-4" /> Delete Account
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete your account and remove all associated data from our servers.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDelete}
                  disabled={deleting}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  {deleting ? 'Deleting...' : 'Yes, delete account'}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    </div>
  );
}