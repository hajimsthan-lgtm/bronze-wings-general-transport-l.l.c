import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useI18n } from '@/lib/i18n';
import { useToast } from '@/components/ui/use-toast';
import { ArrowLeft, Building2, User, Users, Globe, Shield, AlertTriangle, BookOpen, Palette, Bell, FileText, Bot, Database } from 'lucide-react';
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

export default function Settings() {
  const { language, toggleLanguage } = useI18n();
  const { toast } = useToast();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [active, setActive] = useState('company');

  useEffect(() => {
    let mounted = true;
    base44.auth.me()
      .then((u) => { if (mounted) { setUser(u); setLoading(false); } })
      .catch(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
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

  const handleProfileUpdated = (patch) => setUser((prev) => (prev ? { ...prev, ...patch } : prev));

  const handleLanguageChange = (newLang) => {
    if (newLang !== language) {
      toggleLanguage();
      toast({ title: 'Language updated' });
    }
  };

  const sections = [
    { key: 'company', label: 'Company', icon: Building2, render: () => <CompanySettingsSection /> },
    { key: 'invoice', label: 'Invoice', icon: FileText, render: () => <InvoiceAppearanceCard /> },
    { key: 'profile', label: 'Profile', icon: User, render: () => <ProfileHeader user={user} loading={loading} onUpdated={handleProfileUpdated} /> },
    { key: 'localization', label: 'Localization', icon: Globe, render: () => <LocalizationCard language={language} onLanguageChange={handleLanguageChange} /> },
    { key: 'display', label: 'Display', icon: Palette, render: () => <DisplaySettingsCard /> },
    { key: 'sound', label: 'Sound', icon: Bell, render: () => <SoundSettingsCard /> },
    { key: 'users', label: 'Users', icon: Users, render: () => <UsersManagementCard currentUser={user} /> },
    { key: 'security', label: 'Security', icon: Shield, render: () => <SecurityCard /> },
    { key: 'storage', label: 'Storage', icon: Database, render: () => <StorageSettingsCard /> },
    { key: 'agents', label: 'AI Agents', icon: Bot, render: () => (
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
    ) },
    { key: 'manual', label: 'User Manual', icon: BookOpen, render: () => <UserManualCard /> },
    { key: 'danger', label: 'Danger Zone', icon: AlertTriangle, danger: true, render: () => (
      <div className="space-y-6">
        <DangerZone deleting={deleting} onDelete={handleDelete} user={user} />
        <FactoryResetCard user={user} />
      </div>
    ) },
  ];

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-8">
      <header className="flex items-center gap-3 mb-6">
        <Link to="/" className="p-2 -ml-2 rounded-lg hover:bg-white/[0.06] transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="hud-icon-tile w-12 h-12">
          <Building2 className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-2xl font-display font-semibold tracking-tight text-white">Settings</h1>
          <p className="text-sm text-muted-foreground">Manage your account and organization</p>
        </div>
      </header>

      <div className="md:grid md:grid-cols-[220px_1fr] md:gap-6">
        {/* Sidebar — desktop only */}
        <aside className="hidden md:block">
          <nav className="sticky top-24 space-y-1">
            {sections.map((s) => {
              const isActive = active === s.key;
              return (
                <button
                  key={s.key}
                  onClick={() => setActive(s.key)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-200 border ${
                    isActive
                      ? s.danger
                        ? 'bg-destructive/10 border-destructive/30 text-rose-300'
                        : 'bg-blue-500/10 border-blue-500/30 text-white'
                      : s.danger
                        ? 'text-white/50 hover:text-rose-300/80 hover:bg-destructive/[0.06] border-transparent'
                        : 'text-white/50 hover:text-white/80 hover:bg-white/[0.04] border-transparent'
                  }`}
                >
                  <s.icon className="w-4 h-4" />
                  {s.label}
                </button>
              );
            })}
          </nav>
        </aside>

        {/* Content */}
        <div className="space-y-6">
          {/* Desktop: active section only */}
          <div className="hidden md:block animate-enter-up" key={active}>
            {sections.find((s) => s.key === active)?.render()}
          </div>
          {/* Mobile: all sections stacked */}
          <div className="md:hidden space-y-6">
            {sections.map((s) => (
              <div key={s.key} className="animate-enter-up">{s.render()}</div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}