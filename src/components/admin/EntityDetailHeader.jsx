import { useNavigate } from 'react-router-dom';
import { useI18n } from '@/lib/i18n';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

export default function EntityDetailHeader({ title, subtitle, badge, info = [], backTo }) {
  const navigate = useNavigate();
  const { t } = useI18n();
  return (
    <div>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => backTo ? navigate(backTo) : navigate(-1)}
        aria-label={t('back')}
        className="back-btn w-9 h-9 rounded-full glass-sm border border-white/10 text-muted-foreground hover:text-foreground transition-colors duration-200 active:scale-[0.97]">
        <ArrowLeft className="back-arrow w-4 h-4" />
      </Button>
      





















      
    </div>);

}