import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useI18n } from '@/lib/i18n';
import { useToast } from '@/components/ui/use-toast';
import { ArrowLeft, Building2, User, Users, Globe, Shield, AlertTriangle, BookOpen, Palette, Bell, FileText, Bot, Database, LogOut, Clock } from 'lucide-react';
import CompanySettingsSection from '@/components/settings/CompanySettingsSection';
import InvoiceAppearanceCard from '@/components/settings/InvoiceAppearanceCard';
import ProfileHeader from '@/components/settings/ProfileHeader';
import LocalizationCard from '@/components/settings/LocalizationCard';
import SecurityCard from '@/components/settings/SecurityCard';
import DangerZone from '@/components/settings/DangerZone';
import FactoryResetCard from '@/components/settings/FactoryResetCard';
import UserManualCard from '@/components/settings/UserManualCard';
import DisplaySettingsCard from '@/components/settings/DisplaySettingsCard';
import SoundSettingsCard from '@/components/settings/SoundSettingsCard';
import StorageSettingsCard from '@/components/settings/StorageSettingsCard';
import UsersManagementCard from '@/components/settings/UsersManagementCard';
import LogoutCard from '@/components/settings/LogoutCard';
import DateTimePickerStyleCard from '@/components/settings/DateTimePickerStyleCard';

export default function Settings() {
  const { language, toggleLanguage } = useI18n();
  const { toast } = useToast();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [active, setActive] = useState(null); // null = categories grid, key = content

  useEffect(() => {
    let mounted = true;
    base44.auth.me().
    then((u) => {if (mounted) {setUser(u);setLoading(false);}}).
    catch(() => {if (mounted) setLoading(false);});
    return () => {mounted = false;};
  }, []);

  /**
   * Preserve existing destructive action: sign the user out to /login.
   */
  const handleDelete = async () => {
    setDeleting(true);
    try {
      if (typeof base44.auth.deleteMe === 'function') {
        await base44.auth.deleteMe();
      }
      await base44.auth.logout('/login');
    } catch {
      toast({ title: 'Could not complete the action', variant: 'destructive' });
      setDeleting(false);
    }
  };

  const handleProfileUpdated = (patch) => setUser((prev) => prev ? { ...prev, ...patch } : prev);

  const handleLanguageChange = (newLang) => {
    if (newLang !== language) {
      toggleLanguage();
      toast({ title: 'Language updated' });
    }
  };

  const chipColors = {
    company: 'bg-blue-500/15 text-blue-400',
    invoice: 'bg-violet-500/15 text-violet-400',
    profile: 'bg-blue-500/15 text-blue-400',
    localization: 'bg-emerald-500/15 text-emerald-400',
    display: 'bg-violet-500/15 text-violet-400',
    datetime: 'bg-amber-500/15 text-amber-400',
    sound: 'bg-amber-500/15 text-amber-400',
    users: 'bg-blue-500/15 text-blue-400',
    security: 'bg-rose-500/15 text-rose-400',
    storage: 'bg-cyan-500/15 text-cyan-400',
    agents: 'bg-emerald-500/15 text-emerald-400',
    manual: 'bg-slate-500/15 text-slate-400',
    logout: 'bg-rose-500/15 text-rose-400',
    danger: 'bg-red-500/15 text-red-400'
  };

  const sections = [
  { key: 'company', label: 'Company', icon: Building2, render: () => <CompanySettingsSection /> },
  { key: 'invoice', label: 'Invoice', icon: FileText, render: () => <InvoiceAppearanceCard /> },
  { key: 'profile', label: 'Profile', icon: User, render: () => <ProfileHeader user={user} loading={loading} onUpdated={handleProfileUpdated} /> },
  { key: 'localization', label: 'Localization', icon: Globe, render: () => <LocalizationCard language={language} onLanguageChange={handleLanguageChange} /> },
  { key: 'display', label: 'Display', icon: Palette, render: () => <DisplaySettingsCard /> },
  { key: 'datetime', label: 'Date & Time', icon: Clock, render: () => <DateTimePickerStyleCard /> },
  { key: 'sound', label: 'Sound', icon: Bell, render: () => <SoundSettingsCard /> },
  { key: 'users', label: 'Users', icon: Users, render: () => <UsersManagementCard currentUser={user} /> },
  { key: 'security', label: 'Security', icon: Shield, render: () => <SecurityCard /> },
  { key: 'storage', label: 'Storage', icon: Database, render: () => <StorageSettingsCard /> },
  { key: 'agents', label: 'AI Agents', icon: Bot, render: () =>
    <Link to="/agents" className="block p-6 rounded-2xl border border-white/10 bg-white/[0.03] hover:border-emerald-500/30 hover:bg-emerald-500/[0.06] transition-all">
        <div className="flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'linear-gradient(135deg, rgba(16,185,129,0.18), rgba(16,185,129,0.06))', border: '1px solid rgba(16,185,129,0.35)' }}>
            <Bot className="w-5 h-5" style={{ color: 'rgb(var(--panel-accent-rgb))' }} />
          </div>
          <div>
            <h3 className="text-base font-semibold text-white">AI Agents</h3>
            <p className="text-sm text-muted-foreground">Manage contracts, transactions, and trip statuses with AI assistants</p>
          </div>
        </div>
      </Link>
  },
  { key: 'manual', label: 'User Manual', icon: BookOpen, render: () => <UserManualCard /> },
  { key: 'logout', label: 'Log out', icon: LogOut, render: () => <LogoutCard /> },
  { key: 'danger', label: 'Danger Zone', icon: AlertTriangle, danger: true, render: () =>
    <div className="space-y-6">
        <DangerZone deleting={deleting} onDelete={handleDelete} user={user} />
        <FactoryResetCard user={user} />
      </div>
  }];

  return (
    <div className="max-w-6xl mx-auto p-4 md:px-2 md:py-4">
      {active === null ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4 animate-enter-up">
          {sections.map((s) => (
            <button
              key={s.key}
              onClick={() => setActive(s.key)}
              className="flex flex-col items-center gap-3 p-5 rounded-2xl border border-border/60 glass-sm hover:border-primary/40 hover:-translate-y-0.5 transition-all active:scale-95"
            >
              <span className={`h-12 w-12 rounded-xl flex items-center justify-center ${chipColors[s.key] || 'bg-slate-500/15 text-slate-400'}`}>
                <s.icon className="w-5 h-5" />
              </span>
              <span className="text-sm font-medium text-foreground">{s.label}</span>
            </button>
          ))}
        </div>
      ) : (
        <div className="space-y-4 md:space-y-6 animate-enter-up" key={active}>
          <button
            onClick={() => setActive(null)}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            All categories
          </button>
          {sections.find((s) => s.key === active)?.render()}
        </div>
      )}
    </div>
  );
}