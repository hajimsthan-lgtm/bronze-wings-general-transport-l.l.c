import { useEffect, useState } from 'react';
import { Mail, MessageCircle, Phone, MapPin, Printer } from 'lucide-react';
import { getCompanySettings } from '@/lib/companySettings';
import { useI18n } from '@/lib/i18n';

const digits = (s = '') => (s || '').replace(/[^0-9]/g, '');

export default function AppFooter() {
  const { t } = useI18n();
  const [s, setS] = useState(null);
  useEffect(() => { getCompanySettings().then(setS); }, []);
  if (!s) return null;

  const phone = s.phone1 || s.phone2 || '';
  const email = s.email || '';
  const address = s.address || '';

  const actions = [
    { icon: Mail, label: t('gmail'), href: `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(email)}`, external: true },
    { icon: MessageCircle, label: t('whatsapp'), href: `https://wa.me/${digits(phone)}`, external: true },
    { icon: Phone, label: t('call'), href: `tel:${(phone || '').replace(/\s/g, '')}` },
    { icon: MapPin, label: t('location'), href: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`, external: true },
    { icon: Printer, label: t('print_export'), onClick: () => window.print() },
  ];

  return (
    <footer className="hidden md:block fixed bottom-0 left-0 right-0 z-40 pointer-events-none">
      <div className="max-w-[1440px] mx-auto px-6 lg:px-8 pb-3">
        <div
          className="pointer-events-auto mx-auto flex items-center justify-center gap-1 rounded-full px-2 py-1.5"
          style={{
            background: 'rgba(10,14,23,0.82)',
            backdropFilter: 'blur(24px) saturate(1.5)',
            WebkitBackdropFilter: 'blur(24px) saturate(1.5)',
            border: '1px solid rgba(255,255,255,0.08)',
            boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.05), 0 -10px 30px rgba(0,0,0,0.5)',
          }}
        >
          <span className="px-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-white/40">{t('quick_actions')}</span>
          <span className="w-px h-5 bg-white/10 mx-1" />
          {actions.map((a, i) => {
            const Icon = a.icon;
            const inner = (
              <span className="flex items-center gap-1.5 h-8 px-3 rounded-full text-[11px] font-medium text-white/65 transition-all hover:text-white hover:bg-white/[0.07]">
                <Icon className="w-3.5 h-3.5" />
                <span className="hidden lg:inline">{a.label}</span>
              </span>
            );
            return a.onClick ? (
              <button key={i} type="button" onClick={a.onClick} aria-label={a.label} className="cursor-pointer">{inner}</button>
            ) : (
              <a key={i} href={a.href} target={a.external ? '_blank' : undefined} rel={a.external ? 'noopener noreferrer' : undefined} aria-label={a.label}>{inner}</a>
            );
          })}
        </div>
      </div>
    </footer>
  );
}