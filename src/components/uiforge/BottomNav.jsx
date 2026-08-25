import { motion } from 'framer-motion';
import { Home, LayoutGrid, Bookmark, Search, Palette } from 'lucide-react';

const TABS = [
  { id: 'home', label: 'Home', icon: Home },
  { id: 'components', label: 'Components', icon: LayoutGrid },
  { id: 'saved', label: 'Saved', icon: Bookmark },
  { id: 'search', label: 'Search', icon: Search },
  { id: 'theme', label: 'Theme', icon: Palette },
];

export default function BottomNav({ active, onChange }) {
  return (
    <div className="absolute bottom-0 left-0 right-0 z-50">
      <div className="uf-glass border-t" style={{ borderColor: 'rgb(var(--uf-border))' }}>
        <div className="flex items-center justify-around px-2 py-1.5 pb-3">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = active === tab.id;
            return (
              <button key={tab.id} onClick={() => onChange(tab.id)} className="relative flex flex-col items-center gap-0.5 px-3 py-1.5 min-w-[56px]">
                {isActive && (
                  <motion.div
                    layoutId="uf-nav-pill"
                    className="absolute inset-0 rounded-xl uf-bg-primary"
                    style={{ background: 'rgb(var(--uf-primary))' }}
                    transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                  />
                )}
                <motion.div
                  animate={{ scale: isActive ? 1 : 0.9, y: isActive ? -1 : 0 }}
                  className="relative z-10"
                >
                  <Icon className="w-5 h-5" style={{ color: isActive ? 'rgb(var(--uf-primary-fg))' : 'rgb(var(--uf-muted))' }} />
                </motion.div>
                <span className="relative z-10 text-[9px] font-medium" style={{ color: isActive ? 'rgb(var(--uf-primary-fg))' : 'rgb(var(--uf-muted))' }}>
                  {tab.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}