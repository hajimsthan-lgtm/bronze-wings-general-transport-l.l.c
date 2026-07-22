import { Link } from 'react-router-dom';
import { ArrowUpRight } from 'lucide-react';

export default function RecentActivityRow({ to, icon: Icon, iconBg, iconClass, title, subtitle }) {
  return (
    <Link to={to} className="flex items-center gap-3 py-2.5 group hover:bg-white/[0.02] rounded-lg px-2 -mx-2 transition-colors">
      <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${iconBg}`}>
        <Icon className={`w-4 h-4 ${iconClass}`} />
      </div>
      <div className="flex-1 min-w-0 pr-2">
        <p className="text-sm font-medium text-white/80 truncate">{title}</p>
        <p className="text-[11px] text-white/35 truncate">{subtitle}</p>
      </div>
      <ArrowUpRight className="w-4 h-4 text-white/25 group-hover:text-blue-400 transition-colors flex-shrink-0" />
    </Link>
  );
}