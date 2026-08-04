import { createContext, useContext, useState, useCallback } from 'react';

const GlobalDateContext = createContext(null);

const monthStart = () => {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().split('T')[0];
};
const todayStr = () => new Date().toISOString().split('T')[0];

export function GlobalDateProvider({ children }) {
  const [dateFrom, setDateFrom] = useState(monthStart);
  const [dateTo, setDateTo] = useState(todayStr);

  const setToday = useCallback(() => {
    const t = todayStr();
    setDateFrom(t);
    setDateTo(t);
  }, []);

  return (
    <GlobalDateContext.Provider value={{ dateFrom, dateTo, setDateFrom, setDateTo, setToday }}>
      {children}
    </GlobalDateContext.Provider>
  );
}

export function useGlobalDate() {
  const ctx = useContext(GlobalDateContext);
  if (!ctx) return { dateFrom: monthStart(), dateTo: todayStr(), setDateFrom: () => {}, setDateTo: () => {}, setToday: () => {} };
  return ctx;
}