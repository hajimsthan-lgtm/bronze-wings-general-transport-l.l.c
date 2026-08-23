import { Plus } from 'lucide-react';

const ACTION_BTN_CLASS =
  'hidden md:inline-flex items-center gap-1.5 h-8 px-4 rounded-full text-xs font-semibold uppercase tracking-wider text-white transition-all whitespace-nowrap flex-shrink-0 bg-gradient-to-br from-blue-500 to-blue-600 shadow-[0_0_0_1px_rgba(59,130,246,0.4),0_6px_18px_-6px_rgba(59,130,246,0.6)] hover:brightness-110 hover:-translate-y-0.5';

export default function HeaderActionButton({ icon: Icon = Plus, label, onClick, variant = 'trip', ariaLabel }) {
  return (
    <button
      onClick={onClick}
      aria-label={ariaLabel || label}
      title={ariaLabel || label}
      className={ACTION_BTN_CLASS}
    >
      <Icon className="w-3.5 h-3.5" /> {label}
    </button>
  );
}