import { useNavigate } from 'react-router-dom';
import { useI18n } from '@/lib/i18n';
import { ArrowLeft } from 'lucide-react';

export default function EntityDetailHeader({ title, subtitle, badge, info = [], backTo }) {
  const navigate = useNavigate();
  const { t } = useI18n();
  return (
    <div>
      <button
        type="button"
        onClick={() => backTo ? navigate(backTo) : navigate(-1)}
        aria-label={t('back')}
        className="back-btn w-9 h-9 rounded-full flex items-center justify-center text-muted-foreground hover:bg-muted hover:text-foreground transition-all duration-150 active:scale-95 hidden">
        
      </button>
    </div>);

}