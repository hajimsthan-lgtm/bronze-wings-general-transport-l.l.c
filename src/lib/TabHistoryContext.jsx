import { createContext, useContext, useState, useRef, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

const TabHistoryContext = createContext(null);

const TAB_ROOTS = {
  dashboard: '/',
  operations: '/trips',
  reports: '/reports/daily',
  admin: '/admin/vehicles',
  settings: '/settings',
};

/**
 * Determines which bottom-nav tab a pathname belongs to.
 */
export function getTabFromPath(pathname) {
  if (pathname === '/') return 'dashboard';
  if (pathname.startsWith('/trips') || pathname.startsWith('/contracts') || pathname.startsWith('/expenses')) return 'operations';
  if (pathname.startsWith('/reports')) return 'reports';
  if (pathname.startsWith('/settings')) return 'settings';
  if (pathname.startsWith('/admin')) return 'admin';
  return 'dashboard';
}

export function TabHistoryProvider({ children }) {
  const location = useLocation();
  const navigate = useNavigate();
  const tabRoutes = useRef({});
  const [activeTab, setActiveTab] = useState(() => getTabFromPath(location.pathname));

  // Track every route change and cache it under the tab it belongs to
  useEffect(() => {
    const tab = getTabFromPath(location.pathname);
    tabRoutes.current[tab] = location.pathname;
    setActiveTab(tab);
  }, [location.pathname]);

  // Switch to a tab — navigates to the cached route for that tab (or its root).
  // Double-tapping the active tab resets it back to its root.
  const switchTab = (tabKey) => {
    const root = TAB_ROOTS[tabKey];
    if (!root) return;
    if (tabKey === activeTab) {
      tabRoutes.current[tabKey] = root;
      if (location.pathname !== root) navigate(root, { replace: true });
      return;
    }
    const cachedRoute = tabRoutes.current[tabKey] || root;
    setActiveTab(tabKey);
    if (cachedRoute !== location.pathname) {
      navigate(cachedRoute, { replace: true });
    }
  };

  return (
    <TabHistoryContext.Provider value={{ activeTab, switchTab }}>
      {children}
    </TabHistoryContext.Provider>
  );
}

export function useTabHistory() {
  const ctx = useContext(TabHistoryContext);
  if (!ctx) return { activeTab: null, switchTab: () => {} };
  return ctx;
}