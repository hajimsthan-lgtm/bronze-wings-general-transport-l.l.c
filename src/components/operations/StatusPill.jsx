const VARIANTS = {
  green: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  amber: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  blue: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  red: 'bg-red-500/10 text-red-400 border-red-500/20',
  neutral: 'bg-zinc-500/10 text-zinc-300 border-zinc-500/20',
};

const DOTS = {
  green: 'bg-emerald-400',
  amber: 'bg-amber-400',
  blue: 'bg-blue-400',
  red: 'bg-red-400',
  neutral: 'bg-zinc-400',
};

export default function StatusPill({ children, variant = 'neutral', dot = false, as = 'span', className = '', ...props }) {
  const Tag = as;
  return (
    <Tag
      className={`inline-flex items-center gap-1.5 h-6 px-2.5 rounded-full text-[11px] font-medium border whitespace-nowrap transition-colors ${VARIANTS[variant] || VARIANTS.neutral} ${className}`}
      {...props}
    >
      {dot && <span className={`w-1.5 h-1.5 rounded-full ${DOTS[variant] || DOTS.neutral}`} />}
      {children}
    </Tag>
  );
}

export const statusVariant = (status) => {
  const map = {
    completed: 'green', active: 'green', paid: 'green',
    in_transit: 'amber', pending: 'amber', partially_paid: 'amber', expiring_soon: 'amber',
    scheduled: 'blue', sent: 'blue',
    cancelled: 'red', expired: 'red', terminated: 'red', overdue: 'red',
  };
  return map[status] || 'neutral';
};