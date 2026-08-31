import { motion } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';

const TABS = [
{ label: 'Trips', path: '/trips' },
{ label: 'Maintenance', path: '/maintenance' },
{ label: 'Fuel', path: '/fuel' },
{ label: 'Expenses', path: '/expenses' },
{ label: 'Salary', path: '/salary' }];


export default function OperationsTabSeparator({ activePath }) {
  const navigate = useNavigate();
  const location = useLocation();
  const current = activePath || location.pathname;

  return (
    <div className="flex bg-slate-100 dark:bg-slate-800/60 rounded-2xl p-1 overflow-x-auto no-scrollbar">
      {TABS.map((t) => {
        const isActive = current === t.path || current.startsWith(t.path + '/');
        return (
          <button
            key={t.path}
            onClick={() => navigate(t.path)}
            className="relative px-4 py-2 text-sm font-medium whitespace-nowrap flex-1 min-w-[80px] hidden">
            
            {isActive &&
            <motion.span
              layoutId="ops-tab"
              className="absolute inset-0 rounded-xl bg-white dark:bg-slate-700 shadow"
              transition={{ type: 'spring', stiffness: 400, damping: 30 }} />

            }
            <span className={`relative ${isActive ? 'text-violet-600 dark:text-violet-300' : 'text-slate-500 dark:text-slate-400'}`}>
              {t.label}
            </span>
          </button>);

      })}
    </div>);

}