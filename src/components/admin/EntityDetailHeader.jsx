import { useNavigate } from 'react-router-dom';
import { useI18n } from '@/lib/i18n';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

export default function EntityDetailHeader({ title, subtitle, badge, info = [], backTo }) {
  const navigate = useNavigate();
  const { t } = useI18n();
  return (
    <div className="mb-6">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => backTo ? navigate(backTo) : navigate(-1)}
        className="back-btn text-muted-foreground hover:text-foreground mb-3 -ml-2 transition-colors duration-200 active:scale-[0.97]">
        
        <ArrowLeft className="back-arrow w-4 h-4" /> {t('back')}
      </Button>
      





















      
    </div>);

}