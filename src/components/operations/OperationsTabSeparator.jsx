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
        return null;

















      })}
    </div>);

}