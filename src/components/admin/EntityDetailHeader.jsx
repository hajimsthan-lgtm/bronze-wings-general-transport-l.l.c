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
      <div className="glass-card p-5">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className="text-xl font-display font-bold text-foreground">{title}</h1>
            {subtitle && <p className="text-sm text-muted-foreground mt-0.5">{subtitle}</p>}
          </div>
          {badge}
        </div>
        {info.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {info.map((item, i) => (
              <div key={i}>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">{item.label}</p>
                <p className="text-sm text-foreground font-medium">{item.value || '—'}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}