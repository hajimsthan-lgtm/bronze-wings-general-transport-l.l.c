import { useNavigate } from 'react-router-dom';
import { useI18n } from '@/lib/i18n';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

export default function EntityDetailHeader({ title, subtitle, badge, info = [], backTo }) {
  const navigate = useNavigate();
  const { t } = useI18n();
  return (
    <div className="mb-6">
      <Button variant="ghost" size="sm" onClick={() => backTo ? navigate(backTo) : navigate(-1)} className="text-muted-foreground hover:text-foreground mb-3 -ml-2">
        <ArrowLeft className="w-4 h-4" /> {t('back')}
      </Button>
      <div className="detail-header-card">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">{title}</h1>
            {subtitle && <p className="text-sm text-white/50 mt-0.5">{subtitle}</p>}
          </div>
          {badge}
        </div>
        {info.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {info.map((item, i) => (
              <div key={i}>
                <p className="text-[10px] uppercase tracking-widest text-white/30 font-medium">{item.label}</p>
                <p className="text-sm text-white/80 font-medium">{item.value || '—'}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}