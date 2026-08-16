import { Plus } from 'lucide-react';

const ACTION_BTN_CLASS =
  'inline-flex items-center gap-1.5 h-8 px-4 rounded-full text-xs font-semibold uppercase tracking-wider text-white transition-all whitespace-nowrap flex-shrink-0';

export default function HeaderActionButton({ icon: Icon = Plus, label, onClick, variant = 'trip', ariaLabel }) {
  return (
    <button
      onClick={onClick}
      aria-label={ariaLabel || label}
      title={ariaLabel || label}
      className={`btn-new-${variant} ${ACTION_BTN_CLASS}`}
    >
      <Icon className="w-3.5 h-3.5" /> {label}
    </button>
  );
}