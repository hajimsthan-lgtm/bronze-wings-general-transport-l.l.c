import { useState, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useUFTheme, useBookmarks, useSearchHistory } from '@/components/uiforge/hooks';
import BottomNav from '@/components/uiforge/BottomNav';
import HomeScreen from '@/components/uiforge/screens/HomeScreen';
import ComponentsScreen from '@/components/uiforge/screens/ComponentsScreen';
import SavedScreen from '@/components/uiforge/screens/SavedScreen';
import SearchScreen from '@/components/uiforge/screens/SearchScreen';
import ThemeScreen from '@/components/uiforge/screens/ThemeScreen';
import '@/components/uiforge/uiforge.css';

const TAB_ORDER = ['home', 'components', 'saved', 'search', 'theme'];

export default function UIForge() {
  const { theme, toggle } = useUFTheme();
  const { bookmarks, toggle: toggleBookmark, has } = useBookmarks();
  const { history, add, remove } = useSearchHistory();
  const [tab, setTab] = useState('home');
  const [direction, setDirection] = useState(0);

  const go = useCallback((next) => {
    setDirection(TAB_ORDER.indexOf(next) - TAB_ORDER.indexOf(tab));
    setTab(next);
  }, [tab]);

  const variants = {
    enter: (dir) => ({ x: dir > 0 ? 40 : -40, opacity: 0, scale: 0.98 }),
    center: { x: 0, opacity: 1, scale: 1 },
    exit: (dir) => ({ x: dir > 0 ? -40 : 40, opacity: 0, scale: 0.98 }),
  };

  return (
    <div className="uf-bg min-h-screen flex justify-center" style={{ background: 'rgb(var(--uf-bg))' }}>
      <div className={`uiforge-scope ${theme === 'dark' ? 'uf-dark' : ''} relative w-full max-w-md mx-auto overflow-hidden uf-bg`} style={{ background: 'rgb(var(--uf-bg))', minHeight: '100vh' }}>
        <style>{`@keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } } @keyframes shine { 0% { background-position: 0% 50%; } 100% { background-position: 200% 50%; } }`}</style>
        <div className="relative" style={{ height: 'calc(100vh - 0px)' }}>
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={tab}
              custom={direction}
              variants={variants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
              className="absolute inset-0 overflow-y-auto uf-scroll pb-20"
            >
              {tab === 'home' && <HomeScreen theme={theme} onToggleTheme={toggle} onGoSearch={() => go('search')} onGoComponents={() => go('components')} />}
              {tab === 'components' && <ComponentsScreen bookmarks={bookmarks} onToggleBookmark={toggleBookmark} />}
              {tab === 'saved' && <SavedScreen bookmarks={bookmarks} onToggleBookmark={toggleBookmark} />}
              {tab === 'search' && <SearchScreen history={history} onAddHistory={add} onRemoveHistory={remove} onGoComponents={() => go('components')} />}
              {tab === 'theme' && <ThemeScreen />}
            </motion.div>
          </AnimatePresence>
          <BottomNav active={tab} onChange={go} />
        </div>
      </div>
    </div>
  );
}