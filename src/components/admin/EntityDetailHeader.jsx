import { useNavigate } from 'react-router-dom';
import { useI18n } from '@/lib/i18n';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

export default function EntityDetailHeader({ title, subtitle, badge, info = [], backTo }) {
  const navigate = useNavigate();
  const { t } = useI18n();
  return (
    <div className="mb-6">
      <Button variant="ghost" size="sm" onClick={() => backTo ? navigate(backTo) : navigate(-1)} className="text-muted-foreground hover:text-foreground mb-3 -ml-2 transition-colors duration-200">
        <ArrowLeft className="w-4 h-4" /> {t('back')}
      </Button>
      <div
        className="rounded-2xl p-6 backdrop-blur-xl transition-all duration-200 hover:-translate-y-px"
        style={{ background:'#1a1a2e', border:'1px solid rgba(255,255,255,0.06)', boxShadow:'0 4px 24px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.03)' }}
      >
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="min-w-0">
            <h1 className="text-[28px] font-bold text-white tracking-tight leading-tight truncate">{title}</h1>
            {subtitle && <p className="text-sm text-white/50 mt-1">{subtitle}</p>}
          </div>
          {badge}
        </div>
        <div className="h-px w-10 bg-white/[0.06] mb-5" />
        {info.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-5">
            {info.map((item, i) => (
              <div key={i} className="min-w-0">
                <p className="text-[11px] uppercase tracking-[0.05em] text-white/40 font-medium">{item.label}</p>
                <p className="text-sm text-white font-medium mt-1 truncate">{item.value || '—'}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}